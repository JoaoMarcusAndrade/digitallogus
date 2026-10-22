# Sistema de Biblioteca (Backend)

Backend de um software de biblioteca pública. Possui **dois papéis de usuário**: **leitor** e **bibliotecário**.

> ⚠️ Projeto em desenvolvimento. Ainda não implementado: CRUD de livros e rotas do bibliotecário.
> É um projeto simples, sem muita segurança adicional.

## Português

### Stack

- Node.js
- TypeScript
- Express 5
- Sequelize + SQLite
- bcrypt (hash de senha)
- Swagger (documentação da API em `/docs`)

> Sem JWT: o login apenas valida email e senha e retorna o usuário.

### Pré-requisitos

- Node.js 18+
- npm

### Como rodar

Instale as dependências (na raiz do projeto):

```bash
npm install
```

Execute o backend (na raiz do projeto):

```bash
npm run dev -w backend
```

Ou, dentro da pasta `backend`:

```bash
npm run dev
```

- Servidor: http://localhost:3000
- Documentação Swagger: http://localhost:3000/docs

### Migrações do banco

O `sequelize.sync()` cria tabelas, mas **não** adiciona colunas em tabelas já
existentes. Toda mudança de schema passa por uma migração idempotente:

```bash
npm run migrate -w backend
```

O servidor também aplica as migrações automaticamente no boot, mas o comando
acima permite atualizá-las sem reiniciar a aplicação.

### Campos do usuário

| Campo       | Tipo   | Observação                                              |
| ----------- | ------ | ------------------------------------------------------- |
| `name`      | string | Nome completo                                           |
| `firstName` | string | Primeiro nome (ignorando títulos como `Prof.`/`Dr.`)   |
| `matricula` | string | Gerada pelo sistema (única) — ver "Matrícula" abaixo   |
| `email`     | string | E-mail — **é o login do sistema** (único)              |
| `telefone`  | string | Apenas dígitos, com DDD                                |
| `CEP`       | string | Endereço preenchido via ViaCEP (tabela `Enderecos`)     |
| `userLevel` | enum   | `leitor` \| `bibliotecario`                             |
| `status`    | enum   | No banco: `apto` \| `inapto` — na API: `ativo` \| `inativo` |

### Matrícula

A matrícula é **gerada automaticamente** pelo back-end, no padrão `AAAA + NNNN`
(4 dígitos do ano + 4 dígitos do índice): por exemplo, `20260087` é o 87º
usuário cadastrado em 2026.

- O índice é **global por ano**, considerando **todos os perfis** (o
  bibliotecário também entra na contagem — ele é um leitor com poderes extras).
- O valor informado no cadastro é ignorado: o sistema sempre gera um novo.
- Usuários existentes com matrícula fora do padrão (ex.: `BIB-0001`) são
  renormalizados pela migração, usando o ano de cadastro.

### Endereço (CEP obrigatório)

O **CEP é obrigatório para todos os usuários** (leitores e bibliotecário), assim
como o **número**; o **complemento** é opcional.

- No cadastro, o back-end consulta a API pública **ViaCEP**
  (`https://viacep.com.br/ws/{cep}/json/`) e grava o endereço completo na
  tabela `Enderecos` (relação 1:1 com `Users`).
- Rua, bairro, cidade e estado vêm da consulta e não são editáveis manualmente.
- Se o CEP não existir, o cadastro é recusado com o erro da API.
- Ao editar um usuário com CEP diferente, o endereço é reconsultado e atualizado.

Endpoint auxiliar para consultar um CEP sem salvar nada:

```
GET /api/leitor/cep/01310200
→ { "rua": "Avenida Paulista", "bairro": "Bela Vista", "cidade": "São Paulo", "estado": "SP", "cep": "01310200" }
```

### Notificações por e-mail

O sistema envia e-mails em três situações:

| E-mail                        | Quando acontece                                          |
| ----------------------------- | --------------------------------------------------------- |
| Senha provisória              | Cadastro de usuário sem senha definida                     |
| Devolução próxima             | Empréstimo vence dentro de `CRON_DUE_SOON_DAYS` (padrão 2)   |
| Empréstimo atrasado            | Prazo vencido e ainda não devolvido                       |

A **senha provisória é enviada apenas por e-mail** — ela não volta na
resposta da API nem aparece na tela.

Configuração (arquivo `.env` na raiz do projeto — ver `.env.example`):

