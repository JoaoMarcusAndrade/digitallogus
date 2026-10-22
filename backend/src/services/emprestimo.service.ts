/**
 * Serviço de Empréstimos — regras de negócio do fluxo de circulação.
 *
 * Regras:
 *  - Registrar empréstimo: exigem bibliotecário (admId). Cria o registro de
 *    empréstimo e decrementa a quantidade disponível do livro.
 *  - Devolver: fecha o empréstimo (dataDevolucao) e incrementa a disponibilidade.
 *  - Renovar: estende o prazo (máx. 2 renovações) e incrementa o contador.
 *  - Um mesmo leitor não deve ter mais de um empréstimo ativo do mesmo livro.
 */

import { Op } from "sequelize";
import Book from "../models/Book.js";
import User from "../models/User.js";
import History from "../models/History.js";
import Emprestimo from "../models/Emprestimo.js";
import { toLoanDTO } from "../dto/serializers.js";
import { httpError, requireLibrarian } from "../utils/auth.js";
import { contem, lerPaginacao, montarPagina, termoBusca } from "../utils/pagination.js";

const RENOVACAO_MAX = 2;
const DIAS_PADRAO = 14;

/**
 * Recarrega um empréstimo com o livro e o leitor aninhados (para a resposta da API).
 */
async function carregarEmprestimo(emprestimoId: number) {
  return Emprestimo.findByPk(emprestimoId, {
    include: [
      { model: Book, as: "livro", attributes: ["id", "title", "author", "ISBN", "publisher", "category", "year", "location", "quantity", "quantityAvailable", "coverColor"] },
      { model: User, as: "leitor", attributes: ["id", "name", "matricula", "email", "telefone", "userLevel", "status"] }
    ]
  });
}

/**
 * Registra um empréstimo (cria o histórico) — bibliotecário.
 * @param admId ID do bibliotecário
 * @param bookId ID do livro
 * @param userId ID do leitor
 * @param dias Prazo de devolução (padrão 14)
 */
export async function emprestar(admId: number, bookId: number, userId: number, dias?: number) {
  await requireLibrarian(admId);

  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw httpError("Usuário não encontrado", 404);
  }

  // Usuário deve estar apto
  if (user.status !== 'apto') {
    throw httpError("Usuário inapto não pode realizar empréstimos.", 400);
  }

  // Verifica se o leitor já tem empréstimo ativo do mesmo livro
  const jaEmprestado = await Emprestimo.findOne({
    where: { bookId, userId, status: ['ativo', 'atrasado'] }
  });
  if (jaEmprestado) {
    throw httpError("Este usuário já possui empréstimo ativo para este título.", 400);
  }

  // Verifica disponibilidade de exemplares
  const available = book.get("quantityAvailable") as number;
  if (available <= 0) {
    throw httpError("Não há exemplares disponíveis para este título.", 400);
  }

  const prazo = dias && dias > 0 ? dias : DIAS_PADRAO;
  const hoje = new Date();
  const prevista = new Date(hoje);
  prevista.setDate(prevista.getDate() + prazo);

  // Decrementa um exemplar disponível
  book.set("quantityAvailable", available - 1);
  await book.save();

  const emprestimo = await Emprestimo.create({
    bookId,
    userId,
    dataEmprestimo: hoje,
    dataDevolucaoPrevista: prevista,
    dataDevolucao: null,
    renovacoes: 0,
    status: 'ativo'
  });

  await registrarHistorico('emprestar', emprestimo);

  return toLoanDTO(await carregarEmprestimo(emprestimo.id as number));
}

/**
 * Grava a movimentação no histórico do usuário (tabela Histories).
 */
async function registrarHistorico(acao: 'emprestar' | 'devolver' | 'renovar', emprestimo: any) {
  await History.create({
    acao,
    emprestimoId: emprestimo.id,
    bookId: emprestimo.bookId,
    userId: emprestimo.userId,
    dataEmprestimo: emprestimo.dataEmprestimo,
    dataDevolucaoPrevista: emprestimo.dataDevolucaoPrevista,
    dataDevolucao: emprestimo.dataDevolucao || null,
    renovacoes: emprestimo.renovacoes || 0,
    status: emprestimo.status
  });
}

/**
 * Registra a devolução de um empréstimo — bibliotecário.
 */
