/**
 * Controlador de Livros — recebe as requisições HTTP e repassa ao serviço.
 */

import { Request, Response } from "express";
import {
  getAllBooks,
  getBook,
  getBookHistory,
  getCategories,
  createBook,
  updateBook,
  deleteBook
} from "../services/book.service.js";

/**
 * Tratamento central de erro: converte os erros lançados pelos serviços
 * em respostas HTTP com o status adequado.
 */
function handleError(res: Response, error: any) {
  const status = error?.statusCode || 400;
  return res.status(status).json({ error: error.message });
}

export const bookController = {

  /** GET /api/livros — lista o acervo com busca, filtros e paginação */
  async selectAll(req: Request, res: Response): Promise<Response> {
    try {
      const { q, category, categoria, status, page, perPage } = req.query as Record<string, any>;
      const books = await getAllBooks({ q, category, categoria, status, page, perPage });
      return res.status(200).json(books);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** GET /api/livros/categorias — categorias do acervo com contagem */
  async categories(req: Request, res: Response): Promise<Response> {
    try {
      const result = await getCategories();
      return res.status(200).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** GET /api/livros/:bookId — busca um livro */
  async select(req: Request, res: Response): Promise<Response> {
    const { bookId } = req.params;
    const bookIdNum = Number(bookId);

    if (isNaN(bookIdNum)) {
      return res.status(400).json({ error: "O ID do livro é inválido." });
    }

    try {
      const book = await getBook(bookIdNum);
      return res.status(200).json(book);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /**
   * GET /api/livros/:bookId/history?admId= — histórico de empréstimos do livro.
   * Restrito ao bibliotecário: o leitor não precisa saber quem pegou o livro.
   */
  async history(req: Request, res: Response): Promise<Response> {
    const { bookId } = req.params;
    const bookIdNum = Number(bookId);
    const admId = Number(req.query.admId);

    if (isNaN(bookIdNum)) {
      return res.status(400).json({ error: "O ID do livro é inválido." });
    }

    if (isNaN(admId)) {
      return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
    }

    try {
      const records = await getBookHistory(admId, bookIdNum);
      return res.status(200).json(records);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** POST /api/livros?admId= — cria um livro (bibliotecário) */
  async create(req: Request, res: Response): Promise<Response> {
    const admId = Number(req.query.admId);

    if (isNaN(admId)) {
      return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
    }

    try {
      const book = await createBook(admId, req.body);
      return res.status(201).json(book);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** PATCH /api/livros/:bookId?admId= — atualiza um livro (bibliotecário) */
  async update(req: Request, res: Response): Promise<Response> {
    const { bookId } = req.params;
    const admId = Number(req.query.admId);
    const bookIdNum = Number(bookId);

    if (isNaN(bookIdNum) || isNaN(admId)) {
      return res.status(400).json({ error: "Os parâmetros bookId e admId devem ser números válidos." });
    }

    try {
      const book = await updateBook(admId, bookIdNum, req.body);
      return res.status(200).json(book);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** DELETE /api/livros/:bookId?admId= — exclui um livro (bibliotecário) */
  async remove(req: Request, res: Response): Promise<Response> {
    const { bookId } = req.params;
    const admId = Number(req.query.admId);
    const bookIdNum = Number(bookId);

    if (isNaN(bookIdNum) || isNaN(admId)) {
      return res.status(400).json({ error: "Os parâmetros bookId e admId devem ser números válidos." });
    }

    try {
      await deleteBook(admId, bookIdNum);
      return res.status(204).send();
    } catch (error: any) {
      return handleError(res, error);
    }
  }
};
