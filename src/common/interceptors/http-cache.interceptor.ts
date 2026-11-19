import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppCacheService } from '../cache/app-cache.service';

/**
 * Préfixes d'URL mis en cache lors des requêtes GET (durée 3 à 4 minutes).
 */
const CACHEABLE_PREFIXES: Array<{ prefix: string; ttlMs: number }> = [
  { prefix: '/filieres', ttlMs: 240_000 },            // 4 min
  { prefix: '/classes', ttlMs: 210_000 },             // 3 min 30
  { prefix: '/semestres', ttlMs: 240_000 },           // 4 min
  { prefix: '/unites-enseignement', ttlMs: 240_000 }, // 4 min
  { prefix: '/matieres', ttlMs: 240_000 },            // 4 min
  { prefix: '/dashboard/stats', ttlMs: 180_000 },     // 3 min
];

/**
 * Intercepteur HTTP de cache :
 * - Met en cache les réponses GET sur les routes de référentiel et de statistiques
 * - Invalide automatiquement le cache dès qu'une mutation (POST, PUT, PATCH, DELETE) réussit
 * - Ajoute l'en-tête HTTP `X-Cache: HIT | MISS`
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: AppCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req || !req.method) {
      return next.handle();
    }

    const method: string = req.method.toUpperCase();
    const url: string = req.originalUrl || req.url || '';

    // Toute écriture (POST, PUT, PATCH, DELETE) hors login invalide le cache
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const isLogin = url.includes('/auth/') && url.includes('/login');
      return next.handle().pipe(
        tap(() => {
          if (!isLogin) {
            this.cacheService.clear();
          }
        }),
      );
    }

    if (method !== 'GET') {
      return next.handle();
    }

    // Vérifier si l'URL fait partie des routes éligibles au cache
    const matchedRule = CACHEABLE_PREFIXES.find(
      (rule) => url === rule.prefix || url.startsWith(`${rule.prefix}/`) || url.startsWith(`${rule.prefix}?`),
    );

    if (!matchedRule) {
      return next.handle();
    }

    // Clé de cache : inclut le rôle et l'ID utilisateur pour isoler les données par rôle
    const userRole = req.user?.role || 'ANON';
    const userId = req.user?.id || 'anon';
    const cacheKey = `${userRole}:${userId}:${url}`;

    const cached = this.cacheService.get(cacheKey);
    if (cached !== undefined) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('X-Cache', 'HIT');
      }
      return of(cached);
    }

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-Cache', 'MISS');
    }

    return next.handle().pipe(
      tap((responseBody) => {
        if (responseBody !== undefined && responseBody !== null) {
          this.cacheService.set(cacheKey, responseBody, matchedRule.ttlMs);
        }
      }),
    );
  }
}