export async function devolver(admId: number, emprestimoId: number) {
  await requireLibrarian(admId);

  const emprestimo = await Emprestimo.findByPk(emprestimoId);
  if (!emprestimo) {
    throw httpError("Empréstimo não encontrado", 404);
  }

  if (emprestimo.status === 'devolvido') {
    throw httpError("Empréstimo já devolvido.", 400);
  }

  const book = await Book.findByPk(emprestimo.bookId);

  // Reativa um exemplar disponível (limita ao total)
  if (book) {
    const total = book.get("quantity") as number;
    const available = book.get("quantityAvailable") as number;
    book.set("quantityAvailable", Math.min(total, available + 1));
    await book.save();
  }

  emprestimo.set("dataDevolucao", new Date());
  emprestimo.set("status", 'devolvido');
  await emprestimo.save();

  await registrarHistorico('devolver', emprestimo);

  return toLoanDTO(await carregarEmprestimo(emprestimo.id as number));
}

/**
 * Renova um empréstimo ativo — bibliotecário (máx. 2 renovações, +7 dias).
 */
export async function renovar(admId: number, emprestimoId: number) {
  await requireLibrarian(admId);

  const emprestimo = await Emprestimo.findByPk(emprestimoId);
  if (!emprestimo) {
    throw httpError("Empréstimo não encontrado", 404);
  }

  if (emprestimo.status === 'devolvido') {
    throw httpError("Registro já devolvido.", 400);
  }

  const renovacoes = emprestimo.get("renovacoes") as number;
  if (renovacoes >= RENOVACAO_MAX) {
    throw httpError("Limite de 2 renovações atingido.", 400);
  }

  const prevista = new Date(emprestimo.get("dataDevolucaoPrevista") as Date);
  prevista.setDate(prevista.getDate() + 7);

  emprestimo.set("dataDevolucaoPrevista", prevista);
  emprestimo.set("renovacoes", renovacoes + 1);
  // Se estava atrasado, volta a ativo
  if (emprestimo.status === 'atrasado') {
    emprestimo.set("status", 'ativo');
  }
  await emprestimo.save();

  await registrarHistorico('renovar', emprestimo);

  return toLoanDTO(await carregarEmprestimo(emprestimo.id as number));
}

interface FiltrosEmprestimos {
  q?: string;
  status?: string;
  userId?: number;
  page?: number;
  perPage?: number;
}

/**
 * Condição de filtro por status **efetivo** do empréstimo.
 * O status gravado no banco pode estar defasado (o cron grava o atraso depois),
 * então o filtro considera a data prevista — igual ao `statusEfetivoEmprestimo`.
 */
function condicaoStatus(status?: string): Record<string, any> | null {
  const s = String(status ?? "").trim().toLowerCase();
  if (!s) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (s === "returned" || s === "devolvido") {
    return { [Op.or]: [{ status: "devolvido" }, { dataDevolucao: { [Op.ne]: null } }] };
  }
  if (s === "overdue" || s === "atrasado") {
    return {
      status: { [Op.in]: ["ativo", "atrasado"] },
      dataDevolucao: null,
      dataDevolucaoPrevista: { [Op.lt]: hoje }
    };
  }
  if (s === "active" || s === "ativo") {
    return {
      status: { [Op.in]: ["ativo", "atrasado"] },
      dataDevolucao: null,
      dataDevolucaoPrevista: { [Op.gte]: hoje }
    };
  }
  return null;
}

/** IDs dos leitores que casam com o termo de busca. */
async function idsDeLeitores(termo: string): Promise<number[]> {
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { name: contem(termo) },
        { email: contem(termo) },
        { matricula: contem(termo) }
      ]
    },
    attributes: ["id"]
  });
  return users.map((u) => u.get("id") as number);
}

/** IDs dos livros que casam com o termo de busca. */
async function idsDeLivros(termo: string): Promise<number[]> {
  const books = await Book.findAll({
    where: {
      [Op.or]: [
        { title: contem(termo) },
        { author: contem(termo) },
        { ISBN: contem(termo) }
      ]
    },
    attributes: ["id"]
  });
  return books.map((b) => b.get("id") as number);
}

/**
 * Lista todos os empréstimos (com dados do leitor e do livro) — bibliotecário.
 * Suporta busca (`q`), filtro por status e paginação.
 */
