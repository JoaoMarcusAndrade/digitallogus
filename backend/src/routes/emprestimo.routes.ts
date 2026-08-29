/**
 * Rotas de Empréstimos (histórico/circulação).
 *
 * Acesso:
 *  - Registro, devolução, renovação e listagem geral — bibliotecário (`?admId=`).
 *  - GET /me — o próprio leitor consulta os próprios empréstimos (`?userId=`).
 */
import { Router } from "express";
import { emprestimoController } from "../controllers/emprestimo.controller.js";

const router = Router();

/**
 * @swagger
 * /api/emprestimos:
 *   post:
 *     summary: Registra um empréstimo (bibliotecário)
 *     description: Cria um registro de histórico e decrementa um exemplar disponível do livro. Requer admId de bibliotecário.
 *     tags:
 *       - Empréstimos
 *     parameters:
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - userId
 *             properties:
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 example: 2
 *               dias:
 *                 type: integer
 *                 description: Prazo de devolução em dias (padrão 14)
 *                 example: 14
 *     responses:
 *       '201':
 *         description: Empréstimo registrado
 *       '400':
 *         description: Dados inválidos, usuário inapto ou sem exemplares
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Livro, usuário ou bibliotecário não encontrado
 */
router.post('/', emprestimoController.create);

/**
 * @swagger
 * /api/emprestimos:
 *   get:
 *     summary: Lista todos os empréstimos (bibliotecário)
 *     description: Retorna todos os registros com dados do leitor e do livro.
 *     tags:
 *       - Empréstimos
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
 *         description: Lista de empréstimos
 *       '403':
 *         description: Acesso negado
 */
router.get('/', emprestimoController.selectAll);

/**
 * @swagger
 * /api/emprestimos/me:
 *   get:
 *     summary: Empréstimos do próprio leitor
 *     description: Retorna os empréstimos de um leitor específico (passado via ?userId=).
 *     tags:
 *       - Empréstimos
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
 *         description: Lista de empréstimos do leitor
 *       '400':
 *         description: userId inválido
 */
router.get('/me', emprestimoController.selectMine);

/**
 * @swagger
 * /api/emprestimos/{historyId}/devolver:
 *   post:
 *     summary: Registra a devolução de um empréstimo (bibliotecário)
 *     description: Fecha o histórico (dataDevolucao) e reativa um exemplar do livro.
 *     tags:
 *       - Empréstimos
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         description: ID do registro de empréstimo
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Devolução registrada
 *       '400':
 *         description: Já devolvido ou dados inválidos
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Empréstimo não encontrado
 */
router.post('/:historyId/devolver', emprestimoController.returnLoan);

/**
 * @swagger
 * /api/emprestimos/{historyId}/renovar:
 *   post:
 *     summary: Renova um empréstimo (bibliotecário)
 *     description: Estende o prazo de devolução em 7 dias (máx. 2 renovações).
 *     tags:
 *       - Empréstimos
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         description: ID do registro de empréstimo
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Empréstimo renovado
 *       '400':
 *         description: Limite de renovações atingido
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Empréstimo não encontrado
 */
router.post('/:historyId/renovar', emprestimoController.renewLoan);

export default router;
