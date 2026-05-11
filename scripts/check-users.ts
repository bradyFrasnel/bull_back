import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.utilisateur.findMany({
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n=== ${users.length} utilisateur(s) en DB ===\n`);
  users.forEach((u) => {
    console.log(`- nom: "${u.nom}" | role: ${u.role} | email: ${u.email}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
