import { Request, Response } from "express";
import {
    createUser,
    loginUser,
    getAllUsers,
    getUser,
    editUser,
    delUser
} from "../services/leitor.service.js";

export const leitorController = {

    async create(req: Request, res: Response): Promise<Response> {
        try {
            const user = await createUser(req.body);
            return res.status(201).json(user);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    },

    async login(req: Request, res: Response): Promise<Response> {
        const { email, pass } = req.body;

        if (!email || !pass) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        try {
            const result = await loginUser(email, pass);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    },

    async selectAll(req: Request, res: Response): Promise<Response> {
        try {
            const users = await getAllUsers();
            return res.status(200).json(users);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
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