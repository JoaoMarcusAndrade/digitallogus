/**
 * Migrações do banco (SQLite).
 *
 * O `sequelize.sync()` só cria tabelas que ainda não existem — ele **não**
 * adiciona colunas em tabelas já criadas. Por isso, toda mudança de schema
 * precisa de uma migração explícita e idempotente (executar várias vezes não
 * quebra).
 *
 * Este módulo é executado automaticamente no boot do servidor
 * (ver src/app.ts) e também pode ser rodado manualmente:
 *
 *   npm run migrate -w backend
 */

import { DataTypes, ModelAttributeColumnOptions, QueryInterface, Sequelize } from "sequelize";
import sequelize from "./index.js";

/** Verifica se a tabela existe no banco. */
async function tabelaExiste(qi: QueryInterface, nome: string): Promise<boolean> {
    const tabelas = await qi.showAllTables();
    return tabelas.map((t: any) => String(t)).includes(nome);
}

/** Adiciona a coluna apenas se ela ainda não existir. */
async function addColumnIfMissing(
    qi: QueryInterface,
    tabela: string,
    coluna: string,
    definicao: ModelAttributeColumnOptions
): Promise<boolean> {
    const existentes = await qi.describeTable(tabela);
    if (existentes[coluna]) return false;

    await qi.addColumn(tabela, coluna, definicao);
    console.log(`[migrate] + ${tabela}.${coluna}`);
    return true;
}

/**
 * Preenche as colunas de data dos usuários já existentes.
 */
async function preencherDatasUsuarios(db: Sequelize) {
    await db.query(
        "UPDATE Users SET createdAt = COALESCE(createdAt, CURRENT_TIMESTAMP), " +
        "updatedAt = COALESCE(updatedAt, CURRENT_TIMESTAMP) " +
        "WHERE createdAt IS NULL OR updatedAt IS NULL"
    );
}

/** Cria o índice único da matrícula (ignorando valores vazios). */
async function criarIndicesUnicos(db: Sequelize) {
    await db.query(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_matricula " +
        "ON Users (matricula) WHERE matricula IS NOT NULL AND matricula <> ''"
    );
}

/**
 * Remove a coluna `username` da tabela `Users`.
 *
 * O login passa a ser só por e-mail, então o "nome de usuário" não existe mais.
 * A ordem importa: o SQLite recusa dropar uma coluna que esteja indexada —
 * por isso o índice é removido antes da coluna.
 */
async function removerColunaUsername(qi: QueryInterface, db: Sequelize) {
    if (!(await tabelaExiste(qi, "Users"))) return;

    await db.query("DROP INDEX IF EXISTS idx_users_username");

    const colunas = await qi.describeTable("Users");
    if (!colunas["username"]) return;

    await qi.sequelize.query("ALTER TABLE Users DROP COLUMN username");
    console.log("[migrate] - Users.username (login agora é só por e-mail)");
}

/**
 * Cria a tabela `emprestimos` (antes os empréstimos viviam em `Histories`) e
 * copia os registros existentes, preservando os ids.
 */
async function criarTabelaEmprestimos(qi: QueryInterface, db: Sequelize) {
    if (!(await tabelaExiste(qi, "emprestimos"))) {
        await qi.createTable("emprestimos", {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            bookId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "Books", key: "id" },
                onDelete: "CASCADE",
                onUpdate: "CASCADE"
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "Users", key: "id" },
                onDelete: "CASCADE",
                onUpdate: "CASCADE"
            },
            dataEmprestimo: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            dataDevolucaoPrevista: { type: DataTypes.DATE, allowNull: false },
            dataDevolucao: { type: DataTypes.DATE, allowNull: true },
            renovacoes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: "ativo"
            },
            createdAt: { type: DataTypes.DATE, allowNull: true },
            updatedAt: { type: DataTypes.DATE, allowNull: true }
        });
        console.log("[migrate] tabela emprestimos criada");
    }

    // Copia os empréstimos que ainda estão apenas em Histories.
    const [jaCopiados] = (await db.query("SELECT COUNT(*) as total FROM emprestimos")) as [any[], unknown];
    if (Number((jaCopiados[0] as any)?.total || 0) === 0 && (await tabelaExiste(qi, "Histories"))) {
        await db.query(
            "INSERT INTO emprestimos " +
            "(id, bookId, userId, dataEmprestimo, dataDevolucaoPrevista, dataDevolucao, renovacoes, status, createdAt, updatedAt) " +
            "SELECT id, bookId, userId, dataEmprestimo, dataDevolucaoPrevista, dataDevolucao, renovacoes, status, createdAt, updatedAt " +
            "FROM Histories"
        );
        console.log("[migrate] empréstimos copiados de Histories para emprestimos");
    }
}

