import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes, NonAttribute } from "sequelize";
import sequelize from "../database/index.js";
import User from "./User.js";

/**
 * Modelo de Endereço.
 *
 * Guarda o endereço completo do usuário.
 * Relação 1:1 com User (um usuário tem um endereço, um endereço pertence
 * a um único usuário). A associação é definida em models/index.ts.
 */
class Endereco extends Model<
  InferAttributes<Endereco>,
  InferCreationAttributes<Endereco>
> {
  declare id: CreationOptional<number>;
  declare userID: number;        // FK para User
  declare rua: string;
  declare numero: string;
  declare bairro: string;
  declare cidade: string;
  declare estado: string;
  declare cep: string;
  declare complemento: CreationOptional<string | null>;

  declare user?: NonAttribute<User>;
}

Endereco.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  userID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    }
  },

  rua: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  numero: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  bairro: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  cidade: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  estado: {
    type: DataTypes.STRING(2),
    allowNull: false
  },

  cep: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: {
      is: {
        args: /^([0-9]{8}|[0-9]{5}-[0-9]{3})$/,
        msg: "Formato de CEP inválido. Use 12345678 ou 12345-678."
      }
    }
  },

  complemento: {
    type: DataTypes.STRING(150),
    allowNull: true
  }

}, {
  sequelize,
  tableName: "Enderecos"
});

export default Endereco;
