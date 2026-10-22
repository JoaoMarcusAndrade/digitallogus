import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes } from "sequelize";
import sequelize from "../database/index.js";

/**
 * Modelo de Livro.
 *
 * Representa um título do acervo. Um mesmo título pode possuir várias
 * cópias físicas (exemplares), controladas pelos campos:
 *  - quantity:        total de exemplares
 *  - quantityAvailable: exemplares disponíveis para empréstimo
 *
 * A cada empréstimo registrado, quantityAvailable é decrementado;
 * a cada devolução, é incrementado (ver emprestimo.service).
 */
class Book extends Model<
  InferAttributes<Book>,
  InferCreationAttributes<Book>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare author: string;
  declare ISBN: string;
  declare publisher: string;          // editora
  declare category: string;           // categoria (Romance, Técnico, etc.)
  declare year: number;               // ano de publicação
  declare location: string;           // localização na estante (ex.: A1-03)
  declare quantity: number;           // total de exemplares
  declare quantityAvailable: number;  // exemplares disponíveis
  declare coverColor: CreationOptional<string | null>; // cor da capa (apoio visual)
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Book.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "O título do livro é obrigatório."
      }
    }
  },

  author: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "O autor do livro é obrigatório."
      }
    }
  },

  ISBN: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: {
        // Aceita 10 ou 13 dígitos, com ou sem hífens
        args: /^[0-9Xx-]{10,17}$/,
        msg: "Formato de ISBN inválido."
      }
    }
  },

  publisher: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ""
  },

  category: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "Outros"
  },

  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1000],
        msg: "Ano de publicação inválido."
      },
      max: {
        args: [2100],
        msg: "Ano de publicação inválido."
      }
    }
  },

  location: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: ""
  },

  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: "A quantidade de exemplares deve ser pelo menos 1."
      }
    }
  },

  quantityAvailable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: "A quantidade disponível não pode ser negativa."
      }
    }
  },

  coverColor: {
    type: DataTypes.STRING(9),
    allowNull: true
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  sequelize,
  tableName: "Books"
});

export default Book;
