import User from "./User.js";
import Book from "./Book.js";
import Endereco from "./Endereco.js";
import History from "./History.js";
import Emprestimo from "./Emprestimo.js";

// ============================================================
// Associações entre os modelos
//   - User 1:1 Endereco
//   - User 1:N Emprestimo (empréstimos)
//   - Book 1:N Emprestimo
//   - User 1:N History (histórico)
//   - Book 1:N History (histórico)
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

// Empréstimos
User.hasMany(Emprestimo, {
  foreignKey: "userId",
  as: "emprestimos",
  onDelete: "CASCADE"
});
Emprestimo.belongsTo(User, {
  foreignKey: "userId",
  as: "leitor"
});

Book.hasMany(Emprestimo, {
  foreignKey: "bookId",
  as: "emprestimos",
  onDelete: "CASCADE"
});
Emprestimo.belongsTo(Book, {
  foreignKey: "bookId",
  as: "livro"
});

// Histórico
User.hasMany(History, {
  foreignKey: "userId",
  as: "historico",
  onDelete: "CASCADE"
});
History.belongsTo(User, {
  foreignKey: "userId",
  as: "leitor"
});

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
  History,
  Emprestimo
};
