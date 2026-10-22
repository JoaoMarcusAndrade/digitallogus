import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Op, Transaction } from "sequelize";
import User from "../models/User.js";
import Endereco from "../models/Endereco.js";
import { statusParaBanco, toUserDTO } from "../dto/serializers.js";
import { requireLibrarian } from "../utils/auth.js";
import { contem, lerPaginacao, montarPagina, termoBusca } from "../utils/pagination.js";
import { buscarEnderecoPorCep } from "../utils/viacep.js";
import { sendSenhaProvisoria } from "./notify.service.js";
import sequelize from "../database/index.js";

const SALT_ROUNDS = 10;

/* ============================================================
   Normalizadores — o front envia dados no formato "humano"
   (telefone com parênteses, CEP com traço).
   O banco guarda tudo em formato canônico.
   ============================================================ */

/** "(11) 98765-4321" → "11987654321" */
export function normalizarTelefone(valor?: string | null): string {
    if (!valor) return "";
    return String(valor).replace(/\D/g, "");
}

/** "01310-200" → "01310200" (o model aceita 8 dígitos ou 00000-000) */
export function normalizarCEP(valor?: string | null): string {
    if (!valor) return "";
    const digitos = String(valor).replace(/\D/g, "");
    if (digitos.length !== 8) return String(valor).trim();
    return digitos;
}

/** Gera uma senha provisória para contas criadas pelo bibliotecário. */
export function gerarSenhaProvisoria(): string {
    return randomBytes(4).toString("hex");
}

interface CreateUserDTO {
    name: string;
    email: string;
    matricula?: string;
    telefone?: string;
    telephone?: string; // alias legado (Swagger antigo)
    CEP?: string;
    pass?: string;
    userLevel?: 'leitor' | 'bibliotecario';
    status?: 'ativo' | 'inativo';
}

interface UpdateUserDTO {
    name?: string;
    matricula?: string;
    CEP?: string;
    telefone?: string;
    telephone?: string;
    email?: string;
    pass?: string;
    userLevel?: 'leitor' | 'bibliotecario';
    status?: 'ativo' | 'inativo';
}

interface OpcoesCreate {
    /** Permite gravar `userLevel`/`status` (uso restrito ao bibliotecário). */
    permitirNivelElevado?: boolean;
}

/**
 * Verifica se um valor já pertence a outro usuário (email ou matrícula).
 * `ignorarId` permite desconsiderar o próprio usuário na hora de editar.
 */
async function valorEmUso(campo: "email" | "matricula", valor: string, ignorarId?: number) {
    const where: Record<string, any> = { [campo]: valor };
    if (ignorarId) where.id = { [Op.ne]: ignorarId };

    const existente = await User.findOne({ where });
    return !!existente;
}

export async function createUser(data: CreateUserDTO, opcoes: OpcoesCreate = {}) {
    if (!data?.name || !data?.email) {
        throw new Error("Nome e e-mail são obrigatórios.");
    }

    const cepBruto = (data as any).cep || (data as any).CEP;
    const numero = (data as any).numero || (data as any).number;
    if (!cepBruto) {
        throw new Error("CEP é obrigatório.");
    }
    if (!numero || !String(numero).trim()) {
        throw new Error("Número é obrigatório.");
    }

    const email = String(data.email).trim().toLowerCase();
    const telefone = normalizarTelefone(data.telefone ?? data.telephone);
    const cepNormalizado = normalizarCEP(cepBruto);
    const complemento = (data as any).complemento || (data as any).complement || null;

    if (await valorEmUso("email", email)) {
        throw new Error("Já existe um usuário com este email.");
    }

    // Sem senha informada: conta criada pelo bibliotecário recebe senha provisória.
    const senhaProvisoria = data.pass ? null : gerarSenhaProvisoria();
    const senha = data.pass || (senhaProvisoria as string);
    const pass_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const enderecoViaCep = await buscarEnderecoPorCep(cepNormalizado);

    const t = await sequelize.transaction();
    try {
        const matricula = await gerarMatriculaGlobal();
        const user = await User.create({
            name: String(data.name).trim(),
            matricula,
            CEP: enderecoViaCep.cep,
            telefone,
            email,
            userLevel: opcoes.permitirNivelElevado && data.userLevel ? data.userLevel : 'leitor',
            status: statusParaBanco(opcoes.permitirNivelElevado ? data.status : undefined),
            pass_hash
        }, { transaction: t });

        await Endereco.create({
            userID: user.id,
            rua: enderecoViaCep.rua,
            numero: String(numero).trim(),
            bairro: enderecoViaCep.bairro,
            cidade: enderecoViaCep.cidade,
            estado: enderecoViaCep.estado,
            cep: enderecoViaCep.cep,
            complemento: complemento ? String(complemento).trim() : null
        }, { transaction: t });

        await t.commit();
        const userComEndereco = await User.findByPk(user.id, { include: [{ model: Endereco, as: 'endereco' }] });

        // A senha provisória só chega por e-mail — ela não volta na resposta da API.
        if (senhaProvisoria) {
            try {
                await sendSenhaProvisoria(
                    { name: user.get("name"), email: user.get("email") },
                    senhaProvisoria
                );
            } catch (erro: any) {
                console.error(`[notify] Falha ao enviar a senha provisória para ${email}: ${erro.message}`);
            }
        }

        return toUserDTO(userComEndereco);
    } catch (error: any) {
        await t.rollback();
        throw error;
    }
}

