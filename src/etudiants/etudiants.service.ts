import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import * as bcrypt from 'bcrypt';

// Payload accepté pour la mise à jour
interface UpdateEtudiantPayload {
  // Champs de la table étudiant
  prenom?: string;
  matricule?: string;
  date_naissance?: Date | string;
  lieu_naissance?: string;
  bac_type?: string;
  annee_bac?: number;
  provenance?: string;
  // Champs remontés de la table utilisateur parente
  nom?: string;
  email?: string;
  password?: string;
  // Nouveaux champs
  classeId?: string;
  statut?: any;
}

@Injectable()
export class EtudiantsService {
  constructor(private prisma: PrismaService) {}

  /** Valeurs par défaut pour les champs facultatifs non fournis à l'inscription. */
  private static readonly DEFAULT_PASSWORD = process.env.DEFAULT_ETUDIANT_PASSWORD || 'pass1234';
  private static readonly DEFAULT_LIEU = '-';
  private static readonly DEFAULT_BAC_TYPE = '';
  private static readonly DEFAULT_PROVENANCE = '';

  private generateMatricule(nom: string): string {
    const year = new Date().getFullYear();
    const cleanNom = nom.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'ETU';
    const suffix = Math.floor(Math.random() * 900) + 100;
    return `${year}${cleanNom}${suffix}`;
  }

  private generateEmail(nom: string, prenom: string): string {
    const cleanNom = nom.toLowerCase().replace(/[^a-z0-9]/g, '') || 'etudiant';
    const cleanPrenom = prenom.toLowerCase().replace(/[^a-z0-9]/g, '') || 'inconnu';
    const suffix = Date.now().toString().slice(-6);
    return `${cleanNom}.${cleanPrenom}.${suffix}@inptic.ga`;
  }

