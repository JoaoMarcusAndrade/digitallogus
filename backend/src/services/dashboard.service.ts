/**
 * Serviço de Painel (Dashboards).
 *
 * Monta os dados dos dois painéis do protótipo:
 *  - `resumoBibliotecario`: painel do bibliotecário (acervo, usuários,
 *    circulation, títulos esgotados, categorias e notificações).
 *  - `resumoLeitor`: painel do leitor (meus empréstimos, exemplares
 *    disponíveis e avisos de atraso).
 *
 * Os números de status de empréstimo usam o status **efetivo**
 * (ver `statusEfetivoEmprestimo`), para que o painel reflita o atraso real
 * mesmo antes da execução do cron.
 */

import Book from "../models/Book.js";
import Emprestimo from "../models/Emprestimo.js";
import User from "../models/User.js";
import { statusEfetivoEmprestimo, toBookDTO, toLoanDTO } from "../dto/serializers.js";
import { httpError, requireLibrarian } from "../utils/auth.js";

/** Janela (em dias) do aviso "devolva em breve". */
const DIAS_VENCENDO_BREVE = 3;

function inicioDoDia(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(dias: number): Date {
  const d = inicioDoDia();
  d.setDate(d.getDate() + dias);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Acervo por categoria (títulos e exemplares), da maior para a menor. */
function agruparPorCategoria(books: any[]) {
  const mapa = new Map<string, { titles: number; copies: number; available: number }>();

  for (const b of books) {
    const categoria = (b.get("category") as string) || "Outros";
    const atual = mapa.get(categoria) ?? { titles: 0, copies: 0, available: 0 };
    atual.titles += 1;
    atual.copies += Number(b.get("quantity")) || 0;
    atual.available += Number(b.get("quantityAvailable")) || 0;
    mapa.set(categoria, atual);
  }

  return [...mapa.entries()]
    .map(([category, dados]) => ({ category, ...dados }))
    .sort((a, b) => b.copies - a.copies);
}

/** Empréstimos que vencem nos próximos dias (ainda em aberto). */
function vencendoEmBreve(loans: any[]) {
  const hoje = inicioDoDia();
  const limite = fimDoDia(DIAS_VENCENDO_BREVE);

  return loans.filter((l) => {
    if (l.get("status") === "devolvido" || l.get("dataDevolucao")) return false;
    const prevista = l.get("dataDevolucaoPrevista") as Date | null;
    if (!prevista) return false;
    return prevista >= hoje && prevista <= limite;
  });
}

/**
 * Resumo do painel do bibliotecário.
 */
export async function resumoBibliotecario(admId: number) {
  await requireLibrarian(admId);

  const [books, users, loans] = await Promise.all([
    Book.findAll(),
    User.findAll({ attributes: ["id", "name", "email", "userLevel", "status"] }),
    Emprestimo.findAll({
      include: [
        {
          model: Book,
          as: "livro",
          attributes: ["id", "title", "author", "ISBN", "publisher", "category", "year", "location", "quantity", "quantityAvailable", "coverColor"]
        },
        {
          model: User,
          as: "leitor",
          attributes: ["id", "name", "matricula", "email", "telefone", "userLevel", "status"]
        }
      ],
      order: [["dataEmprestimo", "DESC"]]
    })
  ]);

  const totalExemplares = books.reduce((s, b) => s + (Number(b.get("quantity")) || 0), 0);
  const totalDisponiveis = books.reduce((s, b) => s + (Number(b.get("quantityAvailable")) || 0), 0);
  const titulosEsgotados = books.filter((b) => (Number(b.get("quantityAvailable")) || 0) === 0);

  const usuariosAtivos = users.filter((u) => u.get("status") === "apto").length;

  const statusEfetivos = loans.map((l) => statusEfetivoEmprestimo(l));
  const emprestimosAtivos = statusEfetivos.filter((s) => s === "ativo").length;
  const emprestimosAtrasados = statusEfetivos.filter((s) => s === "atrasado").length;
  const emprestimosDevolvidos = statusEfetivos.filter((s) => s === "devolvido").length;

  const taxaOcupacao = totalExemplares
    ? Math.round(((totalExemplares - totalDisponiveis) / totalExemplares) * 100)
    : 0;
  const taxaDisponibilidade = totalExemplares
    ? Math.round((totalDisponiveis / totalExemplares) * 100)
    : 0;

  const atrasados = loans.filter((l) => statusEfetivoEmprestimo(l) === "atrasado");
  const breves = vencendoEmBreve(loans);

  return {
    stats: {
      titles: books.length,
      totalCopies: totalExemplares,
      totalAvailable: totalDisponiveis,
      occupancyRate: taxaOcupacao,
      availabilityRate: taxaDisponibilidade,
      outOfStock: titulosEsgotados.length,
      usersTotal: users.length,
      usersActive: usuariosAtivos,
      usersInactive: users.length - usuariosAtivos,
      loansActive: emprestimosAtivos,
      loansOverdue: emprestimosAtrasados,
      loansReturned: emprestimosDevolvidos,
      loansTotal: loans.length
    },
    recent: loans.slice(0, 6).map((l) => toLoanDTO(l)),
    outOfStockTitles: titulosEsgotados.slice(0, 4).map((b) => toBookDTO(b)),
    categories: agruparPorCategoria(books),
    badges: {
      collection: books.length,
      users: users.length,
      overdue: emprestimosAtrasados,
      mine: 0
    },
    notifications: {
      overdue: atrasados.slice(0, 5).map((l) => toLoanDTO(l)),
      dueSoon: breves.slice(0, 5).map((l) => toLoanDTO(l))
    }
  };
}

/**
 * Resumo do painel do leitor.
 */
export async function resumoLeitor(userId: number) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw httpError("Usuário não encontrado", 404);
  }

  const [books, loans, totalUsuarios] = await Promise.all([
    Book.findAll(),
    Emprestimo.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          as: "livro",
          attributes: ["id", "title", "author", "ISBN", "publisher", "category", "year", "location", "quantity", "quantityAvailable", "coverColor"]
        }
      ],
      order: [["dataEmprestimo", "DESC"]]
    }),
    User.count()
  ]);

  const totalExemplares = books.reduce((s, b) => s + (Number(b.get("quantity")) || 0), 0);
  const totalDisponiveis = books.reduce((s, b) => s + (Number(b.get("quantityAvailable")) || 0), 0);
  const pctDisponivel = totalExemplares ? Math.round((totalDisponiveis / totalExemplares) * 100) : 0;

  const statusEfetivos = loans.map((l) => statusEfetivoEmprestimo(l));
  const meusAtrasados = statusEfetivos.filter((s) => s === "atrasado").length;
  const meusNoPrazo = statusEfetivos.filter((s) => s === "ativo").length;
  const meusAbertos = meusNoPrazo + meusAtrasados;

  const atrasados = loans.filter((l) => statusEfetivoEmprestimo(l) === "atrasado");
  const breves = vencendoEmBreve(loans);

  const disponiveis = books
    .filter((b) => (Number(b.get("quantityAvailable")) || 0) > 0)
    .slice(0, 4);

  return {
    stats: {
      titles: books.length,
      totalCopies: totalExemplares,
      totalAvailable: totalDisponiveis,
      availableRate: pctDisponivel,
      myOpen: meusAbertos,
      myOnTime: meusNoPrazo,
      myOverdue: meusAtrasados,
      myTotal: loans.length
    },
    myLoans: loans.slice(0, 5).map((l) => toLoanDTO(l)),
    available: disponiveis.map((b) => toBookDTO(b)),
    badges: {
      collection: books.length,
      users: totalUsuarios,
      overdue: meusAtrasados,
      mine: meusAbertos
    },
    notifications: {
      overdue: atrasados.slice(0, 5).map((l) => toLoanDTO(l)),
      dueSoon: breves.slice(0, 5).map((l) => toLoanDTO(l))
    }
  };
}
