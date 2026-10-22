/* ============================================================
   Alexandria — Cliente HTTP da API
   ============================================================ */

/**
 * Base da API. Em desenvolvimento o front roda em outra porta (5173),
 * então o endereço do back-end vem da variável de ambiente `VITE_API_URL`
 * (definida em `frontend/.env` — ver README).
 */
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

/** Erro de API: carrega o status HTTP e a mensagem devolvida pelo back-end. */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function montarUrl(path, query) {
  const url = new URL(BASE + path, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([chave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      url.searchParams.set(chave, String(valor));
    });
  }

  return url.toString();
}

async function request(path, { method = 'GET', query, body } = {}) {
  let resposta;

  try {
    resposta = await fetch(montarUrl(path, query), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (erro) {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique se o back-end está em execução.',
      0,
      null
    );
  }

  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch (e) {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      (dados && (dados.error || dados.message)) || `Falha na requisição (${resposta.status}).`;
    throw new ApiError(mensagem, resposta.status, dados);
  }

  return dados;
}

export const api = {
  /* ---------- Autenticação ---------- */

  /** Login por e-mail (o login do sistema). */
  login(email, pass) {
    return request('/leitor/login', { method: 'POST', body: { email, pass } });
  },

  /** Cadastro público de leitor. */
  register(dados) {
    return request('/leitor/register', { method: 'POST', body: dados });
  },

  /* ---------- Usuários (bibliotecário) ---------- */

  listUsers({ admId, q, status, tipo, page, perPage } = {}) {
    return request('/leitor', { query: { admId, q, status, tipo, page, perPage } });
  },

  getUser(userId) {
    return request(`/leitor/${userId}`);
  },

  /** Consulta o endereço completo a partir do CEP (ViaCEP). */
  lookupCep(cep) {
    return request(`/leitor/cep/${String(cep).replace(/\D/g, '')}`);
  },

  createUser(admId, dados) {
    return request('/leitor', { method: 'POST', query: { admId }, body: dados });
  },

  updateUser(admId, userId, dados) {
    return request(`/leitor/${userId}`, { method: 'PATCH', query: { admId }, body: dados });
  },

  deleteUser(admId, userId) {
    return request(`/leitor/${userId}`, { method: 'DELETE', query: { admId } });
  },

  /* ---------- Acervo ---------- */

  listBooks({ q, category, status, page, perPage } = {}) {
    return request('/livros', { query: { q, category, status, page, perPage } });
  },

  listCategories() {
    return request('/livros/categorias');
  },

  getBook(bookId) {
    return request(`/livros/${bookId}`);
  },

  bookHistory(admId, bookId) {
    return request(`/livros/${bookId}/history`, { query: { admId } });
  },

  createBook(admId, dados) {
    return request('/livros', { method: 'POST', query: { admId }, body: dados });
  },

  updateBook(admId, bookId, dados) {
    return request(`/livros/${bookId}`, { method: 'PATCH', query: { admId }, body: dados });
  },

  deleteBook(admId, bookId) {
    return request(`/livros/${bookId}`, { method: 'DELETE', query: { admId } });
  },

  /* ---------- Empréstimos ---------- */

  listLoans({ admId, q, status, userId, page, perPage } = {}) {
    return request('/emprestimos', { query: { admId, q, status, userId, page, perPage } });
  },

  myLoans({ userId, q, status, page, perPage } = {}) {
    return request('/emprestimos/me', { query: { userId, q, status, page, perPage } });
  },

  createLoan(admId, { bookId, userId, dias }) {
    return request('/emprestimos', { method: 'POST', query: { admId }, body: { bookId, userId, dias } });
  },

  returnLoan(admId, historyId) {
    return request(`/emprestimos/${historyId}/devolver`, { method: 'POST', query: { admId } });
  },

  renewLoan(admId, historyId) {
    return request(`/emprestimos/${historyId}/renovar`, { method: 'POST', query: { admId } });
  },

  /* ---------- Painéis ---------- */

  dashboardResumo(admId) {
    return request('/dashboard/resumo', { query: { admId } });
  },

  dashboardLeitor(userId) {
    return request('/dashboard/leitor', { query: { userId } });
  }
};

export default api;
