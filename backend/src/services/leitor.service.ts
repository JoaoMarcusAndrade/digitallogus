import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

function sanitizeUser(user: User) {
    const json = user.toJSON();
    // Destruturação limpa para remover o pass_hash sem violar as regras estritas do TS
    const { pass_hash, ...userWithoutPass } = json as any; 
    return userWithoutPass;
}

interface CreateUserDTO {
    name: string;
    CEP: string;
    telephone: string;
    email: string;
    pass: string;
}

interface UpdateUserDTO {
    name?: string;
    CEP?: string;
    telephone?: string;
    email?: string;
    pass?: string;
}

export async function createUser(data: CreateUserDTO) {
    const existingUser = await User.findOne({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error("Já existe um usuário com este email.");
    }

    const pass_hash = await bcrypt.hash(data.pass, SALT_ROUNDS);

    // ✅ CORRIGIDO: Mapeamento explícito de 'telephone' para 'telefone'
    const user = await User.create({
        name: data.name,
        CEP: data.CEP,
        telefone: data.telephone, // Ajustado para bater com o Model
        email: data.email,
        userLevel: 'leitor',
        pass_hash,
        status: 'apto'
    });

    return sanitizeUser(user);
}

export async function loginUser(email: string, pass: string) {
    const user = await User.findOne({
        where: { email }
    });

    if (!user) {
        throw new Error("Email ou senha inválidos.");
    }

    const valid = await bcrypt.compare(pass, user.get("pass_hash") as string);

    if (!valid) {
        throw new Error("Email ou senha inválidos.");
    }

    // ✅ CORRIGIDO: Evita que o TS reclame do token_version caso ele não esteja mapeado no Model
    const userData = user.toJSON() as any;

    const token = jwt.sign(
        {
            userId: userData.id,
            tv: userData.token_version || 1 // Fallback caso você decida usar controle de versões de token no futuro
        },
        JWT_SECRET!,
        { expiresIn: "7d" }
    );

    return {
        user: {
            id: userData.id,
            name: userData.name,
            email: userData.email
        },
        token
    };
}

export async function getAllUsers() {
    try {
        const users = await User.findAll();
        return users.map(sanitizeUser);
    } catch (error: any) {
        throw new Error(`Falha ao buscar: ${error.message}`);
    }
}

export async function getUser(userId: number) {
    try {
        const existingUser = await User.findByPk(userId);

        if (!existingUser) {
            throw new Error("Usuário não encontrado");
        }
        return sanitizeUser(existingUser);
    } catch (error: any) {
        throw new Error(`Falha ao buscar: ${error.message}`);
    }
}

export async function editUser(userId: number, admId: number, userParams: UpdateUserDTO) {
    try {
        const adm = await User.findByPk(admId);

        if (!adm) {
            throw new Error("Administrador não encontrado");
        }

        if (adm.userLevel !== 'bibliotecario') {
            throw new Error("Acesso negado: Apenas bibliotecários podem editar usuários");
        }

        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        const updateData: Record<string, any> = {};

        if (userParams.name !== undefined) updateData.name = userParams.name;
        if (userParams.CEP !== undefined) updateData.CEP = userParams.CEP;
        if (userParams.email !== undefined) updateData.email = userParams.email;
        if (userParams.telephone !== undefined) updateData.telefone = userParams.telephone;

        if (userParams.pass) {
            updateData.pass_hash = await bcrypt.hash(userParams.pass, SALT_ROUNDS);
        }

        await user.update(updateData);

        return sanitizeUser(user);
    } catch (error: any) {
        throw new Error(`Falha ao editar usuário: ${error.message}`);
    }
}

export async function delUser(admId: number, userId: number) {
    try {
        const adm = await User.findByPk(admId);

        if (!adm) {
            throw new Error("Administrador não encontrado");
        }

        if (adm.userLevel !== 'bibliotecario') {
            throw new Error("Acesso negado: Apenas bibliotecários podem excluir usuários");
        }
        
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        await user.destroy();
    } catch (error: any) {
        throw new Error(`Falha ao deletar usuário: ${error.message}`);
    }
}