export async function listAll(admId: number, filtros: FiltrosEmprestimos = {}) {
  await requireLibrarian(admId);

  const pagina = lerPaginacao(filtros);
  const condicoes: Record<string, any>[] = [];

  const status = condicaoStatus(filtros.status);
  if (status) condicoes.push(status);

  if (filtros.userId) {
    condicoes.push({ userId: Number(filtros.userId) });
  }

  const termo = termoBusca(filtros.q);
  if (termo) {
    const [leitores, livros] = await Promise.all([idsDeLeitores(termo), idsDeLivros(termo)]);
    condicoes.push({
      [Op.or]: [
        { userId: { [Op.in]: leitores } },
        { bookId: { [Op.in]: livros } }
      ]
    });
  }

  const where = condicoes.length ? { [Op.and]: condicoes } : {};

  const [total, loans] = await Promise.all([
    Emprestimo.count({ where }),
    Emprestimo.findAll({
      where,
      include: [
        { model: Book, as: "livro", attributes: ["id", "title", "author", "ISBN", "publisher", "category", "year", "location", "quantity", "quantityAvailable", "coverColor"] },
        { model: User, as: "leitor", attributes: ["id", "name", "matricula", "email", "telefone", "userLevel", "status"] }
      ],
      limit: pagina.limit,
      offset: pagina.offset,
      order: [["dataEmprestimo", "DESC"]]
    })
  ]);

  return montarPagina(loans.map((h) => toLoanDTO(h)), total, pagina);
}

/**
 * Lista os empréstimos de um leitor específico.
 * Exige o ID do próprio usuário (para não expor dados de terceiros no padrão simples).
 * Suporta busca (`q`), filtro por status e paginação.
 */
export async function listByUser(userId: number, filtros: FiltrosEmprestimos = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw httpError("Usuário não encontrado", 404);
  }

  const pagina = lerPaginacao(filtros);
  const condicoes: Record<string, any>[] = [{ userId }];

  const status = condicaoStatus(filtros.status);
  if (status) condicoes.push(status);

  const termo = termoBusca(filtros.q);
  if (termo) {
    const livros = await idsDeLivros(termo);
    condicoes.push({ bookId: { [Op.in]: livros } });
  }

  const where = { [Op.and]: condicoes };

  const [total, loans] = await Promise.all([
    Emprestimo.count({ where }),
    Emprestimo.findAll({
      where,
      include: [
        { model: Book, as: "livro", attributes: ["id", "title", "author", "ISBN", "publisher", "category", "year", "location", "quantity", "quantityAvailable", "coverColor"] }
      ],
      limit: pagina.limit,
      offset: pagina.offset,
      order: [["dataEmprestimo", "DESC"]]
    })
  ]);

  return montarPagina(loans.map((h) => toLoanDTO(h)), total, pagina);
}

/**
 * Empréstimos que vencem em até `dias` dias (para o cron de aviso "devolva em breve").
 */
export async function dueSoon(dias: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);
  limite.setHours(23, 59, 59, 999);

  return Emprestimo.findAll({
    where: {
      status: ['ativo', 'atrasado'],
      dataDevolucaoPrevista: {
        [Op.gte]: hoje,
        [Op.lte]: limite
      }
    },
    include: [
      { model: Book, as: "livro", attributes: ["id", "title", "author"] },
      { model: User, as: "leitor", attributes: ["id", "name", "email"] }
    ]
  });
}

/**
 * Empréstimos atrasados (para o cron de cobrança) e que ainda não constam como devolvidos.
 */
export async function overdue() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return Emprestimo.findAll({
    where: {
      status: ['ativo', 'atrasado'],
      dataDevolucaoPrevista: {
        [Op.lt]: hoje
      }
    },
    include: [
      { model: Book, as: "livro", attributes: ["id", "title", "author"] },
      { model: User, as: "leitor", attributes: ["id", "name", "email"] }
    ]
  });
}

/**
 * Atualiza em lote o status de empréstimos que já passaram do prazo para 'atrasado'.
 * Pode ser chamado pelo cron para manter o status consistente.
 */
export async function markOverdue() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await Emprestimo.update(
    { status: 'atrasado' },
    {
      where: {
        status: 'ativo',
        dataDevolucaoPrevista: { [Op.lt]: hoje }
      }
    }
  );
}
