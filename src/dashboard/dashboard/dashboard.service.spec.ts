import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            etudiant: { count: jest.fn().mockResolvedValue(0) },
            enseignant: { count: jest.fn().mockResolvedValue(0) },
            matiere: { count: jest.fn().mockResolvedValue(0) },
            classe: { count: jest.fn().mockResolvedValue(0) },
            auditLog: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
