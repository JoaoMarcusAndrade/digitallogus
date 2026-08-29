/**
 * Script de Seed — garante a existência de ao menos um bibliotecário inicial.
 *
 * Uso: `npm run seed -w backend`
 *
 * Como o cadastro normal (register) sempre cria nível 'leitor', é preciso de
 * um caminho de "bootstrap" para o primeiro administrador. Este script cria
 * (ou não altera) o bibliotecário padrão abaixo apenas se ainda não houver
 * nenhum usuário do nível 'bibliotecario' no banco.
 */

import "../env.js";
import sequelize from "../database/index.js";
import "../models/index.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

const SEED = {
  name: "Ana Dias",
  CEP: "01310100",
  telefone: "11987654321",
  email: "bibliotecaria@biblio.com",
  pass: process.env.SEED_ADMIN_PASS || "bibliotecario123",
  userLevel: "bibliotecario" as const
};

async function main() {
  // Evita criar um segundo admin se já existir algum bibliotecário
  const existingAdmin = await User.findOne({ where: { userLevel: 'bibliotecario' } });

  if (existingAdmin) {
    console.log(
      `[seed] Já existe um bibliotecário ("${existingAdmin.get("name")}"). Nenhum usuário criado.`
    );
    await sequelize.close();
    return;
  }

  const pass_hash = await bcrypt.hash(SEED.pass, 10);

  await User.create({
    name: SEED.name,
    CEP: SEED.CEP,
    telefone: SEED.telefone,
    email: SEED.email,
    userLevel: SEED.userLevel,
    status: 'apto',
    pass_hash
  });

  console.log(
    `[seed] Bibliotecário criado: ${SEED.email} (senha: ${SEED.pass})` +
    `\n      ⚠ Mude a senha após o primeiro acesso.`
  );

  await sequelize.close();
}

main().catch((error) => {
  console.error("[seed] Falha ao executar:", error.message);
  process.exit(1);
});
