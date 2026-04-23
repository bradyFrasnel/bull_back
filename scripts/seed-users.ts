import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Création des utilisateurs de test...');

  // Créer admin
  const adminPassword = await bcrypt.hash('root', 10);
  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Administrateur',
      password: adminPassword,
      email: 'admin@asur.fr',
      role: Role.ADMINISTRATEUR,
    },
  });

  await prisma.admin.create({
    data: {
      utilisateurId: admin.id,
    },
  });

  // Créer secrétariat
  const secretariatPassword = await bcrypt.hash('admin', 10);
  const secretariat = await prisma.utilisateur.create({
    data: {
      nom: 'Secretariat',
      password: secretariatPassword,
      email: 'secretariat@asur.fr',
      role: Role.SECRETARIAT,
    },
  });

  await prisma.secretariat.create({
    data: {
      utilisateurId: secretariat.id,
    },
  });

  // Créer un étudiant de test
  const etudiantPassword = await bcrypt.hash('etudiant', 10);
  const etudiant = await prisma.utilisateur.create({
    data: {
      nom: 'Dupont',
      password: etudiantPassword,
      email: 'jean.dupont@asur.fr',
      role: Role.ETUDIANT,
    },
  });

  await prisma.etudiant.create({
    data: {
      utilisateurId: etudiant.id,
      prenom: 'Jean',
      matricule: '2024001',
      date_naissance: new Date('2000-01-15'),
      lieu_naissance: 'Paris',
      bac_type: 'Général',
      annee_bac: 2020,
      mention_bac: 'Assez Bien',
    },
  });

  // Créer un enseignant de test
  const enseignantPassword = await bcrypt.hash('enseignant', 10);
  const enseignant = await prisma.utilisateur.create({
    data: {
      nom: 'Martin',
      password: enseignantPassword,
      email: 'pierre.martin@asur.fr',
      role: Role.ENSEIGNANT,
    },
  });

  await prisma.enseignant.create({
    data: {
      utilisateurId: enseignant.id,
      prenom: 'Pierre',
      matricule: 'ENS001',
      specialite: 'Mathématiques',
    },
  });

  console.log('Utilisateurs créés avec succès !');
  console.log('Admin: nom=Administrateur, password=root');
  console.log('Secretariat: nom=Secretariat, password=admin');
  console.log('Étudiant: nom=Dupont, password=etudiant');
  console.log('Enseignant: nom=Martin, password=enseignant');
}

seedUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
