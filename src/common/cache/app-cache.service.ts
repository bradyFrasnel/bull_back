import { Injectable } from '@nestjs/common';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

/**
 * Service de cache mémoire léger avec TTL et invalidation automatique.
 * Réduit drastiquement les requêtes répétitives vers Supabase (PostgreSQL distant)
 * pour le référentiel académique (filières, classes, semestres, UE, matières) et les statistiques.
 */
@Injectable()
export class AppCacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly maxEntries = 500;
  private hits = 0;
  private misses = 0;

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value as T;
  }

  set<T = any>(key: string, value: T, ttlMs: number = 210_000): void {
    // Nettoyage si la limite max est atteinte
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}
