import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilieresService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const existing = await this.prisma.filiere.findFirst({
      where: {
        OR: [
          { code: data.code },
          { nom: data.nom }
        ]
      }
    });
    if (existing) {
      throw new ConflictException('Une filière avec ce code ou nom existe déjà');
    }

    return this.prisma.filiere.create({ data });
  }

  async findAll() {
    return this.prisma.filiere.findMany({
      include: {
        _count: { select: { classes: true } }
      },
      orderBy: { nom: 'asc' }
    });
  }

  async findOne(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: {
        classes: true
      }
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    
    if (data.code || data.nom) {
      const existing = await this.prisma.filiere.findFirst({
        where: {
          OR: [
            { code: data.code },
            { nom: data.nom }
          ],
          NOT: { id }
        }
      });
      if (existing) {
        throw new ConflictException('Une filière avec ce code ou nom existe déjà');
      }
    }

    return this.prisma.filiere.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.filiere.delete({ where: { id } });
  }
}
