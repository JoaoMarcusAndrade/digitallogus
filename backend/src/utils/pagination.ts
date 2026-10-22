/**
 * Paginação e busca textual — utilitários compartilhados pelos serviços.
 *
 * Todas as listagens da API respondem no mesmo envelope:
 *   { items, total, page, perPage, pages }
 * onde `pages` é o total de páginas (mínimo 1, mesmo sem resultados).
 *
 * Sobre a busca (`q`): o filtro usa `LIKE` do SQLite, que é case-insensitive
 * para caracteres ASCII. Acentos devem ser digitados como estão no cadastro
 * (ex.: "história" encontra "História", mas "historia" não encontra).
 */

import { Op } from "sequelize";

/** Padrão do front (a paginação do protótipo usa 8 itens por página). */
export const PER_PAGE_PADRAO = 8;
/** Teto para evitar que o cliente peça a lista inteira do acervo. */
export const PER_PAGE_MAXIMO = 100;

export interface Pagina {
  page: number;
  perPage: number;
  limit: number;
  offset: number;
}

export interface Envelope<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

/** Lê `page`/`perPage` da query string e normaliza os valores. */
export function lerPaginacao(query: Record<string, any> = {}): Pagina {
  const pageRaw = Number(query.page);
  const perPageRaw = Number(query.perPage);

  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const perPage = Number.isFinite(perPageRaw) && perPageRaw >= 1
    ? Math.min(Math.floor(perPageRaw), PER_PAGE_MAXIMO)
    : PER_PAGE_PADRAO;

  return { page, perPage, limit: perPage, offset: (page - 1) * perPage };
}

/** Monta o envelope de resposta a partir dos itens da página atual. */
export function montarPagina<T>(items: T[], total: number, pagina: Pagina): Envelope<T> {
  return {
    items,
    total,
    page: pagina.page,
    perPage: pagina.perPage,
    pages: Math.max(1, Math.ceil(total / pagina.perPage))
  };
}

/** Normaliza o termo de busca (trim + minúsculas). */
export function termoBusca(valor: unknown): string {
  return String(valor ?? "").trim().toLowerCase();
}

/** Condição "contém" para busca textual (`%termo%`). */
export function contem(termo: string): { [key: string]: any } {
  return { [Op.like]: `%${termo}%` };
}
