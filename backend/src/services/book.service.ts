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

import { Op } from "sequelize";
import Book from "../models/Book.js";
import Emprestimo from "../models/Emprestimo.js";
import User from "../models/User.js";
import sequelize from "../database/index.js";
import { toBookDTO, toLoanDTO } from "../dto/serializers.js";
import { httpError, requireLibrarian } from "../utils/auth.js";
import { contem, lerPaginacao, montarPagina, termoBusca } from "../utils/pagination.js";

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
  return toBookDTO(book);
}

interface FiltrosLivros {
  q?: string;
  category?: string;
  categoria?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

/**
 * Status calculado de um título (mesma regra do protótipo):
 *  - out:      nenhum exemplar disponível
 *  - loaned:   parte dos exemplares está emprestada
 *  - available: todos os exemplares estão livres
 */
export function statusDoLivro(livro: { quantity: number; quantityAvailable: number }): "available" | "loaned" | "out" {
  const total = Number(livro.quantity) || 0;
  const disponiveis = Number(livro.quantityAvailable) || 0;
  if (disponiveis <= 0) return "out";
  return disponiveis < total ? "loaned" : "available";
}

/**
 * Lista o acervo com busca, filtros e paginação no servidor.
 * Acesso: qualquer usuário (leitor pode apenas visualizar).
 */
export async function getAllBooks(filtros: FiltrosLivros = {}) {
  const pagina = lerPaginacao(filtros);
  // `any` para permitir as chaves simbólicas do Sequelize (Op.and / Op.or).
  const where: any = {};

  const termo = termoBusca(filtros.q);
  if (termo) {
    where[Op.or] = [
      { title: contem(termo) },
      { author: contem(termo) },
      { ISBN: contem(termo) },
      { publisher: contem(termo) }
    ];
  }

  const categoria = (filtros.category ?? filtros.categoria ?? "").trim();
  if (categoria) where.category = categoria;

  const status = String(filtros.status ?? "").trim().toLowerCase();
  if (status === "available" || status === "disponivel") {
    where[Op.and] = [
      { quantityAvailable: { [Op.gt]: 0 } },
      sequelize.where(sequelize.col("quantityAvailable"), Op.eq, sequelize.col("quantity"))
    ];
  } else if (status === "loaned" || status === "emprestado") {
    where[Op.and] = [
      { quantityAvailable: { [Op.gt]: 0 } },
      sequelize.where(sequelize.col("quantityAvailable"), Op.lt, sequelize.col("quantity"))
    ];
  } else if (status === "out" || status === "esgotado") {
    where.quantityAvailable = 0;
  }

  const [total, books] = await Promise.all([
    Book.count({ where }),
    Book.findAll({
      where,
      limit: pagina.limit,
      offset: pagina.offset,
      order: [["title", "ASC"]]
    })
  ]);

  return montarPagina(books.map(sanitizeBook), total, pagina);
}

/**
 * Categorias existentes no acervo, com a contagem de títulos e exemplares.
 * Usado no filtro do acervo e no card "Acervo por categoria" do painel.
 */
export async function getCategories() {
  const books = await Book.findAll({ attributes: ["category", "quantity", "quantityAvailable"] });

  const mapa = new Map<string, { titles: number; copies: number; available: number }>();
  for (const b of books) {
    const categoria = (b.get("category") as string) || "Outros";
    const atual = mapa.get(categoria) ?? { titles: 0, copies: 0, available: 0 };
    atual.titles += 1;
    atual.copies += Number(b.get("quantity")) || 0;
    atual.available += Number(b.get("quantityAvailable")) || 0;
    mapa.set(categoria, atual);
  }

  return [...mapa.entries()]
    .map(([category, dados]) => ({
      category,
      titles: dados.titles,
      copies: dados.copies,
      available: dados.available
    }))
    .sort((a, b) => b.copies - a.copies);
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
 * Acesso: apenas o bibliotecário — o leitor não precisa saber quem pegou o livro.
 */
export async function getBookHistory(admId: number, bookId: number) {
  await requireLibrarian(admId);

  const book = await Book.findByPk(bookId);
  if (!book) {
    throw httpError("Livro não encontrado", 404);
  }

  const records = await Emprestimo.findAll({
    where: { bookId },
    include: [
      {
        model: User,
        as: "leitor",
        attributes: ["id", "name", "matricula", "email", "telefone", "userLevel", "status"]
      }
    ],
    order: [["dataEmprestimo", "DESC"]]
  });

  return records.map((h) => toLoanDTO(h));
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
  const active = await Emprestimo.count({
    where: { bookId, status: ['ativo', 'atrasado'] }
  });

  if (active > 0) {
    throw httpError("Não é possível excluir: há empréstimo ativo para este título.", 400);
  }

  await book.destroy();
}
