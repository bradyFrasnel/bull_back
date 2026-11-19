import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalEtudiants = await this.prisma.etudiant.count();
    const totalEnseignants = await this.prisma.enseignant.count();
    const totalMatieres = await this.prisma.matiere.count();
    const totalClasses = await this.prisma.classe.count();

    return {
      totalEtudiants,
      totalEnseignants,
      totalMatieres,
      totalClasses,
    };
  }

  async getAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