| Variável              | Função                                                            |
| --------------------- | ----------------------------------------------------------------- |
| `SMTP_HOST`           | Servidor SMTP (padrão `smtp.gmail.com`)                            |
| `SMTP_PORT`           | Porta (padrão `587`)                                               |
| `SMTP_SECURE`         | `true` para conexão segura (porta 465)                             |
| `SMTP_USER` / `SMTP_PASS` | Credenciais do e-mail remetente                                 |
| `EMAIL_FROM`          | Remetente dos avisos (padrão: `SMTP_USER`)                         |
| `EMAIL_REDIRECT_TO`   | Envia **todos** os avisos para este e-mail (modo de teste)        |
| `CRON_HOUR`            | Horário da rodada diária de notificações (padrão `8`)              |
| `CRON_DUE_SOON_DAYS`   | Dias de antecedência do aviso de vencimento (padrão `2`)           |

- Sem `SMTP_PASS`: nada é enviado de verdade — os e-mails são apenas
  impressos no console (modo log), então o fluxo local não quebra.
- Com `EMAIL_REDIRECT_TO`: nenhum leitor recebe e-mail de verdade; tudo vai
  para o e-mail de teste.
- A rodada diária roda por `node-cron` (`0 CRON_HOUR * * *`) e também pode ser
  disparada sob demanda:

```bash
npm run notify -w backend
```

### Credenciais de demonstração

| Perfil         | E-mail                 | Senha      |
| -------------- | ---------------------- | ---------- |
| Bibliotecário  | `admin@biblio.com`     | `admin123` |
| Leitor         | `david.souza@email.com`| `leitor123`|

O login aceita **apenas e-mail + senha**.

### Tabelas

| Tabela       | Conteúdo                                                        |
| ------------ | --------------------------------------------------------------- |
| `Users`      | Usuários (leitores e bibliotecário)                             |
| `Enderecos`  | Endereço completo de cada usuário (1:1)                          |
| `Books`      | Acervo                                                           |
| `emprestimos`| **Empréstimos** — relaciona livro e usuário (`bookId` + `userId`) |
| `Histories`  | **Histórico do usuário** — movimentações (`emprestar`, `devolver`, `renovar`) |

O empréstimo em si vive em `emprestimos` (com `bookId`, `userId`, prazos e
status). Cada movimentação é registrada em `Histories` com o campo `acao`, o
vínculo `emprestimoId` e uma cópia do estado do empréstimo no momento do evento.

### Regras de acesso

- O **leitor** pode criar a própria conta.
- O **leitor** **não** pode editar nem excluir a própria conta.
- Apenas o **bibliotecário** (identificado por `admId` na query) pode editar e excluir usuários.
- A **lista de usuários** é restrita ao bibliotecário — o leitor não tem tela de usuários.
- O leitor consulta o acervo (somente leitura) e os próprios empréstimos (`?userId=`).

### Contrato da API

As respostas usam o vocabulário do banco (inglês): `title`, `author`, `ISBN`,
`publisher`, `category`, `year`, `location`, `quantity`, `quantityAvailable`,
`name`, `firstName`, `email`, `matricula`, `userLevel`, `status`.

O login é feito **somente por e-mail** e senha: não existe mais `username`.
Quem entra pelo perfil de leitor é tratado pelo primeiro nome; a equipe da
biblioteca vê o nome completo.

Exceções (únicas), para manter a compatibilidade com o protótipo:

- status do usuário: `ativo` \| `inativo` (no banco: `apto` \| `inapto`);
- status do empréstimo: `active` \| `overdue` \| `returned` (no banco: `ativo` \| `atrasado` \| `devolvido`).

Emprestamentos trazem o livro e o leitor aninhados (`book` e `reader`).
O usuário também traz o endereço completo aninhado (`endereco`).

### Filtros e paginação

As listagens da API respondem no mesmo envelope:

```json
{ "items": [...], "total": 42, "page": 1, "perPage": 8, "pages": 6 }
```

| Parâmetro | Aplicação                    | Valores                                                     |
| --------- | ---------------------------- | ----------------------------------------------------------- |
| `q`       | busca textual                | nome/e-mail/matrícula (usuários), título/autor/ISBN (livros), leitor/livro (empréstimos) |
| `status`  | filtro de status             | `ativo`\|`inativo` (usuários), `available`\|`loaned`\|`out` (livros), `active`\|`overdue`\|`returned` (empréstimos) |
| `tipo`    | perfil de acesso (usuários)  | `leitor`\|`bibliotecario` (aceita também `Administrador`/`Leitor`) |
| `category`| categoria (livros)           | texto livre (`Romance`, `Ficção`, ...)                      |
| `userId`  | leitor (empréstimos)          | id do leitor                                                 |
| `page`    | página atual                 | padrão `1`                                                   |
| `perPage` | itens por página             | padrão `8`, máximo `100`                                    |

