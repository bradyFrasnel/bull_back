import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Création des comptes admin et secrétariat...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const secretariatPassword = await bcrypt.hash('secretariat123', 10);

  await prisma.utilisateur.upsert({
    where: { nom: 'root' },
    update: {},
    create: {
      nom: 'root',
      password: adminPassword,       // champ DB = password
      email: 'root@bullasur.com',
      role: 'ADMINISTRATEUR',
      admin: { create: {} },
    },
  });

  await prisma.utilisateur.upsert({
    where: { nom: 'secretariat' },
    update: {},
    create: {
      nom: 'secretariat',
      password: secretariatPassword,
      email: 'secretariat@bullasur.com',
      role: 'SECRETARIAT',
      secretariat: { create: {} },
    },
  });

  console.log('Comptes créés avec succès !');
  console.log('Admin: nom=root, password=admin123');
  console.log('Secretariat: nom=secretariat, password=secretariat123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
