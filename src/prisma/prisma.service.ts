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
    const maxAttempts = Number(process.env.PRISMA_CONNECT_RETRIES ?? 5);
    const delayMs = Number(process.env.PRISMA_CONNECT_RETRY_MS ?? 2000);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Connexion base de données établie (tentative ${attempt}/${maxAttempts})`);
        }
        return;
      } catch (error) {
        lastError = error;
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
        'Impossible de joindre PostgreSQL (P1001).',
        '• Vérifiez DATABASE_URL dans .env',
        '• En local : testez sans VPN, ou utilisez le pooler Session (port 5432) plutôt que Transaction (6543)',
        '• Supabase : Settings → Database → copier l’URI « Session pooler » ou « Direct »',
        '• Transaction pooler (6543) : ajouter ?pgbouncer=true à l’URL',
      ].join('\n'),
    );
    throw lastError;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
