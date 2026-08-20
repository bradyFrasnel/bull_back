import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: "Vérifier l'état de l'application" })
  getHealth() {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Bull ASUR API',
      version: '1.0.0',
      uptime: process.uptime()
    };
  }
}