/**
 * Login por e-mail (o login do sistema).
 * @param identifier e-mail digitado na tela de login
 */
export async function loginUser(identifier: string, pass: string) {
    if (!identifier || !pass) {
        throw new Error("E-mail e senha são obrigatórios.");
    }

    const email = String(identifier).trim().toLowerCase();

    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new Error("E-mail ou senha inválidos.");
    }

    const valid = await bcrypt.compare(pass, user.get("pass_hash") as string);

    if (!valid) {
        throw new Error("E-mail ou senha inválidos.");
    }

    return toUserDTO(user);
}

/**
 * Normaliza o filtro de "Tipo" (perfil de acesso).
 * Aceita o vocabulário da API (`leitor` | `bibliotecario`) e os rótulos do
 * front (`Administrador` | `Leitor`).
 */
export function normalizarTipo(tipo?: string | null): 'leitor' | 'bibliotecario' | null {
    const t = String(tipo ?? "").trim().toLowerCase();
    if (!t) return null;
    if (t === "leitor" || t === "reader") return "leitor";
    if (["bibliotecario", "administrador", "adm", "admin", "biblio"].includes(t)) return "bibliotecario";
    return null;
}

/**
 * Normaliza o filtro de status do usuário.
 * Aceita `ativo` | `inativo` (API) e `apto` | `inapto` (banco).
 */
function normalizarStatusFiltro(status?: string | null): 'apto' | 'inapto' | null {
    const s = String(status ?? "").trim().toLowerCase();
    if (!s) return null;
    if (s === "ativo" || s === "apto") return "apto";
    if (s === "inativo" || s === "inapto") return "inapto";
    return null;
}

interface FiltrosUsuarios {
    q?: string;
    status?: string;
    tipo?: string;
    page?: number;
    perPage?: number;
}

/**
 * Lista os usuários com busca, filtros e paginação no servidor.
 * Restrito ao bibliotecário (`admId`) — o leitor não tem acesso à lista de usuários.
 * Retorna o envelope `{ items, total, page, perPage, pages }`.
 */
export async function getAllUsers(admId: number, filtros: FiltrosUsuarios = {}) {
    try {
        await requireLibrarian(admId);

        const pagina = lerPaginacao(filtros);
        // `any` para permitir as chaves simbólicas do Sequelize (Op.or).
        const where: any = {};

        const termo = termoBusca(filtros.q);
        if (termo) {
            where[Op.or] = [
                { name: contem(termo) },
                { email: contem(termo) },
                { matricula: contem(termo) }
            ];
        }

        const status = normalizarStatusFiltro(filtros.status);
        if (status) where.status = status;

        const tipo = normalizarTipo(filtros.tipo);
        if (tipo) where.userLevel = tipo;

        const [total, users] = await Promise.all([
            User.count({ where }),
            User.findAll({
                where,
                include: [{ model: Endereco, as: 'endereco' }],
                limit: pagina.limit,
                offset: pagina.offset,
                order: [["name", "ASC"]]
            })
        ]);

        return montarPagina(users.map((u) => toUserDTO(u)), total, pagina);
    } catch (error: any) {
        // Preserva o statusCode (403/404) das falhas de autorização.
        const erro: any = new Error(error.statusCode ? error.message : `Falha ao buscar: ${error.message}`);
        erro.statusCode = error.statusCode;
        throw erro;
    }
}

