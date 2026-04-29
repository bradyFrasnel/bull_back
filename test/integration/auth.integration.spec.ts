import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
// Mock bcrypt
jest.mock('bcrypt');
const bcrypt = require('bcrypt');

// Mock PrismaService pour les tests
const mockPrisma = {
  utilisateur: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  etudiant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enseignant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  admin: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  secretariat: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user123',
    nom: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: 'ETUDIANT',
    createdAt: new Date(),
  };

  const mockEtudiant = {
    id: 'etudiant123',
    utilisateurId: 'user123',
    prenom: 'Test',
    matricule: '2024TEST001',
    date_naissance: new Date('2000-01-01'),
    lieu_naissance: 'Test City',
    bac_type: 'C',
    annee_bac: 2022,
    mention_bac: 'Bien',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /auth/etudiant/login', () => {
    it('should return JWT token for valid credentials', async () => {
      // Arrange
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        access_token: 'jwt-token',
        etudiant: {
          id: userWithEtudiant.id,
          nom: userWithEtudiant.nom,
          prenom: userWithEtudiant.etudiant?.prenom,
          email: userWithEtudiant.email,
          role: userWithEtudiant.role
        }
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'nonexistent',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should return 401 for wrong password', async () => {
      // Arrange
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser'
          // password missing
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          password: 'password123'
          // nom missing
        })
        .expect(400);
    });
  });

  describe('POST /auth/enseignant/login', () => {
    it('should return JWT token for valid enseignant credentials', async () => {
      // Arrange
      const mockEnseignant = {
        id: 'enseignant123',
        utilisateurId: 'user123',
        prenom: 'Test',
        matricule: 'ENS2024001',
        specialite: 'Mathématiques',
      };
      
      const userWithEnseignant = { ...mockUser, role: 'ENSEIGNANT', enseignant: mockEnseignant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEnseignant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/enseignant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        access_token: 'jwt-token',
        enseignant: {
          id: userWithEnseignant.id,
          nom: userWithEnseignant.nom,
          prenom: userWithEnseignant.enseignant?.prenom,
          email: userWithEnseignant.email,
          role: userWithEnseignant.role
        }
      });
    });
  });

  describe('POST /auth/admin/login', () => {
    it('should return JWT token for valid admin credentials', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: 'ADMINISTRATEUR' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(adminUser);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({
          nom: 'root',
          password: 'root'
        })
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        access_token: 'jwt-token',
        admin: {
          id: adminUser.id,
          nom: adminUser.nom,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    });

    it('should work for SECRETARIAT role as well', async () => {
      // Arrange
      const secretariatUser = { ...mockUser, role: 'SECRETARIAT' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(secretariatUser);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({
          nom: 'admin',
          password: 'admin'
        })
        .expect(200);

      // Assert
      expect(response.body.admin.role).toBe('SECRETARIAT');
    });
  });

  describe('POST /auth/secretariat/login', () => {
    it('should return JWT token for valid secretariat credentials', async () => {
      // Arrange
      const secretariatUser = { ...mockUser, role: 'SECRETARIAT' };
      const mockSecretariatProfile = {
        id: 'secretariat123',
        utilisateurId: 'user123',
      };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(secretariatUser);
      (prismaService.secretariat.findUnique as jest.Mock).mockResolvedValue(mockSecretariatProfile);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/secretariat/login')
        .send({
          nom: 'admin',
          password: 'admin'
        })
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        access_token: 'jwt-token',
        secretariat: {
          id: mockSecretariatProfile?.id || secretariatUser.id,
          utilisateurId: mockSecretariatProfile?.utilisateurId || secretariatUser.id,
          nom: secretariatUser.nom,
          email: secretariatUser.email,
          role: secretariatUser.role,
          createdAt: secretariatUser.createdAt
        }
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete authentication flow for etudiant', async () => {
      // Step 1: Login
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.access_token).toBe('jwt-token');

      // Verify JWT token structure
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'etudiant'
      });
    });

    it('should handle authentication failure and retry', async () => {
      // Step 1: Failed login attempt
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'wronguser',
          password: 'wrongpassword'
        })
        .expect(401);

      // Step 2: Successful login attempt
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.access_token).toBe('jwt-token');
    });
  });

  describe('Cross-Role Authentication', () => {
    it('should prevent etudiant from accessing enseignant login', async () => {
      // Arrange
      const etudiantUser = { ...mockUser, role: 'ETUDIANT' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(etudiantUser);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/enseignant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(401);
    });

    it('should prevent enseignant from accessing etudiant login', async () => {
      // Arrange
      const enseignantUser = { ...mockUser, role: 'ENSEIGNANT' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(enseignantUser);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/etudiant/login')
        .send({
          nom: 'testuser',
          password: 'password123'
        })
        .expect(401);
    });
  });
});
