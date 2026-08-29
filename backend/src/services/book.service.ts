/**
 * Serviço de Livros — regras de negócio do CRUD de acervo.
 *
 * Regras:
 *  - Criação, edição e exclusão exigem um bibliotecário (admId).
 *  - Ao criar um livro, a quantidade disponível (quantityAvailable) é
 *    inicializada igual à quantidade total (quantity).
 *  - Não é possível excluir um livro com empréstimo ativo (inovido) para
 *    preservar o histórico.
 */

import Book from "../models/Book.js";
import History from "../models/History.js";
import User from "../models/User.js";
import { httpError, requireLibrarian } from "../utils/auth.js";

interface BookDTO {
  title: string;
  author: string;
  ISBN: string;
  publisher?: string;
  category?: string;
  year?: number;
  location?: string;
  quantity?: number;
  coverColor?: string | null;
}

function sanitizeBook(book: Book) {
  return book.toJSON();
}

/**
 * Lista todos os livros do acervo.
 * Acesso: qualquer usuário (leitor pode apenas visualizar).
 */
export async function getAllBooks() {
  const books = await Book.findAll({
    order: [["title", "ASC"]]
  });
  return books.map(sanitizeBook);
}

/**
 * Busca um livro por ID.
 * Acesso: qualquer usuário (visualização).
 */
export async function getBook(bookId: number) {
  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }
  return sanitizeBook(book);
}

/**
 * Cria um novo livro. Requer bibliotecário (admId).
 */
export async function createBook(admId: number, data: BookDTO) {
  await requireLibrarian(admId);

  if (!data.title || !data.author || !data.ISBN) {
    throw httpError("Título, autor e ISBN são obrigatórios.", 400);
  }

  // Verifica ISBN duplicado
  const existing = await Book.findOne({ where: { ISBN: data.ISBN } });
  if (existing) {
    throw httpError("Já existe um livro com este ISBN.", 400);
  }

  const quantity = data.quantity && data.quantity > 0 ? data.quantity : 1;

  const book = await Book.create({
    title: data.title,
    author: data.author,
    ISBN: data.ISBN,
    publisher: data.publisher || "",
    category: data.category || "Outros",
    year: data.year || new Date().getFullYear(),
    location: data.location || "",
    quantity,
    quantityAvailable: quantity,
    coverColor: data.coverColor || null
  });

  return sanitizeBook(book);
}

/**
 * Atualiza um livro. Requer bibliotecário (admId).
 * Ajusta quantityAvailable a partir da variação de quantity.
 */
export async function updateBook(admId: number, bookId: number, data: Partial<BookDTO>) {
  await requireLibrarian(admId);

  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }

  // Se o ISBN for alterado, impede duplicidade
  if (data.ISBN && data.ISBN !== book.get("ISBN")) {
    const existing = await Book.findOne({ where: { ISBN: data.ISBN } });
    if (existing) {
      throw httpError("Já existe um livro com este ISBN.", 400);
    }
    book.set("ISBN", data.ISBN);
  }

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.publisher !== undefined) updateData.publisher = data.publisher;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.coverColor !== undefined) updateData.coverColor = data.coverColor;

  // Ajuste de exemplares: mantém a proporção disponível
  if (data.quantity !== undefined && data.quantity > 0) {
    const currentQty = book.get("quantity") as number;
    const currentAvail = book.get("quantityAvailable") as number;
    // Livros emprestados = total - disponíveis
    const loaned = currentQty - currentAvail;
    if (data.quantity < loaned) {
      throw httpError("Não é possível reduzir a quantidade: há exemplares emprestados.", 400);
    }
    updateData.quantity = data.quantity;
    updateData.quantityAvailable = data.quantity - loaned;
  }

  await book.update(updateData);
  return sanitizeBook(book);
}

/**
 * Retorna o histórico de empréstimos de um livro, com os leitores e as datas
 * de entrada (dataEmprestimo) e saída (dataDevolucao).
 * Acesso: qualquer usuário (visualização).
 */
export async function getBookHistory(bookId: number) {
  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }

  const records = await History.findAll({
    where: { bookId },
    include: [
      {
        model: User,
        as: "leitor",
        attributes: ["id", "name", "email", "telefone"]
      }
    ],
    order: [["dataEmprestimo", "DESC"]]
  });

  return records.map((h) => ({
    id: h.get("id"),
    leitor: h.get("leitor"),
    dataEmprestimo: h.get("dataEmprestimo"),
    dataDevolucaoPrevista: h.get("dataDevolucaoPrevista"),
    dataDevolucao: h.get("dataDevolucao"),
    renovacoes: h.get("renovacoes"),
    status: h.get("status")
  }));
}

/**
 * Exclui um livro. Requer bibliotecário (admId).
 * Bloqueia a exclusão se houver empréstimo ativo (preserva o histórico).
 */
export async function deleteBook(admId: number, bookId: number) {
  await requireLibrarian(admId);

  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }

  // Verifica empréstimos ativos (status diferente de 'devolvido')
  const active = await History.count({
    where: { bookId, status: ['ativo', 'atrasado'] }
  });

  if (active > 0) {
    throw httpError("Não é possível excluir: há empréstimo ativo para este título.", 400);
  }

  await book.destroy();
}
