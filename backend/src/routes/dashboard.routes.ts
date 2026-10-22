/**
 * Rotas do Painel (Dashboards).
 *
 *  - /resumo  — painel do bibliotecário (`?admId=`).
 *  - /leitor  — painel do leitor (`?userId=`).
 */
import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";

const router = Router();

/**
 * @swagger
 * /api/dashboard/resumo:
 *   get:
 *     summary: Resumo do painel do bibliotecário
 *     description: Retorna os indicadores do acervo, dos usuários e da circulação, além dos empréstimos recentes, dos títulos esgotados, do acervo por categoria e das notificações.
 *     tags:
 *       - Painel
 *     parameters:
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Resumo do painel
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Administrador não encontrado
 */
router.get("/resumo", dashboardController.resumo);

/**
 * @swagger
 * /api/dashboard/leitor:
 *   get:
 *     summary: Resumo do painel do leitor
 *     description: Retorna os indicadores do leitor (meus empréstimos, atrasos), títulos disponíveis para empréstimo e as notificações de atraso/devolução.
 *     tags:
 *       - Painel
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         description: ID do leitor
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       '200':
 *         description: Resumo do painel do leitor
 *       '404':
 *         description: Usuário não encontrado
 */
router.get("/leitor", dashboardController.leitor);

export default router;
