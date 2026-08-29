import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes, NonAttribute } from "sequelize";
import sequelize from "../database/index.js";
import Book from "./Book.js";
import User from "./User.js";

/**
 * Modelo de Histórico de Empréstimo.
 *
 * Registra a movimentação de um exemplar de livro:
 *  - dataEmprestimo:       quando o exemplar "entrou" com o leitor (entrada)
 *  - dataDevolucaoPrevista: prazo esperado para devolução
 *  - dataDevolucao:        quando o exemplar "saiu"/foi devolvido (saída) — null enquanto ativo
 *  - renovacoes:           quantas vezes o prazo foi renovado
 *  - status:               ativo | devolvido | atrasado
 *
 * Relacionamentos (em models/index.ts):
 *  - Book.hasMany(History) / History.belongsTo(Book)
 *  - User.hasMany(History) / History.belongsTo(User)
 */
class History extends Model<
  InferAttributes<History>,
  InferCreationAttributes<History>
> {
  declare id: CreationOptional<number>;
  declare bookId: number;                       // FK para Book
  declare userId: number;                       // FK para User (leitor)
  declare dataEmprestimo: Date;                 // entrada
  declare dataDevolucaoPrevista: Date;          // prazo previsto
  declare dataDevolucao: CreationOptional<Date | null>; // saída (devolução)
  declare renovacoes: CreationOptional<number>;
  declare status: 'ativo' | 'devolvido' | 'atrasado';

  declare book?: NonAttribute<Book>;
  declare user?: NonAttribute<User>;
}

History.init({
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
  tableName: "Histories"
});

export default History;
