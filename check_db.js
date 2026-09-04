const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ues = await prisma.uniteEnseignement.findMany();
  console.log('UEs:', ues.map(u => ({ code: u.code, libelle: u.libelle })));
  
  const classes = await prisma.classe.findMany({
    include: { etudiants: { include: { utilisateur: true } } }
  });
  
  for(const c of classes) {
    console.log(`\nClasse ${c.code}: ${c.etudiants.length} students`);
    if(c.etudiants.length > 0) {
      console.log('Sample students:');
      c.etudiants.slice(0, 3).forEach(e => {
        console.log(`- ${e.utilisateur.nom} ${e.prenom} (${e.matricule})`);
      });
    }
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
