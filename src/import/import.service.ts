import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculsService } from '../calculs/calculs.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

interface MetaFeuille {
  classeNom: string;
  annee: string;
  matiereLibelle: string;
  coefficient: number;
  semestreNum: string;
}

export interface ResultatFeuille {
  onglet: string;
  matiere: string;
  nbNotesImportees: number;
  nbEtudiantsCreees: number;
  nbEtudiantsMisAJour: number;
  nbErreurs: number;
  erreurs: string[];
}

export interface ResultatImport {
  type: 'classeur_multi_onglets';
  classe: string;
  annee: string;
  semestre: string;
  nbOngletstraites: number;
  nbOngletIgnores: number;
  totalEtudiantsCreees: number;
  totalEtudiantsMisAJour: number;
  totalNotesImportees: number;
  totalErreurs: number;
  details: ResultatFeuille[];
}

// Onglets à ignorer (pas des matières)
const ONGLETS_IGNORES = [
  'absence', 'absences', 'bulletin', 'tabnot', 'tabnotss',
  'resultat', 'recap', 'jury', 'feuille', 'raz', 'lan',
  'envwin', 'envlinx', 'interop', 'crypt', 'prev', 'contrl', 'ccna',
];

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private calculsService: CalculsService,
  ) {}

  // Hash rapide pour l'import — mot de passe unique par étudiant (pas bcrypt)
  // L'étudiant devra changer son mot de passe à la première connexion
  private hasherMotDePasse(nom: string): string {
    const sel = process.env.IMPORT_PASSWORD_SALT || 'bull_asur_import_2026';
    const defaultPwd = process.env.DEFAULT_ETUDIANT_PASSWORD || 'pass1234';
    return '$import$' + crypto
      .createHash('sha256')
      .update(`${defaultPwd}_${nom.toLowerCase()}_${sel}`)
      .digest('hex')
      .substring(0, 40);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POINT D'ENTRÉE : lit tous les onglets du classeur
  // ─────────────────────────────────────────────────────────────────────────
  async importerFichierExcel(buffer: Buffer, _nomFichier: string, classeIdForce?: string): Promise<ResultatImport> {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new BadRequestException('Le fichier Excel est vide ou illisible.');
    }

    const resultat: ResultatImport = {
      type: 'classeur_multi_onglets',
      classe: '',
      annee: '',
      semestre: '',
      nbOngletstraites: 0,
      nbOngletIgnores: 0,
      totalEtudiantsCreees: 0,
      totalEtudiantsMisAJour: 0,
      totalNotesImportees: 0,
      totalErreurs: 0,
      details: [],
    };

    // Contexte partagé entre les onglets (classe, UE parent)
    let classeId: string | null = null;
    const semestresCache = new Map<string, string>(); // sCode -> semestreId
    let classeNomGlobal = '';
    let anneeGlobale = '';
    let semestreNumGlobal = '';
    const utilisateursTraites = new Set<string>(); // pour recalcul différé

    for (const sheetName of workbook.SheetNames) {
      const nomLower = sheetName.toLowerCase().trim();

      // Ignorer les onglets non-matière
      if (ONGLETS_IGNORES.some((k) => nomLower.includes(k))) {
        resultat.nbOngletIgnores++;
        continue;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: false,
      });

      if (!rows || rows.length < 5) {
        resultat.nbOngletIgnores++;
        continue;
      }

      // Vérifier que l'onglet ressemble à un relevé de notes
      const texteDebut = rows
        .slice(0, 15)
        .flat()
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');

      const estReleveNotes =
        texteCompletContient(texteDebut, ['classe', 'mati', 'coefficient', 'semestre', 'élève', 'eleve', 'releve']);

      if (!estReleveNotes) {
        resultat.nbOngletIgnores++;
        continue;
      }

      // Parser la feuille
      const meta = this.extraireMeta(rows);

      // Alimenter les valeurs globales depuis le premier onglet traité
      if (!classeNomGlobal && meta.classeNom) classeNomGlobal = meta.classeNom;
      if (!anneeGlobale && meta.annee) anneeGlobale = meta.annee;
      if (!semestreNumGlobal && meta.semestreNum) semestreNumGlobal = meta.semestreNum;

      // Créer/récupérer classe et semestre une seule fois
      if (!classeId) {
        const classeAnnee = anneeGlobale || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        if (classeIdForce) {
          // Utiliser la classe existante passée par le frontend
          classeId = classeIdForce;
          const classeExistante = await this.prisma.classe.findUnique({ where: { id: classeId } });
          if (classeExistante) {
            resultat.classe = classeExistante.nom;
            resultat.annee = classeExistante.anneeUniversitaire;
            classeNomGlobal = classeExistante.nom;
            anneeGlobale = classeExistante.anneeUniversitaire;
          }
        } else {
          const codeClasse = (classeNomGlobal || 'IMPORT')
            .replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/gi, '').substring(0, 30).toUpperCase();
          const classe = await this.prisma.classe.upsert({
            where: { code: codeClasse },
            update: {},
            create: { nom: classeNomGlobal || 'Classe Importée', code: codeClasse, anneeUniversitaire: classeAnnee },
          });
          classeId = classe.id;
          resultat.classe = classeNomGlobal;
          resultat.annee = classeAnnee;
        }
      }

      // Créer/récupérer le semestre pour cette feuille
      const sNum = meta.semestreNum || semestreNumGlobal || '1';
      const sCode = `S${sNum}-${anneeGlobale || resultat.annee}`;
      let sheetSemestreId = semestresCache.get(sCode);
      if (!sheetSemestreId) {
        const semestre = await this.prisma.semestre.upsert({
          where: { code: sCode },
          update: {},
          create: {
            code: sCode,
            libelle: `Semestre ${sNum}`,
            anneeUniversitaire: anneeGlobale || resultat.annee,
          },
        });
        sheetSemestreId = semestre.id;
        semestresCache.set(sCode, sheetSemestreId);
        resultat.semestre = `S${sNum}`;

        // Lier classe au semestre
        await this.prisma.semestreClasse.upsert({
          where: { semestreId_classeId: { semestreId: semestre.id, classeId: classeId! } },
          update: {},
          create: { semestreId: semestre.id, classeId: classeId! },
        });
      }

      // Traiter l'onglet comme une matière
      const resFeuille = await this.traiterFeuilleMatieres(
        rows, sheetName, meta, classeId!, sheetSemestreId, utilisateursTraites,
      );

      resultat.details.push(resFeuille);
      resultat.nbOngletstraites++;
      resultat.totalEtudiantsCreees += resFeuille.nbEtudiantsCreees;
      resultat.totalEtudiantsMisAJour += resFeuille.nbEtudiantsMisAJour;
      resultat.totalNotesImportees += resFeuille.nbNotesImportees;
      resultat.totalErreurs += resFeuille.nbErreurs;
    }

    if (resultat.nbOngletstraites === 0) {
      throw new BadRequestException(
        'Aucun onglet de relevé de notes reconnu dans ce classeur. ' +
        'Vérifiez que les onglets contiennent : Classe, Matière, Coefficient, Semestre.',
      );
    }

    // ── Recalcul différé : une seule passe pour tous les étudiants ──────────
    const idsARecalculer = [...utilisateursTraites];
    await Promise.all(
      idsARecalculer.map((uid) =>
        this.calculsService.recalculerToutPourEtudiant(uid).catch(() => {}),
      ),
    );

    return resultat;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXTRAIRE LES MÉTA-DONNÉES D'UN ONGLET (lignes 9-12 du modèle)
  // ─────────────────────────────────────────────────────────────────────────
  private extraireMeta(rows: any[][]): MetaFeuille {
    let classeNom = '';
    let annee = '';
    let matiereLibelle = '';
    let coefficient = 1;
    let semestreNum = '1';

    for (let i = 0; i < Math.min(18, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      const cells = row.map((v) => (v !== null && v !== undefined ? String(v).trim() : ''));

      // Chercher chaque cellule et la suivante (pattern label : valeur)
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j].toLowerCase();
        const valNext = cells[j + 1] || cells[j + 2] || '';

        if (cell.startsWith('classe') && !classeNom) {
          classeNom = valNext.trim();
        }
        if ((cell.startsWith('ann') || cell.startsWith('année')) && !annee) {
          // Chercher pattern YYYY/YYYY ou YYYY-YYYY dans la même ligne
          const ligneTexte = cells.join(' ');
          const m = ligneTexte.match(/(\d{4})[\/\-](\d{4})/);
          if (m) annee = `${m[1]}-${m[2]}`;
        }
        if ((cell.startsWith('mati') || cell.startsWith('mat.')) && !matiereLibelle) {
          matiereLibelle = valNext.trim();
        }
        if (cell.startsWith('coef') && !coefficient) {
          const n = parseFloat(valNext.replace(',', '.'));
          if (!isNaN(n)) coefficient = n;
        }
        if (cell === 'coefficient' || cell === 'coef') {
          // valeur directement dans la cellule suivante
          const n = parseFloat(valNext.replace(',', '.'));
          if (!isNaN(n)) coefficient = n;
        }
        if (cell.startsWith('semestre') && semestreNum === '1') {
          const m = valNext.match(/(\d+)/);
          if (m) semestreNum = m[1];
          else {
            const m2 = cells.join(' ').match(/semestre\s*:?\s*(\d+)/i);
            if (m2) semestreNum = m2[1];
          }
        }
      }

      // Chercher le coefficient seul dans une cellule numérique après le label "Coefficient"
      const texte = cells.join(' ');
      if (!classeNom) {
        const m = texte.match(/classe\s*:?\s*([A-Z][A-Z0-9 \-]+)/i);
        if (m) classeNom = m[1].trim();
      }
      if (!annee) {
        const m = texte.match(/(\d{4})[\/\-](\d{4})/);
        if (m) annee = `${m[1]}-${m[2]}`;
      }
      if (!matiereLibelle) {
        const m = texte.match(/mati[eè]re\s*:?\s*([^\n\r\t]{3,50})/i);
        if (m) matiereLibelle = m[1].trim();
      }
      if (coefficient === 1) {
        const m = texte.match(/coefficient\s*:?\s*(\d+(?:[.,]\d+)?)/i);
        if (m) coefficient = parseFloat(m[1].replace(',', '.'));
      }
      if (semestreNum === '1') {
        const m = texte.match(/semestre\s*:?\s*(\d+)/i);
        if (m) semestreNum = m[1];
      }
    }

    return { classeNom, annee, matiereLibelle, coefficient, semestreNum };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRAITER UN ONGLET = UNE MATIÈRE
  // ─────────────────────────────────────────────────────────────────────────
  private async traiterFeuilleMatieres(
    rows: any[][],
    nomOnglet: string,
    meta: MetaFeuille,
    classeId: string,
    semestreId: string,
    utilisateursTraites: Set<string>, // partagé entre onglets pour recalcul différé
  ): Promise<ResultatFeuille> {
    const res: ResultatFeuille = {
      onglet: nomOnglet,
      matiere: meta.matiereLibelle || nomOnglet,
      nbNotesImportees: 0,
      nbEtudiantsCreees: 0,
      nbEtudiantsMisAJour: 0,
      nbErreurs: 0,
      erreurs: [],
    };

    // --- Créer UE et Matière ---
    const matiereLibelle = meta.matiereLibelle || nomOnglet;
    const ueCode = `UE-${matiereLibelle.replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/gi, '').substring(0, 20).toUpperCase()}-S${meta.semestreNum}`;

    const ue = await this.prisma.uniteEnseignement.upsert({
      where: { code: ueCode },
      update: {},
      create: {
        code: ueCode,
        libelle: matiereLibelle,
        semestreId,
        coefficient: meta.coefficient,
        credits: meta.coefficient,
      },
    });

    let matiere = await this.prisma.matiere.findFirst({
      where: { libelle: matiereLibelle, uniteEnseignementId: ue.id },
    });
    if (!matiere) {
      matiere = await this.prisma.matiere.create({
        data: {
          libelle: matiereLibelle,
          coefficient: meta.coefficient,
          credits: meta.coefficient,
          uniteEnseignementId: ue.id,
        },
      });
    }

    // --- Trouver la ligne d'en-tête du tableau ---
    let headerRowIdx = -1;
    let colEleve = -1;
    const colNotes: { index: number; label: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].map((v) =>
        v !== null && v !== undefined ? String(v).toLowerCase().trim() : '',
      );

      const hasEleve = cells.findIndex(
        (c) => c.includes('élève') || c.includes('eleve') || c === 'nom' || c.includes('nom '),
      );

      if (hasEleve !== -1) {
        // Vérifier qu'il y a au moins une colonne numérique ou de note
        const hasNoteCol = cells.some(
          (c) =>
            c.includes('cc') || c.includes('examen') || c.includes('contrôle') ||
            c.includes('controle') || c.includes('moyenne') || c.includes('bash') ||
            c.includes('script') || c.includes('perl') || c.includes('note') ||
            c.match(/^[a-z]{2,15}$/) !== null,
        );
        if (hasNoteCol) {
          headerRowIdx = i;
          colEleve = hasEleve;

          // Identifier toutes les colonnes de notes (tout ce qui n'est pas N°, Élève, Moyenne)
          for (let j = 0; j < cells.length; j++) {
            const h = cells[j];
            if (j === colEleve) continue;
            if (!h || h === 'n°' || h === 'n' || h === '#' || h === 'num' || h === 'numéro') continue;
            if (h.includes('moyenne') || h.includes('moy')) continue; // On ne stocke pas la moyenne calculée
            if (h.length > 0) {
              colNotes.push({ index: j, label: cells[j] });
            }
          }
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      res.nbErreurs++;
      res.erreurs.push(`Onglet "${nomOnglet}" : en-tête du tableau introuvable.`);
      return res;
    }

    // --- Déterminer la correspondance CC/EXAMEN/RATTRAPAGE ---
    // Si une seule colonne de note → c'est EXAMEN
    // Si deux colonnes → première=CC (40%), deuxième=EXAMEN (60%)
    // Si trois colonnes ou + → épreuves multiples → on stocke la moyenne comme EXAMEN

    const nbColNotes = colNotes.length;
    let mappingCC = -1;
    let mappingEXAMEN = -1;
    let mappingRATTRAPAGE = -1;
    let colsMoyenne: number[] = []; // colonnes à moyenner si épreuves multiples

    if (nbColNotes === 1) {
      mappingEXAMEN = colNotes[0].index;
    } else if (nbColNotes === 2) {
      // Détecter CC vs Examen
      const l0 = colNotes[0].label;
      const l1 = colNotes[1].label;
      if (l0.includes('cc') || l0.includes('contrôle') || l0.includes('controle') || l0.includes('40')) {
        mappingCC = colNotes[0].index;
        mappingEXAMEN = colNotes[1].index;
      } else if (l1.includes('cc') || l1.includes('contrôle') || l1.includes('controle') || l1.includes('40')) {
        mappingCC = colNotes[1].index;
        mappingEXAMEN = colNotes[0].index;
      } else {
        mappingCC = colNotes[0].index;
        mappingEXAMEN = colNotes[1].index;
      }
    } else if (nbColNotes >= 3) {
      // Chercher si y a un CC et Examen explicitement
      const ccCol = colNotes.find(c => c.label.includes('cc') || c.label.includes('contrôle') || c.label.includes('40'));
      const examCol = colNotes.find(c => c.label.includes('examen') || c.label.includes('final') || c.label.includes('60'));
      const rattCol = colNotes.find(c => c.label.includes('ratt'));

      if (ccCol && examCol) {
        mappingCC = ccCol.index;
        mappingEXAMEN = examCol.index;
        if (rattCol) mappingRATTRAPAGE = rattCol.index;
      } else {
        // Épreuves multiples → on va calculer la moyenne de toutes les colonnes et la stocker en EXAMEN
        colsMoyenne = colNotes.map(c => c.index);
      }
    }

    // --- Parser les lignes d'étudiants ---
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      const cellEleve = row[colEleve];
      if (cellEleve === null || cellEleve === undefined) continue;
      const nomComplet = String(cellEleve).trim();

      // Arrêter si on atteint "Moyenne de la classe" ou ligne vide
      if (!nomComplet || nomComplet.toLowerCase().includes('moyenne') || nomComplet.toLowerCase().includes('date')) break;

      // Parser Nom / Prénom depuis "NOM Prénom Prénom"
      const { nom, prenom } = this.parserNomPrenom(nomComplet);
      if (!nom || nom.length < 2) continue;

      const parseNote = (val: any): number | null => {
        if (val === null || val === undefined) return null;
        const s = String(val).trim().replace(',', '.');
        if (!s || s === '-' || s === '' || s.toLowerCase() === 'abs') return null;
        const n = parseFloat(s);
        return isNaN(n) ? null : Math.min(20, Math.max(0, n));
      };

      let noteCC: number | null = mappingCC !== -1 ? parseNote(row[mappingCC]) : null;
      let noteExamen: number | null = mappingEXAMEN !== -1 ? parseNote(row[mappingEXAMEN]) : null;
      let noteRattrapage: number | null = mappingRATTRAPAGE !== -1 ? parseNote(row[mappingRATTRAPAGE]) : null;

      // Cas épreuves multiples : calculer la moyenne
      if (colsMoyenne.length > 0) {
        const notes = colsMoyenne.map(c => parseNote(row[c])).filter(n => n !== null) as number[];
        if (notes.length > 0) {
          noteExamen = Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100) / 100;
        }
      }

      // Ignorer si aucune note
      if (noteCC === null && noteExamen === null && noteRattrapage === null) continue;

      try {
        const { utilisateurId, isNew } = await this.upsertEtudiant(nom, prenom, classeId);
        if (!utilisateurId) continue;

        if (!utilisateursTraites.has(utilisateurId)) {
          if (isNew) res.nbEtudiantsCreees++;
          else res.nbEtudiantsMisAJour++;
        }

        const saisie = 'import-excel';

        if (noteCC !== null) {
          await this.prisma.evaluation.upsert({
            where: { utilisateurId_matiereId_type: { utilisateurId, matiereId: matiere!.id, type: 'CC' } },
            update: { note: noteCC, saisiePar: saisie },
            create: { utilisateurId, matiereId: matiere!.id, type: 'CC', note: noteCC, saisiePar: saisie },
          });
          res.nbNotesImportees++;
        }
        if (noteExamen !== null) {
          await this.prisma.evaluation.upsert({
            where: { utilisateurId_matiereId_type: { utilisateurId, matiereId: matiere!.id, type: 'EXAMEN' } },
            update: { note: noteExamen, saisiePar: saisie },
            create: { utilisateurId, matiereId: matiere!.id, type: 'EXAMEN', note: noteExamen, saisiePar: saisie },
          });
          res.nbNotesImportees++;
        }
        if (noteRattrapage !== null) {
          await this.prisma.evaluation.upsert({
            where: { utilisateurId_matiereId_type: { utilisateurId, matiereId: matiere!.id, type: 'RATTRAPAGE' } },
            update: { note: noteRattrapage, saisiePar: saisie },
            create: { utilisateurId, matiereId: matiere!.id, type: 'RATTRAPAGE', note: noteRattrapage, saisiePar: saisie },
          });
          res.nbNotesImportees++;
        }

        // Marquer pour recalcul différé (fait une seule fois à la fin)
        utilisateursTraites.add(utilisateurId);

      } catch (err) {
        res.nbErreurs++;
        res.erreurs.push(
          `Onglet "${nomOnglet}" ligne ${i + 1} (${nomComplet}) : ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return res;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPSERT ÉTUDIANT (distingue les homonymes par couple nom + prénom)
  // ─────────────────────────────────────────────────────────────────────────
  private async upsertEtudiant(
    nom: string,
    prenom: string,
    classeId: string,
  ): Promise<{ utilisateurId: string; isNew: boolean }> {
    const cleanPrenom = (prenom || nom).trim();

    // Chercher par couple (nom + prénom) parmi les étudiants pour ne jamais fusionner deux homonymes
    let user = await this.prisma.utilisateur.findFirst({
      where: {
        nom: { equals: nom, mode: 'insensitive' },
        role: 'ETUDIANT',
        etudiant: {
          prenom: { equals: cleanPrenom, mode: 'insensitive' },
        },
      },
      select: { id: true, etudiant: { select: { utilisateurId: true } } },
    });

    let isNew = false;

    if (!user) {
      isNew = true;
      const password = this.hasherMotDePasse(nom);
      const email = this.genererEmail(nom, cleanPrenom);
      const created = await this.prisma.utilisateur.create({
        data: { nom, password, email, role: 'ETUDIANT' },
        select: { id: true },
      });
      user = { id: created.id, etudiant: null };
    }

    const utilisateurId = user.id;

    if (!user.etudiant) {
      isNew = true;
      await this.prisma.etudiant.create({
        data: {
          utilisateurId,
          prenom: cleanPrenom,
          matricule: this.genererMatricule(nom),
          date_naissance: new Date('2000-01-01'),
          lieu_naissance: '-',
          bac_type: '',
          annee_bac: 0,
          provenance: '',
          classeId,
        },
      });
    } else {
      await this.prisma.etudiant.update({
        where: { utilisateurId },
        data: { classeId },
      });
    }

    return { utilisateurId, isNew };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PARSER NOM/PRÉNOM depuis "NOM PRÉNOM PRÉNOM" ou "NOMNOM Prénom Prénom"
  // ─────────────────────────────────────────────────────────────────────────
  private parserNomPrenom(nomComplet: string): { nom: string; prenom: string } {
    const parts = nomComplet.trim().split(/\s+/);

    if (parts.length === 1) return { nom: parts[0].toUpperCase(), prenom: '' };

    // Trouver la frontière : les mots TOUT EN MAJUSCULES = nom de famille
    let cutIdx = 1;
    for (let i = 1; i < parts.length; i++) {
      // Un mot est "nom" s'il est entièrement en majuscules (sans accent)
      if (parts[i] === parts[i].toUpperCase() && /^[A-ZÀÂÇÉÈÊËÎÏÔÙÛÜŸŒÆ\-']+$/i.test(parts[i])) {
        cutIdx = i + 1;
      } else {
        break;
      }
    }

    const nom = parts.slice(0, cutIdx).join(' ').toUpperCase();
    const prenom = parts.slice(cutIdx).join(' ');
    return { nom, prenom };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  private genererEmail(nom: string, prenom: string): string {
    const n = nom.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const p = (prenom || 'x').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    return `${n}.${p}.${Date.now().toString().slice(-5)}@inptic.ga`;
  }

  private genererMatricule(nom: string): string {
    const year = new Date().getFullYear();
    const clean = nom.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'ETU';
    return `${year}${clean}${Math.floor(Math.random() * 900) + 100}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER MODULE-LEVEL
// ─────────────────────────────────────────────────────────────────────────────
function texteCompletContient(texte: string, mots: string[]): boolean {
  return mots.some((m) => texte.includes(m));
}
