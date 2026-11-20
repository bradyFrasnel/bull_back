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
    // Dans @nestjs/throttler v6, timeToBlockExpire et timeToExpire sont déjà exprimés en SECONDES,
    // tandis que ttl et blockDuration sont en MILLISECONDES.
    const rawBlockSec = Number(throttlerLimitDetail?.timeToBlockExpire || 0);
    const rawExpireSec = Number(throttlerLimitDetail?.timeToExpire || 0);
    const fallbackTtlSec = Math.ceil(Number(throttlerLimitDetail?.ttl || 300000) / 1000);

    const retryAfterSec = Math.max(
      1,
      rawBlockSec > 0
        ? Math.ceil(rawBlockSec)
        : rawExpireSec > 0
          ? Math.ceil(rawExpireSec)
          : fallbackTtlSec,
    );

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(retryAfterSec));
    }

    const minutes = Math.floor(retryAfterSec / 60);
    const seconds = retryAfterSec % 60;
    const durationText =
      minutes > 0
        ? seconds > 0
          ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
          : `${minutes} minute${minutes > 1 ? 's' : ''}`
        : `${retryAfterSec} seconde${retryAfterSec > 1 ? 's' : ''}`;

    throw new ThrottlerException(
      `Trop de tentatives ou de requêtes rapprochées. Veuillez patienter ${durationText} avant de réessayer.`,
    );
  }
}
