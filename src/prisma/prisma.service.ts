import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Connexion non-bloquante au démarrage : permet au serveur HTTP (/health, Swagger)
    // de démarrer immédiatement même si Supabase est en veille ou lent à répondre.
    this.connectWithRetry().catch(() => {});
  }

  private async connectWithRetry() {
    const maxAttempts = Number(process.env.PRISMA_CONNECT_RETRIES ?? 3);
    const delayMs = Number(process.env.PRISMA_CONNECT_RETRY_MS ?? 2000);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        if (attempt > 1) {
          this.logger.log(`Connexion base de données établie (tentative ${attempt}/${maxAttempts})`);
        } else {
          this.logger.log('Connexion base de données établie');
        }
        return;
      } catch {
        if (attempt < maxAttempts) {
          this.logger.warn(
            `Connexion DB échouée (${attempt}/${maxAttempts}), nouvel essai dans ${delayMs} ms…`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.error(
      [
        'Impossible de joindre PostgreSQL (P1001) au démarrage — Prisma réessaiera à la prochaine requête.',
        '• Vérifiez DATABASE_URL dans .env (et que le projet Supabase n\'est pas en pause / VPN désactivé)',
      ].join('\n'),
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