> A busca usa `LIKE` do SQLite: é case-insensitive para caracteres ASCII, mas
> acentos devem ser digitados como estão no cadastro.

### Endpoints implementados

| Método | Rota                                    | Descrição                                                    |
| ------ | --------------------------------------- | ------------------------------------------------------------ |
| POST   | `/api/leitor/register`                  | Leitor cria a própria conta (CEP e número obrigatórios)     |
| POST   | `/api/leitor/login`                     | Login (e-mail + senha)                                      |
| GET    | `/api/leitor?admId=`                    | Lista usuários (bibliotecário) com filtros e paginação       |
| POST   | `/api/leitor?admId=`                    | Cria usuário (bibliotecário); a senha provisória é enviada por e-mail |
| GET    | `/api/leitor/cep/:cep`                  | Consulta o endereço completo de um CEP (ViaCEP)               |
| GET    | `/api/leitor/:userId`                   | Busca um usuário por ID                                       |
| PATCH  | `/api/leitor/:userId?admId=`            | Edita um usuário (apenas bibliotecário)                       |
| DELETE | `/api/leitor/:userId?admId=`            | Exclui um usuário (apenas bibliotecário)                      |
| GET    | `/api/livros`                           | Acervo com busca, filtros e paginação (livre para o leitor)   |
| GET    | `/api/livros/categorias`                | Categorias do acervo com contagem                             |
| GET    | `/api/livros/:bookId`                   | Busca um livro por ID                                         |
| GET    | `/api/livros/:bookId/history?admId=`    | Histórico de empréstimos do livro — **restrito ao bibliotecário** (o leitor não vê quem pegou o livro) |
| POST   | `/api/livros?admId=`                    | Cadastra um livro (bibliotecário)                             |
| PATCH  | `/api/livros/:bookId?admId=`            | Atualiza um livro (bibliotecário)                             |
| DELETE | `/api/livros/:bookId?admId=`            | Exclui um livro (bibliotecário)                               |
| GET    | `/api/emprestimos?admId=`               | Empréstimos com filtros e paginação (bibliotecário)           |
| GET    | `/api/emprestimos/me?userId=`           | Empréstimos do próprio leitor                                 |
| POST   | `/api/emprestimos?admId=`               | Registra um empréstimo (bibliotecário)                        |
| POST   | `/api/emprestimos/:historyId/devolver?admId=` | Registra devolução (bibliotecário)                     |
| POST   | `/api/emprestimos/:historyId/renovar?admId=`  | Renova o prazo (bibliotecário, máx. 2 renovações)       |
| GET    | `/api/dashboard/resumo?admId=`          | Painel do bibliotecário (indicadores, recentes, categorias)   |
| GET    | `/api/dashboard/leitor?userId=`         | Painel do leitor (meus empréstimos, avisos, disponíveis)       |

### Estrutura do backend

```
backend/src
├── app.ts            # Setup do Express (CORS, JSON, Swagger, sync do banco)
├── server.ts         # Inicialização do servidor (porta 3000)
├── env.ts            # Carrega variáveis de ambiente (.env)
├── swagger.ts        # Configuração do Swagger
├── controllers/      # Camada de controle (HTTP)
├── services/         # Regras de negócio
├── dto/              # Serialização das respostas (contrato da API)
├── models/           # Models do Sequelize (User, Book, Endereco, Emprestimo, History)
├── routes/           # Rotas da API
├── utils/            # Autorização, paginação, cache (TTL em memória) e consulta de CEP (ViaCEP)
├── database/         # Conexão com o banco (SQLite) e migrações
├── jobs/             # Agendador diário de notificações (node-cron)
├── services/notify.service.ts # Envio de e-mails (nodemailer)
├── scripts/          # Seed, migração e disparo manual de notificações
└── views/            # Arquivos estáticos
```

### Roadmap

