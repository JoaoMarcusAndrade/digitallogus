import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes } from "sequelize";
import sequelize from "../database/index.js";


class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare CEP: string;
  declare telefone: string;
  declare email: string;
  declare userLevel: 'leitor' | 'bibliotecario';
  declare status: 'apto' | 'inapto';
  declare pass_hash: string;
}


User.init({

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    CEP: {
        type: DataTypes.STRING(9),
        allowNull: false,
        validate: {
            is: {
                args: /^([0-9]{8}|[0-9]{5}-[0-9]{3})$/,
                msg: "Formato de CEP inválido. Use 12345678 ou 12345-678."
            }
        }
    },

    telefone: {
        type: DataTypes.STRING(11),
        allowNull: false,
        validate: {
            is: {
                // Aceita fixos (10 dígitos) ou celulares (11 dígitos) com DDD
                args: /^[1-9]{2}9?[0-9]{8}$/,
                msg: "O telefone deve conter apenas números com o DDD (ex: 11999998888)."
            }
        }
    },

    email: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            isEmail: {
                msg: "O formato inserido é inválido." //mensagem de erro caso não seja um email
            }
        }
    },

    pass_hash: {
        type: DataTypes.STRING(60),
        allowNull: false
    },

    userLevel: {
        type: DataTypes.ENUM('leitor','bibliotecario'),
        allowNull: false,
        defaultValue: 'leitor'
    },

    status: {
        type: DataTypes.ENUM('apto','inapto'),
        allowNull: false,
        defaultValue: 'apto'
    }

}, {
    sequelize,
    tableName: "Users"
})


export default User;