import { Request, Response } from "express";
import {
    createUser,
    loginUser,
    getAllUsers,
    getUser,
    editUser,
    delUser
} from "../services/leitor.service.js";
import { requireLibrarian } from "../utils/auth.js";
import { buscarEnderecoPorCep } from "../utils/viacep.js";

/**
 * Tratamento central de erro: respeita o statusCode definido nos serviços.
 */
function handleError(res: Response, error: any) {
    const status = error?.statusCode || 400;
    return res.status(status).json({ error: error.message });
}

export const leitorController = {

    async create(req: Request, res: Response): Promise<Response> {
        try {
            const user = await createUser(req.body);
            return res.status(201).json(user);
        } catch (error: any) {
            return handleError(res, error);
        }
    },

    /**
     * POST /api/leitor?admId= — cria um usuário (bibliotecário).
     * Aceita `userLevel` ("leitor" | "bibliotecario") e `status` ("ativo" | "inativo").
     * Sem `pass` no corpo, a conta recebe uma senha provisória enviada por e-mail.
     */
    async createAsLibrarian(req: Request, res: Response): Promise<Response> {
        const admId = Number(req.query.admId);

        if (isNaN(admId)) {
            return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
        }

        try {
            // A autorização é validada antes de criar (nível elevado exige bibliotecário).
            await requireLibrarian(admId);
            const user = await createUser(req.body, { permitirNivelElevado: true });
            return res.status(201).json(user);
        } catch (error: any) {
            return handleError(res, error);
        }
    },

    async login(req: Request, res: Response): Promise<Response> {
        // Login por e-mail ("user" é aceito como alias legado).
        const { user, email, pass } = req.body;
        const identificador = email || user;

        if (!identificador || !pass) {
            return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
        }

        try {
            const result = await loginUser(identificador, pass);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    },

    /** GET /api/leitor?admId= — lista usuários (bibliotecário) com filtros e paginação */
    async selectAll(req: Request, res: Response): Promise<Response> {
        const admId = Number(req.query.admId);

        if (isNaN(admId)) {
            return res.status(400).json({ error: "O parâmetro admId é obrigatório e deve ser um número válido." });
        }

        try {
            const { q, status, tipo, page, perPage } = req.query as Record<string, any>;
            const users = await getAllUsers(admId, { q, status, tipo, page, perPage });
            return res.status(200).json(users);
        } catch (error: any) {
            return handleError(res, error);
        }
    },

    async select(req: Request, res: Response): Promise<Response> {
        const { userId } = req.params;
        const userIdNum = Number(userId);

        if (isNaN(userIdNum)) {
            return res.status(400).json({ error: "O ID do usuário fornecido é inválido." });
        }

        try {
            const user = await getUser(userIdNum);
            return res.status(200).json(user);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    },

    /**
     * GET /api/leitor/cep/:cep — consulta o endereço completo a partir do CEP.
     */
    async buscarCep(req: Request, res: Response): Promise<Response> {
        const cep = String(req.params.cep || "");

        try {
            const endereco = await buscarEnderecoPorCep(cep);
            return res.status(200).json(endereco);
        } catch (error: any) {
            return handleError(res, error);
        }
    },

    async edit(req: Request, res: Response): Promise<Response> {
        const { userId } = req.params;
        const { admId } = req.query;
        const userIdNum = Number(userId);
        const admIdNum = Number(admId);

        if (isNaN(userIdNum) || isNaN(admIdNum)) {
            return res.status(400).json({ error: "Os parâmetros userId e admId devem ser números válidos." });
        }

        try {
            const user = await editUser(userIdNum, admIdNum, req.body);
            return res.status(200).json(user);
        } catch (error: any) {
            // ✅ Mapeamento de erros para bater com as respostas corretas do Swagger HTTP
            if (error.message.includes("Acesso negado")) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes("não encontrado")) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    },

    async deleteAcount(req: Request, res: Response): Promise<Response> {
        const { userId } = req.params;
        const { admId } = req.query;
        const userIdNum = Number(userId);
        const admIdNum = Number(admId);

        if (isNaN(userIdNum) || isNaN(admIdNum)) {
            return res.status(400).json({ error: "Os parâmetros userId e admId devem ser números válidos." });
        }

        try {
            await delUser(admIdNum, userIdNum);
            return res.status(204).send();
        } catch (error: any) {
            if (error.message.includes("Acesso negado")) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes("não encontrado")) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    },
};