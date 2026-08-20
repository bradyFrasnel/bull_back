import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMINISTRATEUR)
  async getAuditLogs() {
    return this.dashboardService.getAuditLogs();
  }
}
