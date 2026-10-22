/* ============================================================
   Alexandria — Rótulos de exibição (derivados do contrato da API)
   ============================================================ */

const CORES = [
  '#1e3a6e', '#2c4a80', '#3a5f9e', '#14254a',
  '#6b4a2f', '#4a3527', '#d8c49c', '#2563eb',
  '#059669', '#d97706', '#7c3aed', '#0891b2'
];

/** Hash simples (string → número) para escolher uma cor estável. */
function hash(texto) {
  let h = 0;
  const base = String(texto || '');
  for (let i = 0; i < base.length; i++) {
    h = (h * 31 + base.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Cor estável (capa do livro / avatar do usuário) a partir de um texto. */
export function corPara(texto) {
  return CORES[hash(texto) % CORES.length];
}

/** `bibliotecario` → "Administrador" · `leitor` → "Leitor" */
export function tipoUsuario(userLevel) {
  return userLevel === 'bibliotecario' ? 'Administrador' : 'Leitor';
}

/** `bibliotecario` → "Bibliotecário" · `leitor` → "Leitor" */
export function cargoUsuario(userLevel) {
  return userLevel === 'bibliotecario' ? 'Bibliotecário' : 'Leitor';
}

/**
 * Como o usuário é tratado nas telas.
 * - Leitor: apenas o primeiro nome ("Prof. Rita Almeida" → "Rita").
 * - Bibliotecário: nome completo (é o dado do cadastro).
 * A API devolve os dois (`firstName` e `name`).
 */
export function nomeExibido(usuario, curto) {
  if (!usuario) return '—';
  return curto ? (usuario.firstName || usuario.name || '—') : (usuario.name || '—');
}

/** Status do título: `available` | `loaned` | `out` (mesma regra do back-end). */
export function statusLivro(livro) {
  if (!livro) return 'out';
  if (livro.quantityAvailable <= 0) return 'out';
  return livro.quantityAvailable < livro.quantity ? 'loaned' : 'available';
}
