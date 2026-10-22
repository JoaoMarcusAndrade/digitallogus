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
 *     summary: Lista o acervo com busca, filtros e paginação
 *     description: Retorna os títulos cadastrados com busca textual, filtro por categoria, filtro por status (disponivel | emprestado | esgotado) e paginação no servidor. Acesso liberado para leitores (apenas visualização).
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         description: Termo de busca (título, autor, ISBN ou editora)
 *         schema:
 *           type: string
 *         example: "dom casmurro"
 *       - in: query
 *         name: category
 *         required: false
 *         description: Filtra por categoria
 *         schema:
 *           type: string
 *         example: "Romance"
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filtra pela disponibilidade dos exemplares
 *         schema:
 *           type: string
 *           enum: [disponivel, emprestado, esgotado]
 *         example: "disponivel"
 *       - in: query
 *         name: page
 *         required: false
 *         description: Página atual (padrão 1)
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: perPage
 *         required: false
 *         description: Itens por página (padrão 8)
 *         schema:
 *           type: integer
 *         example: 8
 *     responses:
 *       '200':
 *         description: Página de livros no envelope { items, total, page, perPage, pages }
 *       '500':
 *         description: Falha ao listar livros
 */
router.get('/', bookController.selectAll);

/**
 * @swagger
 * /api/livros/categorias:
 *   get:
 *     summary: Lista as categorias do acervo
 *     description: Retorna as categorias existentes no acervo com a contagem de títulos e exemplares. Usado no filtro do acervo e no painel.
 *     tags:
 *       - Livros
 *     responses:
 *       '200':
 *         description: Lista de categorias
 *       '500':
 *         description: Falha ao listar categorias
 */
router.get('/categorias', bookController.categories);

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
 *     description: Retorna o histórico do livro com os leitores e as datas de entrada (dataEmprestimo) e saída (dataDevolucao). Restrito ao bibliotecário (admId).
 *     tags:
 *       - Livros
 *     parameters:
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *           example: 1
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
