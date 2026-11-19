import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * Guard de Rate-Limiting personnalisé :
 * - Supporte la détection d'IP derrière un proxy inverse (Render / Cloudflare via X-Forwarded-For)
 * - Retourne un message d'erreur explicite en français en cas de dépassement (HTTP 429)
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown-ip';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse();
    const retryAfterSec = Math.max(
      1,
      Math.ceil((throttlerLimitDetail?.timeToExpire || throttlerLimitDetail?.ttl || 60000) / 1000),
    );
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(retryAfterSec));
    }
    throw new ThrottlerException(
      `Trop de tentatives ou de requêtes rapprochées. Veuillez patienter ${retryAfterSec} secondes avant de réessayer.`,
    );
  }
}
