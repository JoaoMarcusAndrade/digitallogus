import path from "path";
import express from 'express'
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js"
import cors from "cors"
import { fileURLToPath } from "url";
import { router } from "./routes/index.routes.js";
import sequelize from "./database/index.js";
import { runMigrations } from "./database/migrate.js";
import "./models/index.js";
export const app = express();

export const __filename = fileURLToPath(import.meta.url);
export const _dirname = path.dirname(__filename);

// Aplica as migrações pendentes (colunas novas) e só então sincroniza o schema.
// O sync() sozinho não altera tabelas que já existem no SQLite.
runMigrations()
    .then(() => sequelize.sync())
    .then(() => {
        console.log("Banco sincronizado");
    })
    .catch((error) => {
        console.error("Falha ao preparar o banco:", error.message);
    });

app.use(cors())

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static(path.join(_dirname, "views")));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(router);