/**
 * Cache em memória com TTL (Time To Live).
 *
 * Substitui o Redis nesta fase: o back-end roda em processo único e os dados
 * cacheados (por exemplo, consulta de CEP) são descartados quando o processo
 * reinicia — o que é aceitável para esse caso.
 *
 * Se um dia for necessário cache compartilhado entre instâncias, filas de
 * e-mail ou bloqueio do cron, aí sim vale trocar por Redis.
 */

interface Entrada<T> {
  valor: T;
  expiraEm: number;
}

const cache = new Map<string, Entrada<unknown>>();

/** Remove as entradas vencidas (chamada a cada `set`/`get`). */
function limparVencidos() {
  const agora = Date.now();
  for (const [chave, entrada] of cache.entries()) {
    if (entrada.expiraEm <= agora) cache.delete(chave);
  }
}

/**
 * Lê um valor do cache.
 * @param chave identificador do valor cacheado
 * @param ttlMs tempo de vida em milissegundos (padrão: 30 minutos)
 */
export function cacheGet<T>(chave: string, ttlMs = 30 * 60 * 1000): T | null {
  const entrada = cache.get(chave);
  if (!entrada) return null;

  if (entrada.expiraEm <= Date.now()) {
    cache.delete(chave);
    return null;
  }

  return entrada.valor as T;
}

/**
 * Grava um valor no cache com TTL.
 * @param chave identificador do valor cacheado
 * @param valor valor a armazenar
 * @param ttlMs tempo de vida em milissegundos (padrão: 30 minutos)
 */
export function cacheSet<T>(chave: string, valor: T, ttlMs = 30 * 60 * 1000): void {
  limparVencidos();
  cache.set(chave, { valor, expiraEm: Date.now() + ttlMs });
}

/** Remove uma chave específica do cache. */
export function cacheDelete(chave: string): void {
  cache.delete(chave);
}

/** Limpa todo o cache (usado em testes). */
export function cacheClear(): void {
  cache.clear();
}

/** Quantidade de entradas vivas no cache (diagnóstico). */
export function cacheSize(): number {
  limparVencidos();
  return cache.size;
}
