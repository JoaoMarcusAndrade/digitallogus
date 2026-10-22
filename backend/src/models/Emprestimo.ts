// Novo arquivo (Emprestimo). Tabela separada para empréstimos ativos/finalizados.
// Histories passa a ter outro propósito (histórico).
import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes, NonAttribute } from "sequelize";
import sequelize from "../database/index.js";
import Book from "./Book.js";
import User from "./User.js";

class Emprestimo extends Model<
  InferAttributes<Emprestimo>,
  InferCreationAttributes<Emprestimo>
> {
  declare id: CreationOptional<number>;
  declare bookId: number;
  declare userId: number;
  declare dataEmprestimo: Date;
  declare dataDevolucaoPrevista: Date;
  declare dataDevolucao: CreationOptional<Date | null>;
  declare renovacoes: CreationOptional<number>;
  declare status: 'ativo' | 'devolvido' | 'atrasado';

  declare livro?: NonAttribute<Book>;
  declare leitor?: NonAttribute<User>;
}

Emprestimo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  tableName: "emprestimos"
});

export default Emprestimo;
