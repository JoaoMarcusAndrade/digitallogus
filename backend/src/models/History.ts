import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes, NonAttribute } from "sequelize";
import sequelize from "../database/index.js";
import Book from "./Book.js";
import User from "./User.js";

/**
 * Modelo de Histórico do usuário.
 *
 * Guarda as **movimentações** de cada usuário com livros (auditoria):
 *  - acao:                emprestar | devolver | renovar
 *  - emprestimoId:        FK para o empréstimo correspondente (Emprestimo)
 *  - bookId/userId:       relações com livro e usuário
 *  - dataEmprestimo/dataDevolucaoPrevista/dataDevolucao/renovacoes/status:
 *                         cópia do estado do empréstimo no momento do evento
 *
 * O empréstimo em si vive na tabela `emprestimos` (modelo Emprestimo).
 */
class History extends Model<
  InferAttributes<History>,
  InferCreationAttributes<History>
> {
  declare id: CreationOptional<number>;
  declare acao: CreationOptional<'emprestar' | 'devolver' | 'renovar'>;
  declare emprestimoId: CreationOptional<number | null>;
  declare bookId: number;                       // FK para Book
  declare userId: number;                       // FK para User (leitor)
  declare dataEmprestimo: Date;                 // entrada
  declare dataDevolucaoPrevista: Date;          // prazo previsto
  declare dataDevolucao: CreationOptional<Date | null>; // saída (devolução)
  declare renovacoes: CreationOptional<number>;
  declare status: 'ativo' | 'devolvido' | 'atrasado';

  declare livro?: NonAttribute<Book>;
  declare user?: NonAttribute<User>;
}

History.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  acao: {
    type: DataTypes.STRING(20),
    allowNull: true
  },

  emprestimoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "emprestimos",
      key: "id"
    }
  },

  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Books",
      key: "id"
    }
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    }
  },

  dataEmprestimo: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  dataDevolucaoPrevista: {
    type: DataTypes.DATE,
    allowNull: false
  },

  dataDevolucao: {
    type: DataTypes.DATE,
    allowNull: true
  },

  renovacoes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  status: {
    type: DataTypes.ENUM('ativo', 'devolvido', 'atrasado'),
    allowNull: false,
    defaultValue: 'ativo'
  }

}, {
  sequelize,
  tableName: "Histories"
});

export default History;
