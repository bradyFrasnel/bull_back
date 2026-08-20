import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;

    // We only log modifying actions
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          try {
            if (user?.userId || user?.id) {
              const userId = user.userId || user.id;
              
              let action = method;
              if (url.includes('login') || url.includes('auth')) {
                action = 'LOGIN';
              }

              const parts = url.split('?')[0].split('/').filter(Boolean);
              let entity = parts[0] || 'Unknown';
              let entityId = null;

              if (parts.length > 1 && parts[1].length > 10) {
                 entityId = parts[1];
              }

              const safeBody = { ...body };
              if (safeBody.password) safeBody.password = '***';

              await this.prisma.auditLog.create({
                data: {
                  userId,
                  action,
                  entity,
                  entityId,
                  details: safeBody,
                  ipAddress: ip,
                },
              });
            }
          } catch (error) {
            console.error('Failed to write audit log', error);
          }
        }),
      );
    }

    return next.handle();
  }
}