  private normalizeCreateDto(dto: CreateEtudiantDto): Required<
    Pick<CreateEtudiantDto, 'nom' | 'prenom'>
  > & {
    date_naissance: Date | null;
    matricule: string;
    email: string;
    password: string;
    lieu_naissance: string;
    bac_type: string;
    annee_bac: number;
    provenance: string;
    classeId: string | null;
    statut: any;
  } {
    const nom = dto.nom?.trim();
    const prenom = dto.prenom?.trim();

    if (!nom) throw new BadRequestException('Le nom est obligatoire.');
    if (!prenom) throw new BadRequestException('Le prénom est obligatoire.');

    let parsedDate: Date | null = null;
    if (dto.date_naissance) {
      const d = new Date(dto.date_naissance);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    return {
      nom,
      prenom,
      date_naissance: parsedDate,
      matricule: dto.matricule?.trim() || this.generateMatricule(nom),
      email: dto.email?.trim() || this.generateEmail(nom, prenom),
      password: dto.password || EtudiantsService.DEFAULT_PASSWORD,
      lieu_naissance: dto.lieu_naissance?.trim() || EtudiantsService.DEFAULT_LIEU,
      bac_type: dto.bac_type?.trim() || EtudiantsService.DEFAULT_BAC_TYPE,
      annee_bac: dto.annee_bac ?? 0,
      provenance: dto.provenance?.trim() || EtudiantsService.DEFAULT_PROVENANCE,
      classeId: dto.classeId || null,
      statut: dto.statut || 'INSCRIT',
    };
  }

  async create(createEtudiantDto: CreateEtudiantDto) {
    const normalized = this.normalizeCreateDto(createEtudiantDto);

    // 1. Vérifier si un utilisateur existe déjà avec cet email
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: normalized.email },
    });

    // 2. Vérifier si un étudiant existe déjà avec ce matricule
    const existingEtudiant = await this.prisma.etudiant.findUnique({
      where: { matricule: normalized.matricule },
    });

    let utilisateurId: string;

    if (existingUser) {
      utilisateurId = existingUser.id;
    } else {
      const hashedPassword = await bcrypt.hash(normalized.password, 10);
      const utilisateur = await this.prisma.utilisateur.create({
        data: {
          nom: normalized.nom,
          password: hashedPassword,
          email: normalized.email,
          role: 'ETUDIANT',
        },
      });
      utilisateurId = utilisateur.id;
    }

    const dateNaiss = normalized.date_naissance;

    if (existingEtudiant) {
      // Mettre à jour l'étudiant existant s'il existe déjà
      return this.prisma.etudiant.update({
        where: { matricule: normalized.matricule },
        data: {
          prenom: normalized.prenom,
          date_naissance: dateNaiss,
          lieu_naissance: normalized.lieu_naissance,
          bac_type: normalized.bac_type,
          annee_bac: normalized.annee_bac,
          provenance: normalized.provenance,
          classeId: normalized.classeId,
          statut: normalized.statut,
        },
        include: {
          utilisateur: {
            select: { id: true, email: true, nom: true, role: true },
          },
          classe: { select: { id: true, nom: true, code: true } },
        },
      });
    }

    // Créer un nouvel étudiant
    return this.prisma.etudiant.create({
      data: {
        utilisateurId: utilisateurId,
        prenom: normalized.prenom,
        matricule: normalized.matricule,
        date_naissance: dateNaiss,
        lieu_naissance: normalized.lieu_naissance,
        bac_type: normalized.bac_type,
        annee_bac: normalized.annee_bac,
        provenance: normalized.provenance,
        classeId: normalized.classeId,
        statut: normalized.statut,
      },
      include: {
        utilisateur: {
          select: { id: true, email: true, nom: true, role: true },
        },
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  /**
   * Retourne uniquement les étudiants dont l'enseignant a la charge :
   * Enseignant -> MatiereEnseignant -> Matiere -> UE -> Semestre -> SemestreClasse -> Classe -> Etudiant
   * (ainsi que les étudiants ayant déjà une évaluation dans une des matières de l'enseignant).
   */
  async findForEnseignant(enseignantUserId: string, matiereId?: string, classeId?: string) {
    // 1. Récupérer les matières assignées à cet enseignant
    const affectations = await this.prisma.matiereEnseignant.findMany({
      where: {
        utilisateurId: enseignantUserId,
        ...(matiereId ? { matiereId } : {}),
      },
      include: {
        matiere: {
          include: {
            uniteEnseignement: {
              include: {
                semestre: {
                  include: {
                    classes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Si l'enseignant n'a aucune matière assignée (ou n'est pas assigné à la matière demandée) -> 0 étudiant
    if (affectations.length === 0) {
      return [];
    }

    const matiereIds = affectations.map((a) => a.matiereId);
    const classeIdsSet = new Set<string>();

    for (const aff of affectations) {
      const semClasses = aff.matiere?.uniteEnseignement?.semestre?.classes || [];
      for (const sc of semClasses) {
        if (sc.classeId) {
          classeIdsSet.add(sc.classeId);
        }
      }
    }

    let allowedClasseIds = [...classeIdsSet];
    if (classeId) {
      allowedClasseIds = allowedClasseIds.filter((id) => id === classeId);
    }

    // Construire la condition : étudiants des classes rattachées aux matières de l'enseignant
    // OU étudiants ayant déjà une évaluation saisie dans ces matières (si pas de filtre classeId strict)
    const orConditions: any[] = [];
    if (allowedClasseIds.length > 0) {
      orConditions.push({ classeId: { in: allowedClasseIds } });
    }
    if (!classeId && matiereIds.length > 0) {
      orConditions.push({
        utilisateur: {
          evaluations: {
            some: { matiereId: { in: matiereIds } },
          },
        },
      });
    }

    if (orConditions.length === 0) {
      return [];
    }

    return this.prisma.etudiant.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
        classe: {
          select: {
            id: true,
            nom: true,
            code: true,
            anneeUniversitaire: true,
            filiere: { select: { id: true, nom: true, code: true } },
          },
        },
      },
      orderBy: { matricule: 'asc' },
    });
  }

  async findAll(page?: number, limit?: number) {
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.etudiant.findMany({
          skip,
          take: limit,
          include: {
            utilisateur: {
              select: { id: true, email: true, nom: true, role: true },
            },
            classe: { select: { id: true, nom: true, code: true } },
          },
        }),
        this.prisma.etudiant.count(),
      ]);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Comportement par défaut (rétrocompatibilité)
    return this.prisma.etudiant.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async findOne(utilisateurId: string) {
    return this.prisma.etudiant.findUnique({
      where: { utilisateurId },
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async update(utilisateurId: string, payload: UpdateEtudiantPayload) {
    // Séparer les champs de l'utilisateur parent des champs propres à l'étudiant
    const { nom, email, password, ...etudiantData } = payload;

    // Vérifier que l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur) throw new NotFoundException(`Étudiant avec l'ID "${utilisateurId}" non trouvé`);

    // Construire la mise à jour utilisateur (nom, email, mot de passe si fourni)
    const utilisateurUpdate: any = {};
    if (nom) utilisateurUpdate.nom = nom;
    if (email) utilisateurUpdate.email = email;
    if (password) utilisateurUpdate.password = await bcrypt.hash(password, 10);

    // Assurer que date_naissance est au format ISO-8601 pour Prisma
    if (etudiantData.date_naissance && typeof etudiantData.date_naissance === 'string') {
      etudiantData.date_naissance = new Date(etudiantData.date_naissance).toISOString() as any;
    }

    // Exécuter en transaction : utilisateur d'abord, puis étudiant
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(utilisateurUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id: utilisateurId }, data: utilisateurUpdate });
      }
      return tx.etudiant.update({
        where: { utilisateurId },
        data: etudiantData as any,
        include: {
          utilisateur: { select: { id: true, email: true, nom: true, role: true } },
          classe: { select: { id: true, nom: true, code: true } },
        },
      });
    });
  }

  async remove(utilisateurId: string) {
    // Vérifier que l'utilisateur existe avant de supprimer
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Étudiant avec l'ID "${utilisateurId}" non trouvé`);
    }

    // Supprime l'utilisateur ; en base, CASCADE efface étudiant + évaluations, absences, moyennes, résultats, affectations matière.
    return this.prisma.utilisateur.delete({
      where: { id: utilisateurId },
      select: { id: true, nom: true, email: true, role: true },
    });
  }

  async findByMatricule(matricule: string) {
    return this.prisma.etudiant.findFirst({
      where: { matricule },
      include: {
        utilisateur: {
          select: { id: true, nom: true, email: true, role: true },
        },
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async findByUserId(utilisateurId: string) {
    return this.prisma.etudiant.findUnique({
      where: { utilisateurId },
      include: {
        utilisateur: {
          select: { id: true, nom: true, email: true, role: true },
        },
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async findByNom(nom: string) {
    return this.prisma.utilisateur.findMany({
      where: { nom, role: 'ETUDIANT' },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        etudiant: true,
      },
    });
  }
}
