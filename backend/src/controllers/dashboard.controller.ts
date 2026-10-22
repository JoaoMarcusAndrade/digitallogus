/**
 * Controlador do Painel (Dashboards).
 */

import { Request, Response } from "express";
import { resumoBibliotecario, resumoLeitor } from "../services/dashboard.service.js";

function handleError(res: Response, error: any) {
  const status = error?.statusCode || 400;
  return res.status(status).json({ error: error.message });
}

export const dashboardController = {

  /** GET /api/dashboard/resumo?admId= — painel do bibliotecário */
  async resumo(req: Request, res: Response): Promise<Response> {
    const admId = Number(req.query.admId);

    if (isNaN(admId)) {
      return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
    }

    try {
      const result = await resumoBibliotecario(admId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  },

  /** GET /api/dashboard/leitor?userId= — painel do leitor */
  async leitor(req: Request, res: Response): Promise<Response> {
    const userId = Number(req.query.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "O parâmetro userId é obrigatório e deve ser um número válido." });
    }

    try {
      const result = await resumoLeitor(userId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleError(res, error);
    }
  }
};
