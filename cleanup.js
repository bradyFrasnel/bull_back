const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Find class
  const classe = await prisma.classe.findUnique({ where: { code: 'LP-ASUR-2014-2015' }});
  if (classe) {
    // Delete students
    const etudiants = await prisma.etudiant.findMany({ where: { classeId: classe.id }});
    const userIds = etudiants.map(e => e.utilisateurId);
    
    // Deleting the users will cascade delete Etudiants, Absences, Evaluations
    await prisma.utilisateur.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`Deleted ${userIds.length} users/students`);

    // Delete class (will cascade delete SemestreClasse)
    await prisma.classe.delete({ where: { id: classe.id } });
    console.log('Deleted class');
  }

  // Delete UEs that have '-S5' or '-S6' or '-2014-2015'
  const ues = await prisma.uniteEnseignement.findMany({
    where: { OR: [
      { code: { endsWith: '-S5' } },
      { code: { endsWith: '-S6' } },
      { code: { endsWith: '-2014-2015' } }
    ]}
  });
  
  if (ues.length > 0) {
    const ueIds = ues.map(u => u.id);
    // deleting UEs will cascade delete Matieres, which cascades to Evaluations/Absences
    await prisma.uniteEnseignement.deleteMany({
      where: { id: { in: ueIds } }
    });
    console.log(`Deleted ${ueIds.length} UEs and their matters`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
