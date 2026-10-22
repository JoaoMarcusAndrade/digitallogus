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
 *               - cep
 *               - numero
 *               - email
 *               - pass
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               cep:
 *                 type: string
 *                 description: "CEP (8 dígitos). Obrigatório — o endereço é preenchido via ViaCEP."
 *                 example: "01310200"
 *               numero:
 *                 type: string
 *                 description: "Número do endereço. Obrigatório."
 *                 example: "250"
 *               complemento:
 *                 type: string
 *                 example: "Apto 41"
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
 *         description: Usuário cadastrado com sucesso (matrícula gerada automaticamente).
 *       '400':
 *         description: Dados inválidos ou e-mail já cadastrado.
 *       '404':
 *         description: CEP não encontrado.
 */
router.post("/register", leitorController.create);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login do usuário
 *     description: Autentica o usuário validando o e-mail e a senha.
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
 *                 description: E-mail cadastrado (é o login do sistema).
 *                 example: "admin@biblio.com"
 *               user:
 *                 type: string
 *                 description: Alias legado de `email`.
 *                 example: "admin@biblio.com"
 *               pass:
 *                 type: string
 *                 example: "minhaSenh4!"
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso. Retorna os dados do usuário.
 *       '401':
 *         description: E-mail ou senha inválidos.
 */
router.post("/login", leitorController.login);

// --- Rotas de Gerenciamento de Usuários ---

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista os usuários (bibliotecário)
 *     description: Retorna os usuários cadastrados com busca, filtros e paginação no servidor. Acesso restrito ao bibliotecário (admId).
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: query
 *         name: admId
 *         required: true
 *         description: ID do usuário bibliotecário
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: q
 *         required: false
 *         description: Termo de busca (nome, e-mail, usuário ou matrícula)
 *         schema:
 *           type: string
 *         example: "david"
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filtra por status do usuário
 *         schema:
 *           type: string
 *           enum: [ativo, inativo]
 *         example: "ativo"
 *       - in: query
 *         name: tipo
 *         required: false
 *         description: Filtra por perfil de acesso
 *         schema:
 *           type: string
 *           enum: [leitor, bibliotecario]
 *         example: "leitor"
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
 *         description: Página de usuários no envelope { items, total, page, perPage, pages }
 *       '400':
 *         description: admId inválido
 *       '403':
 *         description: Acesso negado
 */
router.get('/', leitorController.selectAll);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Cadastra um usuário (bibliotecário)
 *     description: Cria um usuário com perfil de acesso ("leitor" | "bibliotecario"). Sem o campo "pass", a conta recebe uma senha provisória, retornada na resposta.
 *     tags:
 *       - Usuários
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
 *               - name
 *               - email
 *               - cep
 *               - numero
 *             properties:
 *               name:
 *                 type: string
 *                 example: "David Souza"
 *               cep:
 *                 type: string
 *                 description: "CEP (8 dígitos). Obrigatório — o endereço é preenchido via ViaCEP."
 *                 example: "01310200"
 *               numero:
 *                 type: string
 *                 description: "Número do endereço. Obrigatório."
 *                 example: "250"
 *               complemento:
 *                 type: string
 *                 example: "Apto 41"
 *               email:
 *                 type: string
 *                 example: "david.souza@email.com"
 *               matricula:
 *                 type: string
 *                 example: "2023001201"
 *               telefone:
 *                 type: string
 *                 example: "11987654321"
 *               CEP:
 *                 type: string
 *                 example: "01310200"
 *               pass:
 *                 type: string
 *                 description: Senha inicial (omitir para gerar senha provisória)
 *                 example: "minhaSenh4!"
 *               userLevel:
 *                 type: string
 *                 enum: [leitor, bibliotecario]
 *                 example: "leitor"
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo]
 *                 example: "ativo"
 *     responses:
 *       '201':
 *         description: Usuário criado (quando a senha não foi informada, ela é enviada por e-mail)
 *       '400':
 *         description: Dados inválidos ou e-mail/matrícula já cadastrado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Administrador não encontrado
 */
router.post('/', leitorController.createAsLibrarian);

/**
 * @swagger
 * /api/users/cep/{cep}:
 *   get:
 *     summary: Consulta o endereço a partir do CEP
 *     description: Usa a API pública ViaCEP para devolver rua, bairro, cidade, estado e o CEP normalizado.
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         description: CEP (8 dígitos, com ou sem hífen)
 *         schema:
 *           type: string
 *           example: "01310100"
 *     responses:
 *       '200':
 *         description: Endereço encontrado
 *       '400':
 *         description: CEP inválido
 *       '404':
 *         description: CEP não encontrado
 */
router.get('/cep/:cep', leitorController.buscarCep);

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
 *               userLevel:
 *                 type: string
 *                 enum: [leitor, bibliotecario]
 *                 description: Promove ou rebaixa o nível do usuário (bibliotecário pode conceder acesso administrativo).
 *                 example: "bibliotecario"
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