/**
 * Utilitários de autorização.
 *
 * Este projeto usa um esquema simplificado (sem JWT): para ações de escrita
 * restritas ao bibliotecário, o cliente envia o ID do bibliotecário na query
 * string (`?admId=`). As funções abaixo validam se esse ID pertence a um
 * usuário com nível 'bibliotecario'.
 *
 * ATENÇÃO: por ser um mecanismo simples, qualquer pessoa que conheça o ID de
 * um bibliotecário consegue executar as ações restritas. Não use em produção
 * sem adicionar autenticação real (ex.: JWT).
 */

import User from "../models/User.js";

/**
 * Verifica se `admId` corresponde a um bibliotecário válido.
 * @param admId ID do suposto bibliotecário
 * @returns Instância do usuário bibliotecário
 * @throws Erro com mensagem e statusCode se não for bibliotecário válido
 */
export async function requireLibrarian(admId: number): Promise<User> {
  const admin = await User.findByPk(admId);

  if (!admin) {
    const error: any = new Error("Administrador não encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (admin.userLevel !== 'bibliotecario') {
    const error: any = new Error("Acesso negado: apenas bibliotecários podem realizar esta ação");
    error.statusCode = 403;
    throw error;
  }

  return admin;
}

/**
 * Cria o padrão de erro HTTP (com statusCode) usado nos serviços.
 */
export function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  return error;
}