/**
 * Ajusta a tabela `Histories` para o papel de histórico do usuário:
 * colunas `acao` e `emprestimoId`.
 */
async function ajustarTabelaHistories(qi: QueryInterface, db: Sequelize) {
    if (!(await tabelaExiste(qi, "Histories"))) return;

    await addColumnIfMissing(qi, "Histories", "acao", {
        type: DataTypes.STRING(20),
        allowNull: true
    });
    await addColumnIfMissing(qi, "Histories", "emprestimoId", {
        type: DataTypes.INTEGER,
        allowNull: true
    });

    // Linhas legadas (que ainda eram empréstimos) viram histórico de usuários.
    await db.query(
        "UPDATE Histories SET acao = 'emprestar' WHERE acao IS NULL OR acao = ''"
    );
    await db.query(
        "UPDATE Histories SET emprestimoId = id WHERE emprestimoId IS NULL"
    );
}

/**
 * Preenche a matrícula (AAAA + NNNN) dos usuários que ainda não têm.
 * O índice é global por ano, considerando todos os tipos de usuário.
 * Matrículas antigas fora do padrão (ex.: "BIB-0001", "PROF-048") são
 * renormalizadas usando o ano de cadastro do usuário.
 */
async function preencherMatriculas(db: Sequelize) {
    const [usuarios] = (await db.query(
        "SELECT id, createdAt, matricula FROM Users ORDER BY createdAt ASC, id ASC"
    )) as [any[], unknown];

    const padrao = /^\d{8}$/;
    const porAno = new Map<string, number>();

    // Conta as matrículas válidas já existentes em cada ano.
    for (const usuario of usuarios as any[]) {
        if (!usuario.matricula || !padrao.test(usuario.matricula)) continue;
        const ano = usuario.matricula.slice(0, 4);
        porAno.set(ano, (porAno.get(ano) || 0) + 1);
    }

    for (const usuario of usuarios as any[]) {
        if (usuario.matricula && padrao.test(usuario.matricula)) continue;

        const ano = usuario.createdAt ? String(usuario.createdAt).slice(0, 4) : String(new Date().getFullYear());
        const prefixo = /^\d{4}$/.test(ano) ? ano : String(new Date().getFullYear());

        let sequencial = (porAno.get(prefixo) || 0) + 1;
        let matricula = `${prefixo}${String(sequencial).padStart(4, "0")}`;
        while (await matriculaEmUso(db, matricula)) {
            sequencial += 1;
            matricula = `${prefixo}${String(sequencial).padStart(4, "0")}`;
        }
        porAno.set(prefixo, sequencial);

        await db.query("UPDATE Users SET matricula = ? WHERE id = ?", {
            replacements: [matricula, usuario.id]
        });
        console.log(`[migrate] matrícula do usuário ${usuario.id} -> "${matricula}"`);
    }
}

/** Verifica se a matrícula já pertence a outro usuário. */
async function matriculaEmUso(db: Sequelize, matricula: string): Promise<boolean> {
    const [linhas] = (await db.query(
        "SELECT id FROM Users WHERE matricula = ? LIMIT 1",
        { replacements: [matricula] }
    )) as [any[], unknown];
    return linhas.length > 0;
}

/**
 * Executa todas as migrações pendentes. Idempotente.
 */
export async function runMigrations(db: Sequelize = sequelize): Promise<void> {
    const qi = db.getQueryInterface();

    if (await tabelaExiste(qi, "Users")) {
        await addColumnIfMissing(qi, "Users", "matricula", {
            type: DataTypes.STRING(40),
            allowNull: true
        });
        await addColumnIfMissing(qi, "Users", "createdAt", {
            type: DataTypes.DATE,
            allowNull: true
        });
        await addColumnIfMissing(qi, "Users", "updatedAt", {
            type: DataTypes.DATE,
            allowNull: true
        });

        await preencherDatasUsuarios(db);
        await criarIndicesUnicos(db);
        await preencherMatriculas(db);
        await removerColunaUsername(qi, db);
    }

    if (await tabelaExiste(qi, "Books")) {
        await addColumnIfMissing(qi, "Books", "createdAt", {
            type: DataTypes.DATE,
            allowNull: true
        });
        await addColumnIfMissing(qi, "Books", "updatedAt", {
            type: DataTypes.DATE,
            allowNull: true
        });
        await db.query(
            "UPDATE Books SET createdAt = COALESCE(createdAt, CURRENT_TIMESTAMP), " +
            "updatedAt = COALESCE(updatedAt, CURRENT_TIMESTAMP) " +
            "WHERE createdAt IS NULL OR updatedAt IS NULL"
        );
    }

    await criarTabelaEmprestimos(qi, db);
    await ajustarTabelaHistories(qi, db);
}
