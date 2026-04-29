import { Test, TestingModule } from '@nestjs/testing';
import { ProfilService } from '../../../src/profil/profil.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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

describe('ProfilService', () => {
  let service: ProfilService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user123',
    nom: 'testuser',
    email: 'test@example.com',
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
    telephone: '0612345678',
    adresse: '123 Test Street',
  };

  const mockEnseignant = {
    id: 'enseignant123',
    utilisateurId: 'user123',
    prenom: 'Test',
    matricule: 'ENS2024001',
    specialite: 'Mathématiques',
  };

  const mockAdmin = {
    id: 'admin123',
    utilisateurId: 'user123',
  };

  const mockSecretariat = {
    id: 'secretariat123',
    utilisateurId: 'user123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProfilService>(ProfilService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfilComplet', () => {
    it('should return complete profile for ETUDIANT role', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.etudiant.findUnique as jest.Mock).mockResolvedValue({
        ...mockEtudiant,
        utilisateur: { email: 'test@example.com', createdAt: new Date() }
      });

      // Act
      const result = await service.getProfilComplet('user123', 'ETUDIANT');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: 'etudiant123',
          nom: 'testuser',
          email: 'test@example.com',
          role: 'ETUDIANT',
          prenom: 'Test',
          matricule: '2024TEST001',
        })
      );
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });
      expect(prismaService.etudiant.findUnique).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        include: {
          utilisateur: {
            select: {
              email: true,
              createdAt: true,
            }
          }
        }
      });
    });

    it('should return complete profile for ENSEIGNANT role', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'ENSEIGNANT'
      });
      (prismaService.enseignant.findUnique as jest.Mock).mockResolvedValue({
        ...mockEnseignant,
        utilisateur: { email: 'test@example.com', createdAt: new Date() }
      });

      // Act
      const result = await service.getProfilComplet('user123', 'ENSEIGNANT');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: 'enseignant123',
          nom: 'testuser',
          role: 'ENSEIGNANT',
          prenom: 'Test',
          specialite: 'Mathématiques',
        })
      );
      expect(prismaService.enseignant.findUnique).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        include: {
          utilisateur: {
            select: {
              email: true,
              createdAt: true,
            }
          }
        }
      });
    });

    it('should return complete profile for ADMINISTRATEUR role', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'ADMINISTRATEUR'
      });
      (prismaService.admin.findUnique as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        utilisateur: { email: 'test@example.com', createdAt: new Date() }
      });

      // Act
      const result = await service.getProfilComplet('user123', 'ADMINISTRATEUR');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: 'admin123',
          nom: 'testuser',
          role: 'ADMINISTRATEUR',
        })
      );
      expect(prismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        include: {
          utilisateur: {
            select: {
              email: true,
              createdAt: true,
            }
          }
        }
      });
    });

    it('should return complete profile for SECRETARIAT role', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'SECRETARIAT'
      });
      (prismaService.secretariat.findUnique as jest.Mock).mockResolvedValue({
        ...mockSecretariat,
        utilisateur: { email: 'test@example.com', createdAt: new Date() }
      });

      // Act
      const result = await service.getProfilComplet('user123', 'SECRETARIAT');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: 'secretariat123',
          nom: 'testuser',
          role: 'SECRETARIAT',
        })
      );
      expect(prismaService.secretariat.findUnique).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        include: {
          utilisateur: {
            select: {
              email: true,
              createdAt: true,
            }
          }
        }
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfilComplet('nonexistent', 'ETUDIANT')).rejects.toThrow(NotFoundException);
      expect(prismaService.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });
    });

    it('should handle missing role-specific profile gracefully', async () => {
      // Arrange
      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.etudiant.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getProfilComplet('user123', 'ETUDIANT');

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfil', () => {
    it('should update user basic info and etudiant specific info', async () => {
      // Arrange
      const updateData = {
        nom: 'UpdatedName',
        email: 'updated@example.com',
        prenom: 'UpdatedPrenom',
        matricule: '2024UPDATED001'
      };

      (prismaService.utilisateur.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        nom: 'UpdatedName',
        email: 'updated@example.com'
      });
      (prismaService.etudiant.update as jest.Mock).mockResolvedValue(mockEtudiant);

      // Mock getProfilComplet to avoid dependency
      jest.spyOn(service, 'getProfilComplet').mockResolvedValue(mockUser as any);

      // Act
      const result = await service.updateProfil('user123', 'ETUDIANT', updateData);

      // Assert
      expect(prismaService.utilisateur.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          nom: 'UpdatedName',
          email: 'updated@example.com',
        }
      });
      expect(prismaService.etudiant.update).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        data: {
          prenom: 'UpdatedPrenom',
          matricule: '2024UPDATED001',
        }
      });
      expect(service.getProfilComplet).toHaveBeenCalledWith('user123', 'ETUDIANT');
    });

    it('should update only basic info for ADMINISTRATEUR role', async () => {
      // Arrange
      const updateData = {
        nom: 'UpdatedName',
        email: 'updated@example.com'
      };

      (prismaService.utilisateur.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        nom: 'UpdatedName',
        email: 'updated@example.com'
      });
      jest.spyOn(service, 'getProfilComplet').mockResolvedValue(mockUser as any);

      // Act
      const result = await service.updateProfil('user123', 'ADMINISTRATEUR', updateData);

      // Assert
      expect(prismaService.utilisateur.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          nom: 'UpdatedName',
          email: 'updated@example.com',
        }
      });
      expect(prismaService.etudiant.update).not.toHaveBeenCalled();
      expect(prismaService.enseignant.update).not.toHaveBeenCalled();
    });

    it('should handle ENSEIGNANT role update', async () => {
      // Arrange
      const updateData = {
        nom: 'UpdatedName',
        email: 'updated@example.com',
        prenom: 'UpdatedPrenom',
        matricule: 'ENS2024002',
        specialite: 'UpdatedSpeciality'
      };

      (prismaService.utilisateur.update as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.enseignant.update as jest.Mock).mockResolvedValue(mockEnseignant);
      jest.spyOn(service, 'getProfilComplet').mockResolvedValue(mockUser as any);

      // Arrange
      const userWithEnseignant = { ...mockUser, role: 'ENSEIGNANT', enseignant: mockEnseignant };

      // Act
      await service.updateProfil('user123', 'ENSEIGNANT', updateData);

      // Assert
      expect(prismaService.enseignant.update).toHaveBeenCalledWith({
        where: { utilisateurId: 'user123' },
        data: {
          prenom: 'UpdatedPrenom',
          matricule: 'ENS2024002',
          specialite: 'UpdatedSpeciality',
        }
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully with valid current password', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: '$2b$10$hashedoldpassword'
      });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('$2b$10$newhashedpassword');
      (prismaService.utilisateur.update as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.changePassword('user123', 'ETUDIANT', changePasswordDto);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', '$2b$10$hashedoldpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prismaService.utilisateur.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          password: '$2b$10$newhashedpassword',
        }
      });
      expect(result).toEqual({ message: 'Mot de passe changé avec succès' });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword('nonexistent', 'ETUDIANT', changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is invalid', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      (prismaService.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: '$2b$10$hashedoldpassword'
      });
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(service.changePassword('user123', 'ETUDIANT', changePasswordDto)).rejects.toThrow(BadRequestException);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$hashedoldpassword');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences', async () => {
      // Act
      const result = await service.getPreferences('user123', 'ETUDIANT');

      // Assert
      expect(result).toEqual({
        theme: 'light',
        langue: 'fr',
        notifications: {
          email: true,
          sms: false,
          evaluations: true,
        },
        dashboard: {
          widgets: ['notes', 'emplois_du_temps'],
          defaultView: 'tableau',
        }
      });
    });
  });

  describe('updatePreferences', () => {
    it('should return updated preferences message', async () => {
      // Arrange
      const preferences = {
        theme: 'dark',
        langue: 'en'
      };

      // Act
      const result = await service.updatePreferences('user123', 'ETUDIANT', preferences);

      // Assert
      expect(result).toEqual({
        message: 'Préférences mises à jour',
        preferences
      });
    });
  });
});
