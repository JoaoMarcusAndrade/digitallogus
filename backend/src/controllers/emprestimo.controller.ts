/**
 * Controlador de Empréstimos — recebe as requisições HTTP e repassa ao serviço.
 */

import { Request, Response } from "express";
import {
  emprestar,
  devolver,
  renovar,
  listAll,
  listByUser
} from "../services/emprestimo.service.js";

/**
 * Tratamento central de erro.
 */
function handleError(res: Response, error: any) {
  const status = error?.statusCode || 400;
  return res.status(status).json({ error: error.message });
}

export const emprestimoController = {

  /** POST /api/emprestimos?admId= — registra um empréstimo (bibliotecário) */
  async create(req: Request, res: Response): Promise<Response> {
    const admId = Number(req.query.admId);
    const { bookId, userId, dias } = req.body;

    if (isNaN(admId)) {
      return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
    }
    if (!bookId || !userId) {
      return res.status(400).json({ error: "Os campos bookId e userId são obrigatórios." });
    }

    try {
      const result = await emprestar(admId, Number(bookId), Number(userId), dias ? Number(dias) : undefined);
      return res.status(201).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** GET /api/emprestimos?admId= — lista os empréstimos (bibliotecário) com filtros e paginação */
  async selectAll(req: Request, res: Response): Promise<Response> {
    const admId = Number(req.query.admId);

    if (isNaN(admId)) {
      return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
    }

    try {
      const { q, status, userId, page, perPage } = req.query as Record<string, any>;
      const loans = await listAll(admId, { q, status, userId, page, perPage });
      return res.status(200).json(loans);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** GET /api/emprestimos/me?userId= — lista os empréstimos do próprio leitor */
  async selectMine(req: Request, res: Response): Promise<Response> {
    const userId = Number(req.query.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "O parâmetro userId é obrigatório e deve ser um número válido." });
    }

    try {
      const { q, status, page, perPage } = req.query as Record<string, any>;
      const loans = await listByUser(userId, { q, status, page, perPage });
      return res.status(200).json(loans);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** POST /api/emprestimos/:historyId/devolver?admId= — registra devolução (bibliotecário) */
  async returnLoan(req: Request, res: Response): Promise<Response> {
    const { historyId } = req.params;
    const admId = Number(req.query.admId);
    const historyIdNum = Number(historyId);

    if (isNaN(historyIdNum) || isNaN(admId)) {
      return res.status(400).json({ error: "Os parâmetros historyId e admId devem ser números válidos." });
    }

    try {
      const result = await devolver(admId, historyIdNum);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** POST /api/emprestimos/:historyId/renovar?admId= — renova empréstimo (bibliotecário) */
  async renewLoan(req: Request, res: Response): Promise<Response> {
    const { historyId } = req.params;
    const admId = Number(req.query.admId);
    const historyIdNum = Number(historyId);

    if (isNaN(historyIdNum) || isNaN(admId)) {
      return res.status(400).json({ error: "Os parâmetros historyId e admId devem ser números válidos." });
    }

    try {
      const result = await renovar(admId, historyIdNum);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  }
};
