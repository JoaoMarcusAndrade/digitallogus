import { DataTypes, Model, InferAttributes, CreationOptional, InferCreationAttributes } from "sequelize";
import sequelize from "../database/index.js";


class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    /** Matrícula institucional do leitor (opcional). */
    declare matricula: CreationOptional<string | null>;
    /** CEP — opcional: o cadastro feito pelo bibliotecário não exige endereço. */
    declare CEP: CreationOptional<string>;
    declare telefone: CreationOptional<string>;
    declare email: string;
    declare userLevel: 'leitor' | 'bibliotecario';
    declare status: 'apto' | 'inapto';
    declare pass_hash: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
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

    matricula: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: true
    },

    CEP: {
        type: DataTypes.STRING(9),
        allowNull: false,
        validate: {
            cepValido(value: string) {
                if (!value) return;
                const digitos = String(value).replace(/\D/g, "");
                if (digitos.length !== 8) {
                    throw new Error("Formato de CEP inválido. Use 12345678 ou 12345-678.");
                }
            }
        }
    },

    telefone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "",
        validate: {
            telefoneValido(value: string) {
                if (!value) return;
                if (!/^[1-9][0-9]{9,10}$/.test(value)) {
                    throw new Error("O telefone deve conter apenas números com o DDD (ex.: 11999998888).");
                }
            }
        }
    },

    email: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            isEmail: {
                msg: "O formato inserido é inválido." //mensagem de erro caso seja um email
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
    tableName: "Users"
})


export default User;
