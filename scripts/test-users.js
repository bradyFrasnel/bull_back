const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.utilisateur.findMany({
    select: { id: true, nom: true, role: true, email: true },
    take: 20,
    orderBy: { role: 'asc' }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e.message))
  .finally(() => prisma.$disconnect());
