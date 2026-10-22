import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./src/database/database.sqlite"
});

export default sequelize;