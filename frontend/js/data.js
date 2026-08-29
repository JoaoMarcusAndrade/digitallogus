/* ============================================================
   BiblioGestor — Camada de Dados (protótipo, sem banco)
   Persistência em memória + localStorage
   ============================================================ */

const DB_KEY = 'bibliogestor_v1';

function uid(prefix) {
  return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/* ---------- Seed de dados ---------- */

function buildSeed() {
  const hoje = new Date(2026, 7, 27); // 27/ago/2026

  function diasAtraso(n) { const d = new Date(hoje); d.setDate(d.getDate() - n); return d; }
  function daqui(n) { const d = new Date(hoje); d.setDate(d.getDate() + n); return d; }

  const acervo = [
    { id: 'liv-01', titulo: 'Dom Casmurro', autor: 'Machado de Assis', isbn: '9788535910663',
      categoria: 'Romance', editora: 'Companhia das Letras', ano: 2016, localizacao: 'A1-01', capa: '#334155',
      exemplares: 3, exemplaresDisp: 1, adicionadoEm: diasAtraso(400) },
    { id: 'liv-02', titulo: 'O Cortiço', autor: 'Aluísio Azevedo', isbn: '9788572326997',
      categoria: 'Romance', editora: 'Martin Claret', ano: 2012, localizacao: 'A1-02', capa: '#475569',
      exemplares: 2, exemplaresDisp: 2, adicionadoEm: diasAtraso(380) },
    { id: 'liv-03', titulo: 'A Revolução dos Bichos', autor: 'George Orwell', isbn: '9788535909555',
      categoria: 'Ficção', editora: 'Companhia das Letras', ano: 2007, localizacao: 'A2-03', capa: '#64748b',
      exemplares: 4, exemplaresDisp: 0, adicionadoEm: diasAtraso(350) },
    { id: 'liv-04', titulo: '1984', autor: 'George Orwell', isbn: '9788535914845',
      categoria: 'Ficção', editora: 'Companhia das Letras', ano: 2021, localizacao: 'A2-04', capa: '#5b6472',
      exemplares: 2, exemplaresDisp: 2, adicionadoEm: diasAtraso(320) },
    { id: 'liv-05', titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', isbn: '9788595081512',
      categoria: 'Infantojuvenil', editora: 'HarperCollins', ano: 2018, localizacao: 'I1-01', capa: '#94a3b8',
      exemplares: 5, exemplaresDisp: 4, adicionadoEm: diasAtraso(300) },
    { id: 'liv-06', titulo: 'Sapiens: Uma Breve História da Humanidade', autor: 'Yuval Noah Harari', isbn: '9788525432186',
      categoria: 'História', editora: 'L&PM', ano: 2015, localizacao: 'H2-01', capa: '#42505f',
      exemplares: 2, exemplaresDisp: 1, adicionadoEm: diasAtraso(280) },
    { id: 'liv-07', titulo: 'O Alquimista', autor: 'Paulo Coelho', isbn: '9788501010539',
      categoria: 'Romance', editora: 'Sextante', ano: 2017, localizacao: 'A1-06', capa: '#75849a',
      exemplares: 3, exemplaresDisp: 3, adicionadoEm: diasAtraso(260) },
    { id: 'liv-08', titulo: 'A Metamorfose', autor: 'Franz Kafka', isbn: '9788535910526',
      categoria: 'Ficção', editora: 'Companhia das Letras', ano: 2011, localizacao: 'A2-08', capa: '#334155',
      exemplares: 2, exemplaresDisp: 0, adicionadoEm: diasAtraso(240) },
    { id: 'liv-09', titulo: 'Introdução à Programação em Python', autor: 'Nilo Ney Coutinho Menezes', isbn: '9788575227189',
      categoria: 'Técnico', editora: 'Novatec', ano: 2019, localizacao: 'T3-01', capa: '#475569',
      exemplares: 3, exemplaresDisp: 1, adicionadoEm: diasAtraso(220) },
    { id: 'liv-10', titulo: 'Estruturas de Dados e Algoritmos', autor: 'Jayme Luiz Szwarcfiter', isbn: '9788535288494',
      categoria: 'Técnico', editora: 'LTC', ano: 2018, localizacao: 'T3-04', capa: '#64748b',
      exemplares: 2, exemplaresDisp: 2, adicionadoEm: diasAtraso(200) },
    { id: 'liv-11', titulo: 'Cem Anos de Solidão', autor: 'Gabriel García Márquez', isbn: '9788501063098',
      categoria: 'Ficção', editora: 'Record', ano: 2009, localizacao: 'A2-11', capa: '#42505f',
      exemplares: 2, exemplaresDisp: 1, adicionadoEm: diasAtraso(180) },
    { id: 'liv-12', titulo: 'História da Filosofia Ocidental', autor: 'Bertrand Russell', isbn: '9788520466665',
      categoria: 'Filosofia', editora: 'Nova Fronteira', ano: 2015, localizacao: 'F1-02', capa: '#75849a',
      exemplares: 1, exemplaresDisp: 0, adicionadoEm: diasAtraso(160) }
  ];

  const usuarios = [
    { id: 'usr-01', nome: 'Mariana Souza', email: 'mariana.souza@email.com', telefone: '(11) 98765-4321',
      matricula: '2023001201', tipo: 'Aluno', vinculo: 'Engenharia de Software — 5º sem.', status: 'ativo',
      multa: 0, cadastradoEm: diasAtraso(300) },
    { id: 'usr-02', nome: 'Carlos Pereira', email: 'carlos.pereira@email.com', telefone: '(11) 99123-8877',
      matricula: '2024002331', tipo: 'Aluno', vinculo: 'Direito — 2º sem.', status: 'ativo',
      multa: 12.50, cadastradoEm: diasAtraso(270) },
    { id: 'usr-03', nome: 'Prof. Rita Almeida', email: 'rita.almeida@universidade.edu', telefone: '(11) 97410-2100',
      matricula: 'PROF-048', tipo: 'Professor', vinculo: 'Departamento de Letras', status: 'ativo',
      multa: 0, cadastradoEm: diasAtraso(540) },
    { id: 'usr-04', nome: 'João Batista', email: 'joao.batista@email.com', telefone: '(11) 99876-1122',
      matricula: '2025003312', tipo: 'Aluno', vinculo: 'Administração — 1º sem.', status: 'ativo',
      multa: 0, cadastradoEm: diasAtraso(120) },
    { id: 'usr-05', nome: 'Fernanda Lima', email: 'fernanda.lima@email.com', telefone: '(11) 98222-3344',
      matricula: '2022004520', tipo: 'Aluno', vinculo: 'Psicologia — 6º sem.', status: 'ativo',
      multa: 8.00, cadastradoEm: diasAtraso(420) },
    { id: 'usr-06', nome: 'Prof. Eduardo Rocha', email: 'eduardo.rocha@universidade.edu', telefone: '(11) 96111-5566',
      matricula: 'PROF-021', tipo: 'Professor', vinculo: 'Departamento de Computação', status: 'ativo',
      multa: 0, cadastradoEm: diasAtraso(390) },
    { id: 'usr-07', nome: 'Beatriz Nunes', email: 'beatriz.nunes@email.com', telefone: '(11) 91234-9900',
      matricula: '2024009876', tipo: 'Externo', vinculo: 'Membro da comunidade', status: 'inativo',
      multa: 4.50, cadastradoEm: diasAtraso(150) },
    { id: 'usr-08', nome: 'Rafael Mendes', email: 'rafael.mendes@email.com', telefone: '(11) 95555-7788',
      matricula: '2025002214', tipo: 'Aluno', vinculo: 'Engenharia Civil — 3º sem.', status: 'ativo',
      multa: 0, cadastradoEm: diasAtraso(60) }
  ];

  const emprestimos = [
    { id: 'emp-01', usuarioId: 'usr-01', livroId: 'liv-01', dataEmprestimo: diasAtraso(20), dataDevolucaoPrevista: diasAtraso(6),
      dataDevolucao: diasAtraso(5), renovacoes: 1, status: 'devolvido' },
    { id: 'emp-02', usuarioId: 'usr-02', livroId: 'liv-03', dataEmprestimo: diasAtraso(30), dataDevolucaoPrevista: diasAtraso(16),
      dataDevolucao: null, renovacoes: 0, status: 'atrasado' },
    { id: 'emp-03', usuarioId: 'usr-03', livroId: 'liv-09', dataEmprestimo: diasAtraso(8), dataDevolucaoPrevista: daqui(6),
      dataDevolucao: null, renovacoes: 0, status: 'ativo' },
    { id: 'emp-04', usuarioId: 'usr-05', livroId: 'liv-08', dataEmprestimo: diasAtraso(45), dataDevolucaoPrevista: diasAtraso(31),
      dataDevolucao: null, renovacoes: 1, status: 'atrasado' },
    { id: 'emp-05', usuarioId: 'usr-04', livroId: 'liv-12', dataEmprestimo: diasAtraso(12), dataDevolucaoPrevista: diasAtraso(2),
      dataDevolucao: null, renovacoes: 0, status: 'atrasado' },
    { id: 'emp-06', usuarioId: 'usr-06', livroId: 'liv-06', dataEmprestimo: diasAtraso(5), dataDevolucaoPrevista: daqui(9),
      dataDevolucao: null, renovacoes: 0, status: 'ativo' },
    { id: 'emp-07', usuarioId: 'usr-02', livroId: 'liv-11', dataEmprestimo: diasAtraso(15), dataDevolucaoPrevista: diasAtraso(1),
      dataDevolucao: null, renovacoes: 0, status: 'atrasado' },
    { id: 'emp-08', usuarioId: 'usr-01', livroId: 'liv-03', dataEmprestimo: diasAtraso(3), dataDevolucaoPrevista: daqui(11),
      dataDevolucao: null, renovacoes: 0, status: 'ativo' }
  ];

  return { acervo, usuarios, emprestimos };
}

/* ---------- Store (memória + localStorage) ---------- */

const Store = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { this.data = JSON.parse(raw); return; }
    } catch (e) { /* ignore */ }
    this.data = buildSeed();
    // Não persiste o seed automaticamente para o protótipo sempre abrir com dados "frescos".
    // Para persistir alterações, veja persist().
  },

  persist() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  reset() {
    localStorage.removeItem(DB_KEY);
    this.data = buildSeed();
    window.location.reload();
  },

  /* ----- acervo ----- */
  livros() { return this.data.acervo; },
  livro(id) { return this.data.acervo.find(l => l.id === id); },
  addLivro(l) { l.id = uid('liv-'); l.exemplaresDisp = l.exemplares; l.adicionadoEm = new Date(); this.data.acervo.unshift(l); this.persist(); },
  updateLivro(id, patch) {
    const l = this.livro(id);
    if (!l) return;
    const diff = patch.exemplares - l.exemplares;
    Object.assign(l, patch);
    l.exemplaresDisp = Math.max(0, l.exemplaresDisp + diff);
    this.persist();
  },
  removeLivro(id) {
    const emUso = this.data.emprestimos.some(e => e.livroId === id && e.status !== 'devolvido');
    if (emUso) return { ok: false, msg: 'Não é possível remover: há empréstimo ativo para este título.' };
    this.data.acervo = this.data.acervo.filter(l => l.id !== id);
    this.persist();
    return { ok: true };
  },

  /* ----- usuários ----- */
  usuarios() { return this.data.usuarios; },
  usuario(id) { return this.data.usuarios.find(u => u.id === id); },
  addUsuario(u) { u.id = uid('usr-'); u.multa = Number(u.multa) || 0; u.cadastradoEm = new Date(); this.data.usuarios.unshift(u); this.persist(); },
  updateUsuario(id, patch) { Object.assign(this.usuario(id), patch); this.persist(); },
  removeUsuario(id) {
    const emUso = this.data.emprestimos.some(e => e.usuarioId === id && e.status !== 'devolvido');
    if (emUso) return { ok: false, msg: 'Não é possível remover: o usuário possui empréstimo em aberto.' };
    this.data.usuarios = this.data.usuarios.filter(u => u.id !== id);
    this.persist();
    return { ok: true };
  },

  /* ----- empréstimos ----- */
  emprestimos() { return this.data.emprestimos; },
  emprestimo(id) { return this.data.emprestimos.find(e => e.id === id); },

  emprestar(usuarioId, livroId, dias = 14) {
    const u = this.usuario(usuarioId);
    const l = this.livro(livroId);
    if (!u || !l) return { ok: false, msg: 'Registro não encontrado.' };
    if (u.status === 'inativo') return { ok: false, msg: 'Usuário inativo não pode realizar empréstimos.' };
    if (l.exemplaresDisp <= 0) return { ok: false, msg: 'Não há exemplares disponíveis para este título.' };
    l.exemplaresDisp -= 1;
    const hoje = new Date();
    const prevista = new Date(); prevista.setDate(prevista.getDate() + dias);
    this.data.emprestimos.unshift({
      id: uid('emp-'), usuarioId, livroId,
      dataEmprestimo: hoje, dataDevolucaoPrevista: prevista,
      dataDevolucao: null, renovacoes: 0, status: 'ativo'
    });
    this.persist();
    return { ok: true };
  },

  devolver(id) {
    const e = this.emprestimo(id);
    if (!e || e.status === 'devolvido') return { ok: false, msg: 'Empréstimo já devolvido.' };
    e.dataDevolucao = new Date();
    e.status = 'devolvido';
    const l = this.livro(e.livroId);
    if (l) l.exemplaresDisp = Math.min(l.exemplares, l.exemplaresDisp + 1);
    this.persist();
    return { ok: true };
  },

  renovar(id) {
    const e = this.emprestimo(id);
    if (!e || e.status === 'devolvido') return { ok: false, msg: 'Registro inválido.' };
    if (e.renovacoes >= 2) return { ok: false, msg: 'Limite de 2 renovações atingido.' };
    e.renovacoes += 1;
    const p = new Date(e.dataDevolucaoPrevista); p.setDate(p.getDate() + 7);
    e.dataDevolucaoPrevista = p;
    // se estava atrasado, volta para ativo
    if (e.status === 'atrasado') e.status = 'ativo';
    this.persist();
    return { ok: true };
  },

  /* ----- helpers derivados ----- */
  emprestimosAtivos() {
    return this.data.emprestimos.filter(e => e.status !== 'devolvido');
  },
  emprestimosAtrasados() {
    return this.data.emprestimos.filter(e => e.status === 'atrasado' || (e.status === 'ativo' && new Date(e.dataDevolucaoPrevista) < new Date()));
  },
  totalExemplares() {
    return this.data.acervo.reduce((s, l) => s + l.exemplares, 0);
  },
  totalDisponiveis() {
    return this.data.acervo.reduce((s, l) => s + l.exemplaresDisp, 0);
  },
  usuariosAtivos() {
    return this.data.usuarios.filter(u => u.status === 'ativo').length;
  },
  receitaMultas() {
    return this.data.usuarios.reduce((s, u) => s + (Number(u.multa) || 0), 0);
  }
};

/* Exposição global (scripts carregados em ordem, sem módulos) */
window.Store = Store;
window.uid = uid;