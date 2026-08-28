import { Router } from "express";
import { leitorController } from "../controllers/leitor.controller.js";

const router = Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Cadastrar um novo usuário
 *     description: Cria um novo usuário leitor no sistema. O e-mail deve ser único. A senha será criptografada automaticamente.
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - CEP
 *               - telephone
 *               - email
 *               - pass
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               CEP:
 *                 type: string
 *                 example: "01310-200"
 *               telephone:
 *                 type: string
 *                 example: "11999998888"
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               pass:
 *                 type: string
 *                 example: "minhaSenh4!"
 *     responses:
 *       '201':
 *         description: Usuário cadastrado com sucesso.
 *       '400':
 *         description: Dados inválidos ou e-mail já cadastrado.
 */
router.post("/register", leitorController.create);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login do usuário
 *     description: Autentica o usuário e retorna um JWT para a sessão.
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pass
 *             properties:
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               pass:
 *                 type: string
 *                 example: "minhaSenh4!"
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso. Retorna o token JWT.
 *       '401':
 *         description: Email ou senha inválidos.
 */
router.post("/login", leitorController.login);

// --- Rotas de Gerenciamento de Usuários ---

router.get('/', leitorController.selectAll);

router.get('/:userId', leitorController.select);

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Atualizar informações do usuário
 *     description: Atualiza parcialmente os dados do usuário. Requer a validação do ID de um usuário com nível 'bibliotecario' via Query string.
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID do usuário que será atualizado
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário que está realizando a ação
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
 *               name:
 *                 type: string
 *                 example: "João Silva Sauro"
 *               CEP:
 *                 type: string
 *                 example: "01310-900"
 *               telephone:
 *                 type: string
 *                 example: "11988887777"
 *               email:
 *                 type: string
 *                 example: "novo_email@email.com"
 *               pass:
 *                 type: string
 *                 description: Nova senha (será criptografada automaticamente).
 *                 example: "novaSenh4!"
 *     responses:
 *       '200':
 *         description: Usuário atualizado com sucesso.
 *       '403':
 *         description: Acesso negado. O admId informado não pertence a um bibliotecário.
 *       '404':
 *         description: Administrador ou usuário a ser editado não foi encontrado.
 */
router.patch('/:userId', leitorController.edit);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Remover usuário
 *     description: Exclui permanentemente um usuário do sistema. Requer a validação do ID de um usuário com nível 'bibliotecario' via Query string.
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID do usuário que será deletado do sistema
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário administrador/bibliotecário que está realizando a ação
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '204':
 *         description: Usuário removido com sucesso.
 *       '403':
 *         description: Acesso negado. O admId informado não pertence a um bibliotecário.
 *       '404':
 *         description: Administrador ou usuário a ser deletado não foi encontrado.
 *       '500':
 *         description: Falha ao deletar usuário.
 */
router.delete('/:userId', leitorController.deleteAcount);

export default router;