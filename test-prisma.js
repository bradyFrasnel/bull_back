const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname'
  });
  
  try {
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && k !== 'constructor' && k !== 'then' && k !== 'catch' && k !== 'finally');
    console.log('Available models:', models);
    
    // Test specific models
    console.log('User model exists:', 'user' in prisma);
    console.log('Etudiant model exists:', 'etudiant' in prisma);
    console.log('Enseignant model exists:', 'enseignant' in prisma);
    console.log('Evaluation model exists:', 'evaluation' in prisma);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
