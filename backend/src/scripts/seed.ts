/**
 * Script de Seed — popula o banco com o conjunto de demonstração do Alexandria.
 *
 * Uso:
 *   npm run seed -w backend              # cria apenas o que falta (idempotente)
 *   npm run seed -w backend -- --reset   # apaga tudo e recria o conjunto de demo
 *
 * Contas criadas:
 *   - bibliotecário: admin / admin123    (Matheus G.)
 *   - leitores:      david / leitor123    (e demais usuários de demonstração)
 *
 * As senhas podem ser trocadas pelas variáveis de ambiente
 * `SEED_ADMIN_PASS` e `SEED_LEITOR_PASS`.
 */

import "../env.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import sequelize from "../database/index.js";
import { runMigrations } from "../database/migrate.js";
import "../models/index.js";
import Book from "../models/Book.js";
import History from "../models/History.js";
import Emprestimo from "../models/Emprestimo.js";
import Endereco from "../models/Endereco.js";
import User from "../models/User.js";
import { gerarMatriculaGlobal } from "../services/leitor.service.js";

const RESET = process.argv.includes("--reset");
const PASS_ADMIN = process.env.SEED_ADMIN_PASS || "admin123";
const PASS_LEITOR = process.env.SEED_LEITOR_PASS || "leitor123";

/* ============================================================
   Dados de demonstração
   ============================================================ */

/** Acervo do protótipo (quantidade = exemplares; disponíveis = total − empréstimos abertos). */
const LIVROS = [
  { title: "Dom Casmurro", author: "Machado de Assis", ISBN: "9788535910663", publisher: "Companhia das Letras", category: "Romance", year: 2016, location: "A1-01", quantity: 3, coverColor: "#1e3a6e" },
  { title: "O Cortiço", author: "Aluísio Azevedo", ISBN: "9788572326997", publisher: "Martin Claret", category: "Romance", year: 2012, location: "A1-02", quantity: 2, coverColor: "#2c4a80" },
  { title: "A Revolução dos Bichos", author: "George Orwell", ISBN: "9788535909555", publisher: "Companhia das Letras", category: "Ficção", year: 2007, location: "A2-03", quantity: 2, coverColor: "#3a5f9e" },
  { title: "1984", author: "George Orwell", ISBN: "9788535914845", publisher: "Companhia das Letras", category: "Ficção", year: 2021, location: "A2-04", quantity: 2, coverColor: "#14254a" },
  { title: "O Pequeno Príncipe", author: "Antoine de Saint-Exupéry", ISBN: "9788595081512", publisher: "HarperCollins", category: "Infantojuvenil", year: 2018, location: "I1-01", quantity: 5, coverColor: "#d8c49c" },
  { title: "Sapiens: Uma Breve História da Humanidade", author: "Yuval Noah Harari", ISBN: "9788525432186", publisher: "L&PM", category: "História", year: 2015, location: "H2-01", quantity: 2, coverColor: "#4a3527" },
  { title: "O Alquimista", author: "Paulo Coelho", ISBN: "9788501010539", publisher: "Sextante", category: "Romance", year: 2017, location: "A1-06", quantity: 3, coverColor: "#6b4a2f" },
  { title: "A Metamorfose", author: "Franz Kafka", ISBN: "9788535910526", publisher: "Companhia das Letras", category: "Ficção", year: 2011, location: "A2-08", quantity: 1, coverColor: "#1e3a6e" },
  { title: "Introdução à Programação em Python", author: "Nilo Ney Coutinho Menezes", ISBN: "9788575227189", publisher: "Novatec", category: "Técnico", year: 2019, location: "T3-01", quantity: 3, coverColor: "#2c4a80" },
  { title: "Estruturas de Dados e Algoritmos", author: "Jayme Luiz Szwarcfiter", ISBN: "9788535288494", publisher: "LTC", category: "Técnico", year: 2018, location: "T3-04", quantity: 2, coverColor: "#3a5f9e" },
  { title: "Cem Anos de Solidão", author: "Gabriel García Márquez", ISBN: "9788501063098", publisher: "Record", category: "Ficção", year: 2009, location: "A2-11", quantity: 2, coverColor: "#4a3527" },
  { title: "História da Filosofia Ocidental", author: "Bertrand Russell", ISBN: "9788520466665", publisher: "Nova Fronteira", category: "Filosofia", year: 2015, location: "F1-02", quantity: 1, coverColor: "#6b4a2f" }
];

