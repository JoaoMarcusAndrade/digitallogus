import User from "./User.js";
import Book from "./Book.js";
import Endereco from "./Endereco.js";
import History from "./History.js";

// ============================================================
// Associações entre os modelos
//   - User 1:1 Endereco
//   - User 1:N History
//   - Book 1:N History
// ============================================================

// Um usuário possui um único endereço.
User.hasOne(Endereco, {
  foreignKey: "userID",
  as: "endereco",
  onDelete: "CASCADE"
});
Endereco.belongsTo(User, {
  foreignKey: "userID",
  as: "user"
});

// Um usuário possui vários registros de histórico (empréstimos).
User.hasMany(History, {
  foreignKey: "userId",
  as: "historico",
  onDelete: "CASCADE"
});
History.belongsTo(User, {
  foreignKey: "userId",
  as: "leitor"
});

// Um livro possui vários registros de histórico (empréstimos).
Book.hasMany(History, {
  foreignKey: "bookId",
  as: "historico",
  onDelete: "CASCADE"
});
History.belongsTo(Book, {
  foreignKey: "bookId",
  as: "livro"
});

export {
  User,
  Book,
  Endereco,
  History
};
