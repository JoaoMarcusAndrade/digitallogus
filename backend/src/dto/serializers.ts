/**
 * Camada de serialização (DTO) — formato único de resposta da API.
 *
 * A API fala o vocabulário do banco (inglês: `title`, `name`, `userLevel`),
 * com uma única exceção: o status do usuário é exposto como `ativo`/`inativo`
 * (vocabulário usado pelo front), enquanto no banco ele é `apto`/`inapto`.
 *
 * Toda rota que devolve entidades deve usar estas funções, para que o shape
 * da resposta não divirja entre endpoints.
 */

import Book from "../models/Book.js";
import History from "../models/History.js";
import User from "../models/User.js";

export type StatusUsuario = "ativo" | "inativo";
export type StatusBanco = "apto" | "inapto";
/** Status do empréstimo no banco (ENUM do model History). */
export type StatusEmprestimoBanco = "ativo" | "atrasado" | "devolvido";
/** Status do empréstimo exposto pela API. */
export type StatusEmprestimo = "active" | "overdue" | "returned";

type Entidade = { toJSON?: () => Record<string, any> } & Record<string, any>;

function paraObjeto(entidade: Entidade | null | undefined): Record<string, any> | null {
  if (!entidade) return null;
  return typeof entidade.toJSON === "function" ? entidade.toJSON() : { ...entidade };
}

/** Converte o status do banco (`apto`/`inapto`) para o da API (`ativo`/`inativo`). */
export function statusParaApi(status: string | null | undefined): StatusUsuario {
  return status === "inapto" ? "inativo" : "ativo";
}

/** Converte o status da API (`ativo`/`inativo`) para o do banco (`apto`/`inapto`). */
export function statusParaBanco(status: string | null | undefined): StatusBanco {
  return status === "inativo" || status === "inapto" ? "inapto" : "apto";
}

/**
 * Status efetivo do empréstimo, calculado na leitura.
 * O cron (`markOverdue`) grava o atraso no banco, mas a API precisa refletir
 * o atraso real mesmo antes da próxima execução do cron.
 */
export function statusEfetivoEmprestimo(emprestimo: Entidade | null | undefined): StatusEmprestimoBanco {
  const e = paraObjeto(emprestimo);
  if (!e) return "ativo";
  if (e.status === "devolvido" || e.dataDevolucao) return "devolvido";

  const prevista = e.dataDevolucaoPrevista ? new Date(e.dataDevolucaoPrevista) : null;
  if (!prevista || isNaN(prevista.getTime())) return e.status === "atrasado" ? "atrasado" : "ativo";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  prevista.setHours(0, 0, 0, 0);

  return prevista.getTime() < hoje.getTime() ? "atrasado" : "ativo";
}

/**
 * Converte o status do empréstimo (banco: ativo/atrasado/devolvido) para o
 * vocabulário da API (`active`/`overdue`/`returned`).
 */
export function statusEmprestimoParaApi(status: string): StatusEmprestimo {
  if (status === "devolvido") return "returned";
  if (status === "atrasado") return "overdue";
  return "active";
}

import Endereco from "../models/Endereco.js";

/** Títulos/honrificos ignorados ao extrair o primeiro nome. */
const HONORIFICOS = ["prof", "prof.", "dr", "dr.", "dra", "sr", "sra", "srta", "miss", "mr", "mrs", "ms"];

/**
 * Primeiro nome do usuário, sem honoríficos.
 * "Prof. Rita Almeida" → "Rita" · "Matheus G." → "Matheus"
 * Usado na visão do leitor (onde a pessoa é referida só pelo primeiro nome).
 */
export function primeiroNome(nome: string | null | undefined): string {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  while (partes.length && HONORIFICOS.includes(partes[0].toLowerCase())) {
    partes.shift();
  }
  return partes[0] || "";
}

/** DTO de usuário (sem `pass_hash`). */
export function toUserDTO(usuario: Entidade | null | undefined): Record<string, any> | null {
  const u = paraObjeto(usuario);
  if (!u) return null;

  const enderecoRaw = u.endereco ?? null;
  const endereco = enderecoRaw ? paraObjeto(enderecoRaw) : null;

  return {
    id: u.id,
    name: u.name,
    /** Primeiro nome — como o leitor é tratado nas telas de leitor. */
    firstName: primeiroNome(u.name),
    matricula: u.matricula ?? null,
    email: u.email,
    telefone: u.telefone ?? "",
    CEP: endereco?.cep || u.CEP || null,
    userLevel: u.userLevel,
    status: statusParaApi(u.status),
    endereco: endereco ? {
      id: endereco.id,
      rua: endereco.rua,
      numero: endereco.numero,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      cep: endereco.cep,
      complemento: endereco.complemento ?? null
    } : null,
    createdAt: u.createdAt ?? null,
    updatedAt: u.updatedAt ?? null
  };
}

/** DTO de livro. */
export function toBookDTO(livro: Entidade | null | undefined): Record<string, any> | null {
  const l = paraObjeto(livro);
  if (!l) return null;

  return {
    id: l.id,
    title: l.title,
    author: l.author,
    ISBN: l.ISBN,
    publisher: l.publisher ?? "",
    category: l.category ?? "Outros",
    year: l.year ?? null,
    location: l.location ?? "",
    quantity: l.quantity,
    quantityAvailable: l.quantityAvailable,
    coverColor: l.coverColor ?? null,
    createdAt: l.createdAt ?? null,
    updatedAt: l.updatedAt ?? null
  };
}

/** DTO de empréstimo, com o livro e o leitor aninhados (quando carregados). */
export function toLoanDTO(emprestimo: Entidade | null | undefined): Record<string, any> | null {
  const e = paraObjeto(emprestimo);
  if (!e) return null;

  return {
    id: e.id,
    bookId: e.bookId,
    userId: e.userId,
    dataEmprestimo: e.dataEmprestimo ?? null,
    dataDevolucaoPrevista: e.dataDevolucaoPrevista ?? null,
    dataDevolucao: e.dataDevolucao ?? null,
    renovacoes: e.renovacoes ?? 0,
    status: statusEmprestimoParaApi(statusEfetivoEmprestimo(e)),
    book: toBookDTO(e.livro ?? null),
    reader: toUserDTO(e.leitor ?? null)
  };
}

import Emprestimo from "../models/Emprestimo.js";

/** Atalho para tipar as entidades do Sequelize nos serviços. */
export type UsuarioModel = User;
export type LivroModel = Book;
export type EmprestimoModel = Emprestimo;