/** Usuários de demonstração (o perfil é "Tipo": Administrador | Leitor). */
const USUARIOS = [
  { name: "Matheus G.", email: "admin@biblio.com", telefone: "11987650000", cep: "01310100", numero: "1000", complemento: "Sala 12", userLevel: "bibliotecario", status: "apto", pass: PASS_ADMIN },
  { name: "David", email: "david.souza@email.com", telefone: "11987654321", cep: "01310200", numero: "250", complemento: null, userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "Carlos Pereira", email: "carlos.pereira@email.com", telefone: "11991238877", cep: "01310300", numero: "88", complemento: "Apto 41", userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "Prof. Rita Almeida", email: "rita.almeida@universidade.edu", telefone: "11974102100", cep: "01401000", numero: "1500", complemento: "Sala 305", userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "João Batista", email: "joao.batista@email.com", telefone: "11998761122", cep: "01311000", numero: "330", complemento: null, userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "Fernanda Lima", email: "fernanda.lima@email.com", telefone: "11998223344", cep: "01312000", numero: "45", complemento: "Casa 2", userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "Prof. Eduardo Rocha", email: "eduardo.rocha@universidade.edu", telefone: "11961115566", cep: "01403000", numero: "2200", complemento: "Sala 210", userLevel: "leitor", status: "apto", pass: PASS_LEITOR },
  { name: "Beatriz Nunes", email: "beatriz.nunes@email.com", telefone: "11912349900", cep: "01320000", numero: "77", complemento: null, userLevel: "leitor", status: "inapto", pass: PASS_LEITOR },
  { name: "Rafael Mendes", email: "rafael.mendes@email.com", telefone: "11995557788", cep: "01405000", numero: "512", complemento: "Apto 12", userLevel: "leitor", status: "apto", pass: PASS_LEITOR }
];

