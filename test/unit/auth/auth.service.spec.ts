import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

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

describe('AuthService', () => {
  let service: AuthService;
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
    identifiant: 'test2024',
    date_naissance: new Date('2000-01-01'),
    lieu_naissance: 'Test City',
    bac_type: 'C',
    annee_bac: 2022,
    mention_bac: 'Bien',
  };

  const mockEnseignant = {
    id: 'enseignant123',
    utilisateurId: 'user123',
    prenom: 'Test',
    matricule: 'ENS2024001',
    specialite: 'Mathématiques',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user123', role: 'ETUDIANT' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginEtudiant', () => {
    it('should return JWT token for valid etudiant credentials', async () => {
      // Arrange
      const loginDto = { nom: 'testuser', password: 'password123' };
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const result = await service.loginEtudiant(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        etudiant: {
          id: userWithEtudiant.id,
          nom: userWithEtudiant.nom,
          prenom: userWithEtudiant.etudiant?.prenom,
          email: userWithEtudiant.email,
          role: userWithEtudiant.role
        }
      });
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { nom: 'testuser' },
        include: { etudiant: true }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: userWithEtudiant.id,
        email: userWithEtudiant.email,
        role: userWithEtudiant.role,
        type: 'etudiant'
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const loginDto = { nom: 'nonexistent', password: 'password123' };
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.loginEtudiant(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { nom: 'nonexistent' },
        include: { etudiant: true }
      });
    });

    it('should throw UnauthorizedException when user role is not ETUDIANT', async () => {
      // Arrange
      const loginDto = { nom: 'admin', password: 'password123' };
      const adminUser = { ...mockUser, role: 'ADMINISTRATEUR' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(adminUser);

      // Act & Assert
      await expect(service.loginEtudiant(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const loginDto = { nom: 'testuser', password: 'wrongpassword' };
      const userWithEtudiant = { ...mockUser, etudiant: mockEtudiant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEtudiant);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(service.loginEtudiant(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
    });
  });

  describe('loginEnseignant', () => {
    it('should return JWT token for valid enseignant credentials', async () => {
      // Arrange
      const loginDto = { nom: 'testuser', password: 'password123' };
      const userWithEnseignant = { ...mockUser, role: 'ENSEIGNANT', enseignant: mockEnseignant };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(userWithEnseignant);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const result = await service.loginEnseignant(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        enseignant: {
          id: userWithEnseignant.id,
          nom: userWithEnseignant.nom,
          prenom: userWithEnseignant.enseignant?.prenom,
          email: userWithEnseignant.email,
          role: userWithEnseignant.role
        }
      });
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { nom: 'testuser' },
        include: { enseignant: true }
      });
    });

    it('should throw UnauthorizedException when enseignant not found', async () => {
      // Arrange
      const loginDto = { nom: 'nonexistent', password: 'password123' };
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.loginEnseignant(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginAdmin', () => {
    it('should return JWT token for valid admin credentials', async () => {
      // Arrange
      const loginDto = { nom: 'root', password: 'root' };
      const adminUser = { ...mockUser, role: 'ADMINISTRATEUR' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(adminUser);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const result = await service.loginAdmin(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        admin: {
          id: adminUser.id,
          nom: adminUser.nom,
          email: adminUser.email,
          role: adminUser.role
        }
      });
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { nom: 'root' }
      });
    });

    it('should work for SECRETARIAT role as well', async () => {
      // Arrange
      const loginDto = { nom: 'admin', password: 'admin' };
      const secretariatUser = { ...mockUser, role: 'SECRETARIAT' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(secretariatUser);
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const result = await service.loginAdmin(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.admin.role).toBe('SECRETARIAT');
    });
  });

  describe('loginSecretariat', () => {
    it('should return JWT token for valid secretariat credentials', async () => {
      // Arrange
      const loginDto = { nom: 'admin', password: 'admin' };
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
      const result = await service.loginSecretariat(loginDto);

      // Assert
      expect(result).toEqual({
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
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { nom: 'admin' }
      });
    });

    it('should work even when secretariat profile does not exist', async () => {
      // Arrange
      const loginDto = { nom: 'admin', password: 'admin' };
      const secretariatUser = { ...mockUser, role: 'SECRETARIAT' };
      
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(secretariatUser);
      (prismaService.secretariat.findUnique as jest.Mock).mockRejectedValue(new Error('Not found'));
      bcrypt.compare.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');

      // Act
      const result = await service.loginSecretariat(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.secretariat.id).toBe(secretariatUser.id);
    });
  });

  describe('createEtudiant', () => {
    it('should create etudiant with hashed password', async () => {
      // Arrange
      const createEtudiantDto = {
        nom: 'testuser',
        prenom: 'Test',
        email: 'test@example.com',
        password: 'password123',
        matricule: '2024TEST001',
        date_naissance: new Date('2000-01-01'),
        lieu_naissance: 'Test City',
        bac_type: 'C',
        annee_bac: 2022,
        mention_bac: 'Bien',
      };

      const createdUser = { id: 'user123', ...createEtudiantDto, role: 'ETUDIANT', createdAt: new Date() };
      const createdEtudiant = { id: 'etudiant123', utilisateurId: 'user123', ...createEtudiantDto };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      (prismaService.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);
      (prismaService.etudiant.create as jest.Mock).mockResolvedValue(createdEtudiant);

      // Act
      const result = await service.createEtudiant(createEtudiantDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.utilisateur.create).toHaveBeenCalledWith({
        data: {
          nom: 'testuser',
          password: 'hashedpassword',
          email: 'test@example.com',
          role: 'ETUDIANT',
        },
      });
      expect(prismaService.etudiant.create).toHaveBeenCalledWith({
        data: {
          utilisateurId: 'user123',
          prenom: 'Test',
          matricule: '2024TEST001',
          date_naissance: new Date('2000-01-01'),
          lieu_naissance: 'Test City',
          bac_type: 'C',
          annee_bac: 2022,
          mention_bac: 'Bien',
          telephone: undefined,
          adresse: undefined,
        },
      });
      expect(result).toBe(createdEtudiant);
    });
  });

  describe('createEnseignant', () => {
    it('should create enseignant with hashed password', async () => {
      // Arrange
      const createEnseignantDto = {
        nom: 'testuser',
        prenom: 'Test',
        email: 'test@example.com',
        password: 'password123',
        matricule: 'ENS2024001',
        specialite: 'Mathématiques',
      };

      const createdUser = { id: 'user123', ...createEnseignantDto, role: 'ENSEIGNANT', createdAt: new Date() };
      const createdEnseignant = { id: 'enseignant123', utilisateurId: 'user123', ...createEnseignantDto };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      (prismaService.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);
      (prismaService.enseignant.create as jest.Mock).mockResolvedValue(createdEnseignant);

      // Act
      const result = await service.createEnseignant(createEnseignantDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.utilisateur.create).toHaveBeenCalledWith({
        data: {
          nom: 'testuser',
          password: 'hashedpassword',
          email: 'test@example.com',
          role: 'ENSEIGNANT',
        },
      });
      expect(prismaService.enseignant.create).toHaveBeenCalledWith({
        data: {
          utilisateurId: 'user123',
          prenom: 'Test',
          matricule: 'ENS2024001',
          specialite: 'Mathématiques',
        },
      });
      expect(result).toBe(createdEnseignant);
    });
  });
});
