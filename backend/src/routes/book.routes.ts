/**
 * Rotas de Livros.
 *
 * Acesso:
 *  - Consulta (GET) — qualquer usuário (leitor pode apenas visualizar).
 *  - Escrita (POST/PATCH/DELETE) — apenas bibliotecário, identificado por
 *    `?admId=` na query string.
 */
import { Router } from "express";
import { bookController } from "../controllers/book.controller.js";

const router = Router();

/**
 * @swagger
 * /api/livros:
 *   get:
 *     summary: Lista todos os livros do acervo
 *     description: Retorna todos os títulos cadastrados. Acesso liberado para leitores (apenas visualização).
 *     tags:
 *       - Livros
 *     responses:
 *       '200':
 *         description: Lista de livros
 *       '500':
 *         description: Falha ao listar livros
 */
router.get('/', bookController.selectAll);

/**
 * @swagger
 * /api/livros/{bookId}:
 *   get:
 *     summary: Busca um livro por ID
 *     description: Retorna os dados de um único título.
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         description: ID do livro
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Dados do livro
 *       '404':
 *         description: Livro não encontrado
 */
router.get('/:bookId', bookController.select);

/**
 * @swagger
 * /api/livros/{bookId}/history:
 *   get:
 *     summary: Histórico de empréstimos de um livro
 *     description: Retorna o histórico do livro com os leitores e as datas de entrada (dataEmprestimo) e saída (dataDevolucao).
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         description: ID do livro
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Histórico de empréstimos
 *       '404':
 *         description: Livro não encontrado
 */
router.get('/:bookId/history', bookController.history);

/**
 * @swagger
 * /api/livros:
 *   post:
 *     summary: Cadastra um novo livro (bibliotecário)
 *     description: Cria um título no acervo. Requer admId de um bibliotecário na query string.
 *     tags:
 *       - Livros
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
 *               - title
 *               - author
 *               - ISBN
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Dom Casmurro"
 *               author:
 *                 type: string
 *                 example: "Machado de Assis"
 *               ISBN:
 *                 type: string
 *                 example: "9788535910663"
 *               publisher:
 *                 type: string
 *                 example: "Companhia das Letras"
 *               category:
 *                 type: string
 *                 example: "Romance"
 *               year:
 *                 type: integer
 *                 example: 2016
 *               location:
 *                 type: string
 *                 example: "A1-01"
 *               quantity:
 *                 type: integer
 *                 example: 3
 *               coverColor:
 *                 type: string
 *                 nullable: true
 *                 example: "#334155"
 *     responses:
 *       '201':
 *         description: Livro criado
 *       '400':
 *         description: Dados inválidos ou ISBN duplicado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Bibliotecário não encontrado
 */
router.post('/', bookController.create);

/**
 * @swagger
 * /api/livros/{bookId}:
 *   patch:
 *     summary: Atualiza um livro (bibliotecário)
 *     description: Atualiza parcialmente os dados do título. Requer admId de bibliotecário.
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         description: ID do livro
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Dom Casmurro (2ª ed.)"
 *               author:
 *                 type: string
 *                 example: "Machado de Assis"
 *               ISBN:
 *                 type: string
 *                 example: "9788535910663"
 *               publisher:
 *                 type: string
 *                 example: "Companhia das Letras"
 *               category:
 *                 type: string
 *                 example: "Romance"
 *               year:
 *                 type: integer
 *                 example: 2016
 *               location:
 *                 type: string
 *                 example: "A1-01"
 *               quantity:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       '200':
 *         description: Livro atualizado
 *       '400':
 *         description: Dados inválidos
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Livro ou bibliotecário não encontrado
 */
router.patch('/:bookId', bookController.update);

/**
 * @swagger
 * /api/livros/{bookId}:
 *   delete:
 *     summary: Exclui um livro (bibliotecário)
 *     description: Remove um título do acervo. Bloqueado se houver empréstimo ativo.
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         description: ID do livro
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
 *       '204':
 *         description: Livro removido
 *       '400':
 *         description: Há empréstimo ativo
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Livro ou bibliotecário não encontrado
 */
router.delete('/:bookId', bookController.remove);

export default router;