export async function getUser(userId: number) {
    try {
        const existingUser = await User.findByPk(userId, {
            include: [{ model: Endereco, as: 'endereco' }]
        });

        if (!existingUser) {
            throw new Error("Usuário não encontrado");
        }
        return toUserDTO(existingUser);
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

        if (userParams.name !== undefined) updateData.name = String(userParams.name).trim();
        if (userParams.email !== undefined) updateData.email = String(userParams.email).trim().toLowerCase();
        if (userParams.telefone !== undefined || userParams.telephone !== undefined) {
            updateData.telefone = normalizarTelefone(userParams.telefone ?? userParams.telephone);
        }
        if ((userParams as any).CEP !== undefined || (userParams as any).cep !== undefined) {
            updateData.CEP = normalizarCEP((userParams as any).cep ?? (userParams as any).CEP);
        }

        if (userParams.pass) {
            updateData.pass_hash = await bcrypt.hash(userParams.pass, SALT_ROUNDS);
        }

        // Promoção de nível — valida o valor enviado para não aceitar níveis desconhecidos
        if (userParams.userLevel !== undefined) {
            if (userParams.userLevel !== 'leitor' && userParams.userLevel !== 'bibliotecario') {
                throw new Error("Nível inválido: use 'leitor' ou 'bibliotecario'.");
            }
            updateData.userLevel = userParams.userLevel;
        }

        // Status vindo do front: 'ativo' | 'inativo' (no banco: 'apto' | 'inapto')
        if (userParams.status !== undefined) {
            updateData.status = statusParaBanco(userParams.status);
        }

        await user.update(updateData);

        const cepBrutoEdit = (userParams as any).cep || (userParams as any).CEP;
        if (cepBrutoEdit) {
            const enderecoViaCep = await buscarEnderecoPorCep(normalizarCEP(cepBrutoEdit));
            const enderecoExistente = await Endereco.findOne({ where: { userID: userId } });
            const numeroEdit = (userParams as any).numero || (userParams as any).number;
            const complementoEdit = (userParams as any).complemento || (userParams as any).complement;
            if (enderecoExistente) {
                await enderecoExistente.update({
                    rua: enderecoViaCep.rua,
                    bairro: enderecoViaCep.bairro,
                    cidade: enderecoViaCep.cidade,
                    estado: enderecoViaCep.estado,
                    cep: enderecoViaCep.cep,
                    numero: numeroEdit !== undefined ? String(numeroEdit).trim() : enderecoExistente.numero,
                    complemento: complementoEdit !== undefined ? (complementoEdit ? String(complementoEdit).trim() : null) : enderecoExistente.complemento
                });
            } else {
                await Endereco.create({
                    userID: userId,
                    rua: enderecoViaCep.rua,
                    numero: numeroEdit ? String(numeroEdit).trim() : "",
                    bairro: enderecoViaCep.bairro,
                    cidade: enderecoViaCep.cidade,
                    estado: enderecoViaCep.estado,
                    cep: enderecoViaCep.cep,
                    complemento: complementoEdit ? String(complementoEdit).trim() : null
                });
            }
        } else {
            const numeroEdit = (userParams as any).numero || (userParams as any).number;
            const complementoEdit = (userParams as any).complemento || (userParams as any).complement;
            if (numeroEdit !== undefined || complementoEdit !== undefined) {
                const enderecoExistente = await Endereco.findOne({ where: { userID: userId } });
                if (enderecoExistente) {
                    const upd: any = {};
                    if (numeroEdit !== undefined) upd.numero = String(numeroEdit).trim();
                    if (complementoEdit !== undefined) upd.complemento = complementoEdit ? String(complementoEdit).trim() : null;
                    if (Object.keys(upd).length) await enderecoExistente.update(upd);
                }
            }
        }

        const userAtualizado = await User.findByPk(userId, { include: [{ model: Endereco, as: 'endereco' }] });
        return toUserDTO(userAtualizado);
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

/**
 * Matrícula automática no padrão AAAA + NNNN (ex.: 20260087).
 * O índice é global por ano, considerando todos os tipos de usuário.
 */
export async function gerarMatriculaGlobal(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = String(ano);

    const [registros] = await sequelize.query(
        "SELECT COUNT(*) as total FROM Users WHERE matricula LIKE ?",
        { replacements: [`${prefixo}%`] }
    ) as [any[], unknown];

    const total = Number((registros[0] as any)?.total || 0) + 1;
    let matricula = `${prefixo}${String(total).padStart(4, '0')}`;
    let candidato = total + 1;

    while (await valorEmUso("matricula", matricula)) {
        matricula = `${prefixo}${String(candidato).padStart(4, '0')}`;
        candidato += 1;
    }

    return matricula;
}