/** Endereços de demonstração (os CEPs são de São Paulo/SP e existem no ViaCEP). */
const ENDERECOS: Record<string, { rua: string; bairro: string; cidade: string; estado: string }> = {
  "01310100": { rua: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01310200": { rua: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01310300": { rua: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01311000": { rua: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01312000": { rua: "Avenida Nove de Julho", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01320000": { rua: "Rua Condessa de São Joaquim", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
  "01401000": { rua: "Avenida Brigadeiro Luís Antônio", bairro: "Jardim Paulista", cidade: "São Paulo", estado: "SP" },
  "01403000": { rua: "Alameda Joaquim Eugênio de Lima", bairro: "Jardim Paulista", cidade: "São Paulo", estado: "SP" },
  "01405000": { rua: "Rua Pamplona", bairro: "Jardim Paulista", cidade: "São Paulo", estado: "SP" }
};

/**
 * Empréstimos de demonstração (dias relativos a hoje).
 * `dias` = quantos dias atrás o empréstimo saiu; `prevista` = prazo (positivo = futuro).
 */
const EMPRESTIMOS = [
  { email: "david.souza@email.com", isbn: "9788535910663", dias: 20, prevista: -6, devolvido: -5, renovacoes: 1, status: "devolvido" },
  { email: "carlos.pereira@email.com", isbn: "9788535909555", dias: 30, prevista: -16, devolvido: null, renovacoes: 0, status: "atrasado" },
  { email: "rita.almeida@universidade.edu", isbn: "9788575227189", dias: 8, prevista: 6, devolvido: null, renovacoes: 0, status: "ativo" },
  { email: "fernanda.lima@email.com", isbn: "9788535910526", dias: 45, prevista: -31, devolvido: null, renovacoes: 1, status: "atrasado" },
  { email: "joao.batista@email.com", isbn: "9788520466665", dias: 12, prevista: -2, devolvido: null, renovacoes: 0, status: "atrasado" },
  { email: "eduardo.rocha@universidade.edu", isbn: "9788525432186", dias: 5, prevista: 9, devolvido: null, renovacoes: 0, status: "ativo" },
  { email: "carlos.pereira@email.com", isbn: "9788501063098", dias: 15, prevista: -1, devolvido: null, renovacoes: 0, status: "atrasado" },
  { email: "david.souza@email.com", isbn: "9788535909555", dias: 3, prevista: 11, devolvido: null, renovacoes: 0, status: "ativo" }
];

/* ============================================================
   Execução
   ============================================================ */

function diasAtraso(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function limpar() {
  await History.destroy({ where: {}, truncate: true });
  await Emprestimo.destroy({ where: {}, truncate: true });
  await Endereco.destroy({ where: {}, truncate: true });
  await Book.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  // Reinicia os contadores de autoincremento (ids começam em 1)
  await sequelize.query(
    "DELETE FROM sqlite_sequence WHERE name IN ('Users', 'Books', 'Histories', 'emprestimos', 'Enderecos')"
  );
  console.log("[seed] Banco limpo (--reset).");
}

async function main() {
  await runMigrations();
  await sequelize.sync();

  if (RESET) {
    await limpar();
  }

  // --- Usuários ---
  const usuariosPorEmail = new Map<string, User>();

  for (const dados of USUARIOS) {
    let user = await User.findOne({ where: { email: dados.email } });

    if (!user) {
      user = await User.create({
        name: dados.name,
        email: dados.email,
        telefone: dados.telefone,
        CEP: dados.cep,
        matricula: await gerarMatriculaGlobal(),
        userLevel: dados.userLevel as "leitor" | "bibliotecario",
        status: dados.status as "apto" | "inapto",
        pass_hash: await bcrypt.hash(dados.pass, 10)
      });
      console.log(`[seed] usuário criado: ${dados.email} (${dados.name})`);
    } else {
      await user.update({
        name: dados.name,
        email: dados.email,
        telefone: dados.telefone,
        CEP: dados.cep,
        userLevel: dados.userLevel as "leitor" | "bibliotecario",
        status: dados.status as "apto" | "inapto",
        pass_hash: await bcrypt.hash(dados.pass, 10)
      });
    }

    // Endereço (1:1 com o usuário)
    const endereco = await Endereco.findOne({ where: { userID: user.get("id") as number } });
    const dadosEndereco = ENDERECOS[dados.cep];
    if (dadosEndereco) {
      if (endereco) {
        await endereco.update({
          rua: dadosEndereco.rua,
          numero: dados.numero,
          bairro: dadosEndereco.bairro,
          cidade: dadosEndereco.cidade,
          estado: dadosEndereco.estado,
          cep: dados.cep,
          complemento: dados.complemento
        });
      } else {
        await Endereco.create({
          userID: user.get("id") as number,
          rua: dadosEndereco.rua,
          numero: dados.numero,
          bairro: dadosEndereco.bairro,
          cidade: dadosEndereco.cidade,
          estado: dadosEndereco.estado,
          cep: dados.cep,
          complemento: dados.complemento
        });
      }
    }

    usuariosPorEmail.set(dados.email, user);
  }

  // --- Livros ---
  const livrosPorIsbn = new Map<string, Book>();

  for (const dados of LIVROS) {
    let book = await Book.findOne({ where: { ISBN: dados.ISBN } });

    if (!book) {
      book = await Book.create({
        ...dados,
        quantityAvailable: dados.quantity
      });
      console.log(`[seed] livro criado: ${dados.title}`);
    } else {
      await book.update({
        title: dados.title,
        author: dados.author,
        publisher: dados.publisher,
        category: dados.category,
        year: dados.year,
        location: dados.location,
        coverColor: dados.coverColor
      });
    }

    livrosPorIsbn.set(dados.ISBN, book);
  }

  // --- Empréstimos (apenas quando não há nenhum) ---
  const emprestimosExistentes = await Emprestimo.count();

  if (emprestimosExistentes === 0) {
    for (const dados of EMPRESTIMOS) {
      const user = usuariosPorEmail.get(dados.email);
      const book = livrosPorIsbn.get(dados.isbn);
      if (!user || !book) continue;

      const emprestimo = await Emprestimo.create({
        bookId: book.get("id") as number,
        userId: user.get("id") as number,
        dataEmprestimo: diasAtraso(dados.dias),
        dataDevolucaoPrevista: diasAtraso(-dados.prevista),
        dataDevolucao: dados.devolvido === null ? null : diasAtraso(dados.devolvido),
        renovacoes: dados.renovacoes,
        status: dados.status as "ativo" | "atrasado" | "devolvido"
      });

      // Histórico do usuário (movimentação registrada)
      await History.create({
        acao: "emprestar",
        emprestimoId: emprestimo.get("id") as number,
        bookId: book.get("id") as number,
        userId: user.get("id") as number,
        dataEmprestimo: emprestimo.get("dataEmprestimo") as Date,
        dataDevolucaoPrevista: emprestimo.get("dataDevolucaoPrevista") as Date,
        dataDevolucao: emprestimo.get("dataDevolucao") as Date | null,
        renovacoes: emprestimo.get("renovacoes") as number,
        status: emprestimo.get("status") as "ativo" | "atrasado" | "devolvido"
      });
    }
    console.log(`[seed] ${EMPRESTIMOS.length} empréstimos criados`);
  } else {
    console.log(`[seed] ${emprestimosExistentes} empréstimos já existem — mantidos.`);
  }

  // --- Ajuste da disponibilidade conforme os empréstimos abertos ---
  const livros = await Book.findAll();
  for (const book of livros) {
    const abertos = await Emprestimo.count({
      where: {
        bookId: book.get("id") as number,
        status: { [Op.ne]: "devolvido" }
      }
    });
    const disponiveis = Math.max(0, book.quantity - abertos);
    if (book.quantityAvailable !== disponiveis) {
      await book.update({ quantityAvailable: disponiveis });
    }
  }

  console.log(
    `[seed] Pronto. Contas de demonstração:\n` +
    `       bibliotecário: admin@biblio.com / ${PASS_ADMIN}\n` +
    `       leitor:        david.souza@email.com / ${PASS_LEITOR}`
  );

  await sequelize.close();
}

main().catch((error) => {
  console.error("[seed] Falha ao executar:", error.message);
  process.exit(1);
});