- [x] Cadastro e login de leitor
- [x] Listar/buscar usuários (com filtros e paginação no servidor)
- [x] Editar/excluir usuário (bibliotecário)
- [x] Cadastro de usuários pelo bibliotecário (com senha provisória)
- [x] CRUD do acervo (livros, categorias e histórico de empréstimos)
- [x] Empréstimos: registro, devolução e renovação (tabela `emprestimos`)
- [x] Matrícula automática (ano + índice) e endereço obrigatório via ViaCEP (tabela `Enderecos`)
- [x] Painéis do bibliotecário e do leitor
- [ ] Front-end React (em andamento)

---
## English

Backend for a public library software. It has **two user roles**: **reader (leitor)** and **librarian (bibliotecário)**.

> ⚠️ Project under development. The React front-end is being ported from the Alexandria prototype.
> Simple project, no extra security.

### Stack

- Node.js
- TypeScript
- Express 5
- Sequelize + SQLite
- bcrypt (password hashing)
- Swagger (API docs at `/docs`)

> No JWT: login only validates email/password and returns the user.

### Requirements

- Node.js 18+
- npm

### How to run

Install dependencies (at project root):

```bash
npm install
```

Run the backend (at project root):

```bash
npm run dev -w backend
```

Or, inside the `backend` folder:

```bash
npm run dev
```

- Server: http://localhost:3000
- Swagger docs: http://localhost:3000/docs

### Enrollment (auto-generated)

The enrollment is **generated by the backend** using the `AAAA + NNNN` pattern
(4 digits of the year + 4 digits of the index), e.g. `20260087` is the 87th user
registered in 2026.

- The index is **global per year**, counting **every role** (the librarian is a
  reader with extra powers, so it takes part in the count).
- Any enrollment sent by the client is ignored — the system always generates a new one.
- Existing users with an out-of-pattern enrollment (e.g. `BIB-0001`) are normalized
  by the migration, using the year of their registration.

### Address (CEP required)

The **CEP is required for every user** (readers and librarian), as is the
**number**; the **complement** is optional.

- On registration the backend queries the public **ViaCEP** API
  (`https://viacep.com.br/ws/{cep}/json/`) and stores the full address in the
  `Enderecos` table (1:1 with `Users`).
- Street, district, city and state come from the lookup and are not editable by hand.
- An unknown CEP is rejected with the API error.
- Editing a user with a different CEP re-runs the lookup and updates the address.

### E-mail notifications

The system sends e-mails in three situations: the **temporary password** (when a
user is created without one), the **upcoming due date** (loan due within
`CRON_DUE_SOON_DAYS`, default 2 days) and the **overdue loan** (past the due
date and not returned yet).

The temporary password is **only delivered by e-mail** — it never comes back in
the API response nor shows up on screen.

