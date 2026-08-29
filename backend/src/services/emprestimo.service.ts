/**
 * Serviço de Empréstimos — regras de negócio do fluxo de circulação.
 *
 * Regras:
 *  - Registrar empréstimo: exigem bibliotecário (admId). Cria o registro de
 *    histórico e decrementa a quantidade disponível do livro.
 *  - Devolver: fecha o histórico (dataDevolucao) e incrementa a disponibilidade.
 *  - Renovar: estende o prazo (máx. 2 renovações) e incrementa o contador.
 *  - Um mesmo leitor não deve ter mais de um empréstimo ativo do mesmo livro.
 */

import Book from "../models/Book.js";
import User from "../models/User.js";
import History from "../models/History.js";
import { httpError, requireLibrarian } from "../utils/auth.js";

const RENOVACAO_MAX = 2;
const DIAS_PADRAO = 14;

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
  const jaEmprestado = await History.findOne({
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

  const history = await History.create({
    bookId,
    userId,
    dataEmprestimo: hoje,
    dataDevolucaoPrevista: prevista,
    dataDevolucao: null,
    renovacoes: 0,
    status: 'ativo'
  });

  return {
    id: history.get("id"),
    bookId,
    userId,
    dataEmprestimo: history.get("dataEmprestimo"),
    dataDevolucaoPrevista: history.get("dataDevolucaoPrevista"),
    status: history.get("status")
  };
}

/**
 * Registra a devolução de um empréstimo — bibliotecário.
 */
export async function devolver(admId: number, historyId: number) {
  await requireLibrarian(admId);

  const history = await History.findByPk(historyId);
  if (!history) {
    throw httpError("Empréstimo não encontrado", 404);
  }

  if (history.status === 'devolvido') {
    throw httpError("Empréstimo já devolvido.", 400);
  }

  const book = await Book.findByPk(history.bookId);

  // Reativa um exemplar disponível (limita ao total)
  if (book) {
    const total = book.get("quantity") as number;
    const available = book.get("quantityAvailable") as number;
    book.set("quantityAvailable", Math.min(total, available + 1));
    await book.save();
  }

  history.set("dataDevolucao", new Date());
  history.set("status", 'devolvido');
  await history.save();

  return {
    id: history.get("id"),
    bookId: history.get("bookId"),
    userId: history.get("userId"),
    dataDevolucao: history.get("dataDevolucao"),
    status: history.get("status")
  };
}

/**
 * Renova um empréstimo ativo — bibliotecário (máx. 2 renovações, +7 dias).
 */
export async function renovar(admId: number, historyId: number) {
  await requireLibrarian(admId);

  const history = await History.findByPk(historyId);
  if (!history) {
    throw httpError("Empréstimo não encontrado", 404);
  }

  if (history.status === 'devolvido') {
    throw httpError("Registro já devolvido.", 400);
  }

  const renovacoes = history.get("renovacoes") as number;
  if (renovacoes >= RENOVACAO_MAX) {
    throw httpError("Limite de 2 renovações atingido.", 400);
  }

  const prevista = new Date(history.get("dataDevolucaoPrevista") as Date);
  prevista.setDate(prevista.getDate() + 7);

  history.set("dataDevolucaoPrevista", prevista);
  history.set("renovacoes", renovacoes + 1);
  // Se estava atrasado, volta a ativo
  if (history.status === 'atrasado') {
    history.set("status", 'ativo');
  }
  await history.save();

  return {
    id: history.get("id"),
    dataDevolucaoPrevista: history.get("dataDevolucaoPrevista"),
    renovacoes: history.get("renovacoes"),
    status: history.get("status")
  };
}

/**
 * Lista todos os empréstimos (com dados do leitor e do livro) — bibliotecário.
 */
export async function listAll(admId: number) {
  await requireLibrarian(admId);

  return History.findAll({
    include: [
      { model: Book, as: "livro", attributes: ["id", "title", "author", "ISBN"] },
      { model: User, as: "leitor", attributes: ["id", "name", "email"] }
    ],
    order: [["dataEmprestimo", "DESC"]]
  });
}

/**
 * Lista os empréstimos de um leitor específico.
 * Exige o ID do próprio usuário (para não expor dados de terceiros no padrão simples).
 */
export async function listByUser(userId: number) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw httpError("Usuário não encontrado", 404);
  }

  return History.findAll({
    where: { userId },
    include: [
      { model: Book, as: "livro", attributes: ["id", "title", "author", "ISBN"] }
    ],
    order: [["dataEmprestimo", "DESC"]]
  });
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

  return History.findAll({
    where: {
      status: ['ativo', 'atrasado'],
      dataDevolucaoPrevista: {
        [">="]: hoje,
        ["<="]: limite
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

  return History.findAll({
    where: {
      status: ['ativo', 'atrasado'],
      dataDevolucaoPrevista: {
        ["<"]: hoje
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

  await History.update(
    { status: 'atrasado' },
    {
      where: {
        status: 'ativo',
        dataDevolucaoPrevista: { ["<"]: hoje }
      }
    }
  );
}
