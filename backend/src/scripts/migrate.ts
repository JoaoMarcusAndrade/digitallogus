/**
 * Script de migração do banco.
 *
 * Uso: `npm run migrate -w backend`
 *
 * Aplica as migrações pendentes (colunas novas em `Users` e `Books`) de forma
 * idempotente. O servidor também roda isso sozinho no boot, mas o script
 * permite aplicar as mudanças sem reiniciar a aplicação.
 */

import "../env.js";
import sequelize from "../database/index.js";
import { runMigrations } from "../database/migrate.js";

runMigrations(sequelize)
    .then(async () => {
        console.log("[migrate] Banco atualizado.");
        await sequelize.close();
    })
    .catch(async (error) => {
        console.error("[migrate] Falha ao migrar o banco:", error.message);
        await sequelize.close();
        process.exit(1);
    });
