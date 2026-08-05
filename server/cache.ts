/**
 * Redis Cache Middleware for tRPC
 * Provides automatic caching for queries and mutations
 * 
 * Usage:
 * export const cachedQuery = publicProcedure.use(cacheMiddleware);
 */

import { TRPCError } from "@trpc/server";

// Simulated cache store (replace with Redis in production)
const cacheStore = new Map<string, { data: any; timestamp: number }>();

const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum entries

/**
 * Generate cache key from procedure path and input
 */
export function generateCacheKey(path: string, input: any): string {
  return `${path}:${JSON.stringify(input || {})}`;
}

/**
 * Get value from cache if not expired
 */
export function getCached(key: string): any | null {
  const entry = cacheStore.get(key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set value in cache
 */
export function setCached(key: string, data: any): void {
  // Simple LRU: remove oldest entry if cache is full
  if (cacheStore.size >= MAX_CACHE_SIZE) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) cacheStore.delete(firstKey);
  }
  
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cacheStore.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cacheStore.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL / 1000, // in seconds
  };
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCacheByPattern(pattern: string): number {
  let count = 0;
  Array.from(cacheStore.keys()).forEach(key => {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
      count++;
    }
  });
  return count;
}
