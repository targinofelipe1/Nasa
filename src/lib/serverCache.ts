// lib/serverCache.ts
import NodeCache from 'node-cache';

const serverCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); 
const CACHE_VERSION_SERVER = '1.0';

interface CacheEntry {
  data: any;
  version: string;
}

export async function getOrSetCache<T>(
  key: string,
  fetchDataFunction: () => Promise<T>
): Promise<T> {
  const cached = serverCache.get(key) as CacheEntry | undefined;

  if (cached && cached.version === CACHE_VERSION_SERVER) {
    console.log(`[SERVER CACHE HIT] Servindo ${key} do cache.`);
    return cached.data; // <-- RETORNO RÁPIDO DO CACHE
  }

  console.log(`[SERVER CACHE MISS] Buscando ${key} da fonte externa.`);
  const freshData = await fetchDataFunction(); // <-- AQUI É ONDE A LENTIDÃO ACONTECE

  serverCache.set(key, { data: freshData, version: CACHE_VERSION_SERVER } as CacheEntry);
  return freshData;
}

export function clearServerCache() {
  serverCache.flushAll();
  console.log('[SERVER CACHE] Cache limpo manualmente.');
}