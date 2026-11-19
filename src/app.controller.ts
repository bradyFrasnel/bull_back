import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return '🎓 Bull ASUR API - Serveur opérationnel !\n\n📚 Documentation Swagger: /api/docs\n💓 Health Check: /health\n🔐 Authentification: /auth/*';
  }
}