Configure it in the `.env` file at the project root (see `.env.example`):
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`,
`EMAIL_REDIRECT_TO` (sends every notice to a single test e-mail), `CRON_HOUR`
(daily round, default `8`) and `CRON_DUE_SOON_DAYS` (default `2`).

- Without `SMTP_PASS` nothing is really sent: the e-mails are only printed in
  the console (log mode).
- The daily round is scheduled with `node-cron` (`0 CRON_HOUR * * *`) and can
  also be triggered on demand:

```bash
npm run notify -w backend
```

### Demo accounts

| Profile      | E-mail                  | Password   |
| ------------ | ----------------------- | ---------- |
| Librarian    | `admin@biblio.com`      | `admin123` |
| Reader       | `david.souza@email.com` | `leitor123`|

The login accepts **e-mail + password** only.

### Tables

| Table        | Content                                                          |
| ------------ | ---------------------------------------------------------------- |
| `Users`      | Users (readers and librarian)                                    |
| `Enderecos`  | Full address of each user (1:1)                                  |
| `Books`      | Collection                                                        |
| `emprestimos`| **Loans** — links book and user (`bookId` + `userId`)             |
| `Histories`  | **User history** — movements (`emprestar`, `devolver`, `renovar`)  |

The loan itself lives in `emprestimos` (with `bookId`, `userId`, due dates and
status). Every movement is recorded in `Histories` with the `acao` field, the
`emprestimoId` link and a snapshot of the loan at that moment.

### Access rules

- The **reader** can create their own account.
- The **reader** **cannot** edit or delete their own account.
- Only the **librarian** (identified by `admId` in the query string) can edit and delete users.
- The **user list** is restricted to the librarian — readers have no user management screen.
- Readers browse the collection (read-only) and their own loans (`?userId=`).

### Filters and pagination

Every listing uses the same envelope:

```json
{ "items": [...], "total": 42, "page": 1, "perPage": 8, "pages": 6 }
```

| Parameter | Applies to   | Values                                                             |
| --------- | ------------ | ------------------------------------------------------------------ |
| `q`       | search       | name/e-mail/matricula (users), title/author/ISBN (books), reader/book (loans) |
| `status`  | status filter | `active`/`inactive` (users), `available`/`loaned`/`out` (books), `active`/`overdue`/`returned` (loans) |
| `tipo`    | access role  | `leitor`/`bibliotecario` (also accepts `Administrador`/`Leitor`)    |
| `category`| books        | free text (`Romance`, `Fiction`, ...)                              |
| `userId`  | loans        | reader id                                                          |
| `page`    | current page | default `1`                                                        |
| `perPage` | items/page   | default `8`, max `100`                                             |

### Implemented endpoints

| Method | Route                                  | Description                                             |
| ------ | -------------------------------------- | ------------------------------------------------------- |
| POST   | `/api/leitor/register`                 | Reader creates their own account (CEP and number required) |
| POST   | `/api/leitor/login`                    | Login (validates email/password and returns the user)   |
| GET    | `/api/leitor?admId=`                   | Lists users (librarian only) with filters and paging    |
| POST   | `/api/leitor?admId=`                   | Creates a user (librarian only); the temporary password is emailed |
| GET    | `/api/leitor/cep/:cep`                 | Looks up a full address from a CEP (ViaCEP)             |
| GET    | `/api/leitor/:userId`                  | Fetches a user by ID                                    |
| PATCH  | `/api/leitor/:userId?admId=`           | Edits a user (librarian only)                           |
| DELETE | `/api/leitor/:userId?admId=`           | Deletes a user (librarian only)                         |
| GET    | `/api/livros`                          | Collection with search, filters and paging (open to readers) |
| GET    | `/api/livros/categorias`               | Collection categories with counts                       |
| GET    | `/api/livros/:bookId`                  | Fetches a book by ID                                    |
| GET    | `/api/livros/:bookId/history`          | Loan history of the book (with reader)                  |
| POST   | `/api/livros?admId=`                   | Creates a book (librarian only)                         |
| PATCH  | `/api/livros/:bookId?admId=`           | Updates a book (librarian only)                         |
| DELETE | `/api/livros/:bookId?admId=`           | Deletes a book (librarian only)                         |
| GET    | `/api/emprestimos?admId=`              | Loans with filters and paging (librarian only)          |
| GET    | `/api/emprestimos/me?userId=`          | Loans of the current reader                             |
| POST   | `/api/emprestimos?admId=`              | Registers a loan (librarian only)                       |
| POST   | `/api/emprestimos/:historyId/devolver?admId=` | Registers a return (librarian only)              |
| POST   | `/api/emprestimos/:historyId/renovar?admId=`  | Renews a loan (librarian only, max 2 renewals)   |
| GET    | `/api/dashboard/resumo?admId=`         | Librarian dashboard (stats, recent loans, categories)   |
| GET    | `/api/dashboard/leitor?userId=`        | Reader dashboard (my loans, alerts, available titles)   |

### Backend structure

```
backend/src
├── app.ts            # Express setup (CORS, JSON, Swagger, DB sync)
├── server.ts         # Server bootstrap (port 3000)
├── env.ts            # Loads environment variables (.env)
├── swagger.ts        # Swagger configuration
├── controllers/      # HTTP layer
├── services/         # Business rules
├── dto/              # Response serialization (API contract)
├── models/           # Sequelize models (User, Book, Endereco, Emprestimo, History)
├── routes/           # API routes
├── utils/            # Authorization, pagination, in-memory cache (TTL) and CEP lookup (ViaCEP)
├── database/         # Database connection (SQLite) and migrations
├── jobs/             # Daily notification scheduler (node-cron)
├── services/notify.service.ts # E-mail delivery (nodemailer)
├── scripts/          # Seed, migration and manual notification trigger
└── views/            # Static files
```

### Roadmap

- [x] Reader register and login
- [x] List/fetch users (with server-side filters and pagination)
- [x] Edit/delete user (librarian)
- [x] User creation by the librarian (with temporary password)
- [x] Collection CRUD (books, categories and loan history)
- [x] Loans: register, return and renew (`emprestimos` table)
- [x] Auto-generated enrollment (year + index) and required address via ViaCEP (`Enderecos` table)
- [x] Librarian and reader dashboards
- [ ] React front-end (in progress)
