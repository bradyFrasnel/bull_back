import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const testUsers = {
    etudiant: {
      id: 'etudiant123',
      nom: 'mmartin2024',
      email: 'martin@test.com',
      password: '$2b$10$hashedpassword',
      role: 'ETUDIANT',
      createdAt: new Date(),
    },
    enseignant: {
      id: 'enseignant123',
      nom: 'jdupontweb',
      email: 'dupont@test.com',
      password: '$2b$10$hashedpassword',
      role: 'ENSEIGNANT',
      createdAt: new Date(),
    },
    admin: {
      id: 'admin123',
      nom: 'root',
      email: 'admin@test.com',
      password: '$2b$10$hashedpassword',
      role: 'ADMINISTRATEUR',
      createdAt: new Date(),
    },
    secretariat: {
      id: 'secretariat123',
      nom: 'admin',
      email: 'secretariat@test.com',
      password: '$2b$10$hashedpassword',
      role: 'SECRETARIAT',
      createdAt: new Date(),
    },
  };

  const testEtudiant = {
    id: 'etudiant123',
    utilisateurId: 'etudiant123',
    prenom: 'Martin',
    matricule: '2024ASUR001',
    date_naissance: new Date('2000-01-01'),
    lieu_naissance: 'Test City',
    bac_type: 'C',
    annee_bac: 2022,
    mention_bac: 'Bien',
  };

  const testEnseignant = {
    id: 'enseignant123',
    utilisateurId: 'enseignant123',
    prenom: 'Dupont',
    matricule: 'ENS2024001',
    specialite: 'Mathématiques',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(global.mockPrisma)
    .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Complete Authentication Workflow', () => {
    describe('Étudiant Workflow', () => {
      it('should complete full etudiant authentication and profile flow', async () => {
        // Step 1: Login
        const userWithEtudiant = { ...testUsers.etudiant, etudiant: testEtudiant };
        
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.sign as jest.Mock).mockReturnValue('etudiant-jwt-token');

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/etudiant/login')
          .send({
            nom: 'mmartin2024',
            password: 'password123'
          })
          .expect(200);

        expect(loginResponse.body).toEqual({
          access_token: 'etudiant-jwt-token',
          etudiant: {
            id: testUsers.etudiant.id,
            nom: testUsers.etudiant.nom,
            prenom: testEtudiant.prenom,
            email: testUsers.etudiant.email,
            role: testUsers.etudiant.role
          }
        });

        // Step 2: Access protected profile endpoint
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.etudiant);
        (prismaService.etudiant.findUnique as jest.Mock).mockResolvedValue({
          ...testEtudiant,
          utilisateur: { email: testUsers.etudiant.email, createdAt: new Date() }
        });

        const profileResponse = await request(app.getHttpServer())
          .get('/profil')
          .set('Authorization', 'Bearer etudiant-jwt-token')
          .expect(200);

        expect(profileResponse.body).toEqual(
          expect.objectContaining({
            id: testUsers.etudiant.id,
            nom: testUsers.etudiant.nom,
            email: testUsers.etudiant.email,
            role: 'ETUDIANT',
            prenom: testEtudiant.prenom,
            matricule: testEtudiant.matricule,
          })
        );

        // Step 3: Change password
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.etudiant);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhashedpassword');
        (prismaService.utilisateur.update as jest.Mock).mockResolvedValue(testUsers.etudiant);

        await request(app.getHttpServer())
          .post('/profil/change-password')
          .set('Authorization', 'Bearer etudiant-jwt-token')
          .send({
            currentPassword: 'password123',
            newPassword: 'newpassword123'
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.message).toBe('Mot de passe changé avec succès');
          });
      });
    });

    describe('Enseignant Workflow', () => {
      it('should complete full enseignant authentication and profile flow', async () => {
        // Step 1: Login
        const userWithEnseignant = { ...testUsers.enseignant, enseignant: testEnseignant };
        
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEnseignant);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.sign as jest.Mock).mockReturnValue('enseignant-jwt-token');

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/enseignant/login')
          .send({
            nom: 'jdupontweb',
            password: 'password123'
          })
          .expect(200);

        expect(loginResponse.body).toEqual({
          access_token: 'enseignant-jwt-token',
          enseignant: {
            id: testUsers.enseignant.id,
            nom: testUsers.enseignant.nom,
            prenom: testEnseignant.prenom,
            email: testUsers.enseignant.email,
            role: testUsers.enseignant.role
          }
        });

        // Step 2: Access profile
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.enseignant);
        (prismaService.enseignant.findUnique as jest.Mock).mockResolvedValue({
          ...testEnseignant,
          utilisateur: { email: testUsers.enseignant.email, createdAt: new Date() }
        });

        const profileResponse = await request(app.getHttpServer())
          .get('/profil')
          .set('Authorization', 'Bearer enseignant-jwt-token')
          .expect(200);

        expect(profileResponse.body).toEqual(
          expect.objectContaining({
            id: testUsers.enseignant.id,
            nom: testUsers.enseignant.nom,
            role: 'ENSEIGNANT',
            prenom: testEnseignant.prenom,
            specialite: testEnseignant.specialite,
          })
        );
      });
    });

    describe('Admin Workflow', () => {
      it('should complete full admin authentication and profile flow', async () => {
        // Step 1: Login
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.sign as jest.Mock).mockReturnValue('admin-jwt-token');

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/admin/login')
          .send({
            nom: 'root',
            password: 'root'
          })
          .expect(200);

        expect(loginResponse.body).toEqual({
          access_token: 'admin-jwt-token',
          admin: {
            id: testUsers.admin.id,
            nom: testUsers.admin.nom,
            email: testUsers.admin.email,
            role: testUsers.admin.role
          }
        });

        // Step 2: Access profile
        (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);
        (prismaService.admin.findUnique as jest.Mock).mockResolvedValue({
          id: 'admin123',
          utilisateurId: 'admin123',
          utilisateur: { email: testUsers.admin.email, createdAt: new Date() }
        });

        const profileResponse = await request(app.getHttpServer())
          .get('/profil')
          .set('Authorization', 'Bearer admin-jwt-token')
          .expect(200);

        expect(profileResponse.body).toEqual(
          expect.objectContaining({
            id: testUsers.admin.id,
            nom: testUsers.admin.nom,
            role: 'ADMINISTRATEUR',
          })
        );
      });
    });
  });

  describe('CRUD Operations Workflow', () => {
    it('should complete CRUD workflow for admin role', async () => {
      // Step 1: Admin login
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('admin-jwt-token');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ nom: 'root', password: 'root' })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Step 2: Create student
      const newStudentData = {
        nom: 'NewStudent',
        prenom: 'Test',
        email: 'newstudent@test.com',
        password: 'password123',
        matricule: '2024NEW001',
        date_naissance: '2000-01-01',
        lieu_naissance: 'Test City',
        bac_type: 'C',
        annee_bac: 2022,
        mention_bac: 'Bien',
      };

      const createdUser = { id: 'newuser123', ...newStudentData, role: 'ETUDIANT', createdAt: new Date() };
      const createdEtudiant = { id: 'newetudiant123', utilisateurId: 'newuser123', ...newStudentData };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (prismaService.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);
      (prismaService.etudiant.create as jest.Mock).mockResolvedValue(createdEtudiant);

      const createResponse = await request(app.getHttpServer())
        .post('/etudiants')
        .set('Authorization', `Bearer ${token}`)
        .send(newStudentData)
        .expect(201);

      expect(createResponse.body).toEqual(createdEtudiant);

      // Step 3: List students
      const students = [createdEtudiant];
      (prismaService.etudiant.findMany as jest.Mock).mockResolvedValue(students);

      const listResponse = await request(app.getHttpServer())
        .get('/etudiants')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(listResponse.body).toEqual(students);

      // Step 4: Get student by ID
      (prismaService.etudiant.findUnique as jest.Mock).mockResolvedValue(createdEtudiant);

      const getResponse = await request(app.getHttpServer())
        .get(`/etudiants/${createdEtudiant.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body).toEqual(createdEtudiant);

      // Step 5: Update student
      const updateData = { nom: 'UpdatedStudent' };
      const updatedEtudiant = { ...createdEtudiant, nom: 'UpdatedStudent' };

      (prismaService.etudiant.update as jest.Mock).mockResolvedValue(updatedEtudiant);

      const updateResponse = await request(app.getHttpServer())
        .put(`/etudiants/${createdEtudiant.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toEqual(updatedEtudiant);

      // Step 6: Delete student
      (prismaService.etudiant.delete as jest.Mock).mockResolvedValue(createdEtudiant);

      await request(app.getHttpServer())
        .delete(`/etudiants/${createdEtudiant.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Academic Workflow', () => {
    it('should complete academic structure workflow', async () => {
      // Step 1: Admin login
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('admin-jwt-token');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ nom: 'root', password: 'root' })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Step 2: Create semester
      const semesterData = {
        libelle: 'Semestre 1',
        anneeUniversitaire: '2024-2025',
        code: 'S1-2024'
      };

      const createdSemester = {
        id: 'semester123',
        ...semesterData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaService.semestre.create as jest.Mock).mockResolvedValue(createdSemester);

      const semesterResponse = await request(app.getHttpServer())
        .post('/semestres')
        .set('Authorization', `Bearer ${token}`)
        .send(semesterData)
        .expect(201);

      expect(semesterResponse.body).toEqual(createdSemester);

      // Step 3: Create UE
      const ueData = {
        code: 'UE01',
        libelle: 'Algorithmique et Programmation',
        semestreId: 'semester123'
      };

      const createdUe = {
        id: 'ue123',
        ...ueData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaService.uniteEnseignement.create as jest.Mock).mockResolvedValue(createdUe);

      const ueResponse = await request(app.getHttpServer())
        .post('/unites-enseignement')
        .set('Authorization', `Bearer ${token}`)
        .send(ueData)
        .expect(201);

      expect(ueResponse.body).toEqual(createdUe);

      // Step 4: Create matière
      const matiereData = {
        libelle: 'Algorithmique avancée',
        coefficient: 3,
        credits: 6,
        uniteEnseignementId: 'ue123'
      };

      const createdMatiere = {
        id: 'matiere123',
        ...matiereData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prismaService.matiere.create as jest.Mock).mockResolvedValue(createdMatiere);

      const matiereResponse = await request(app.getHttpServer())
        .post('/matieres')
        .set('Authorization', `Bearer ${token}`)
        .send(matiereData)
        .expect(201);

      expect(matiereResponse.body).toEqual(createdMatiere);

      // Step 5: List semestres with UEs included
      const semestersWithUes = [{
        ...createdSemester,
        ues: [{
          ...createdUe,
          matieres: [createdMatiere]
        }]
      }];

      (prismaService.semestre.findMany as jest.Mock).mockResolvedValue(semestersWithUes);

      const listSemestersResponse = await request(app.getHttpServer())
        .get('/semestres')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(listSemestersResponse.body).toEqual(semestersWithUes);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle authentication errors properly', async () => {
      // Test invalid credentials
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({ nom: 'invalid', password: 'invalid' })
        .expect(401);

      // Test missing token
      await request(app.getHttpServer())
        .get('/profil')
        .expect(401);

      // Test invalid token
      await request(app.getHttpServer())
        .get('/profil')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle authorization errors properly', async () => {
      // Step 1: Student login
      const userWithEtudiant = { ...testUsers.etudiant, etudiant: testEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('student-token');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({ nom: 'mmartin2024', password: 'password123' })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Step 2: Try to access admin-only endpoint (if exists)
      // This would depend on your actual role-based access control implementation
      // For now, we'll test accessing CRUD operations as a student
      
      // Students shouldn't be able to create other students
      await request(app.getHttpServer())
        .post('/etudiants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nom: 'Test',
          prenom: 'Student',
          email: 'test@test.com',
          password: 'password123',
          matricule: '2024TEST001'
        })
        .expect(403); // Assuming role-based access control is implemented
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      // Setup mock for concurrent requests
      const userWithEtudiant = { ...testUsers.etudiant, etudiant: testEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Make 10 concurrent login requests
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/auth/etudiant/login')
          .send({ nom: 'mmartin2024', password: 'password123' })
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.access_token).toBe('jwt-token');
      });
    });
  });
});
