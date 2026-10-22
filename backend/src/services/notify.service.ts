/**
 * Serviço de Notificações — envia e-mails da biblioteca usando nodemailer via SMTP.
 *
 * E-mails enviados pelo sistema:
 *   - `sendSenhaProvisoria` — acesso à conta com a senha provisória;
 *   - `sendDueSoon`         — aviso de devolução próxima;
 *   - `sendOverdue`         — aviso de devolução atrasada.
 *
 * Dois modos de operação:
 *   1. SEM credencial (`SMTP_PASS` vazio): nada sai de verdade, os e-mails são
 *      apenas logados no console — o fluxo local não quebra.
 *   2. COM credencial: os e-mails são enviados de verdade. Se `EMAIL_REDIRECT_TO`
 *      estiver preenchido, TODOS os avisos vão para esse e-mail (útil para
 *      teste); caso contrário, cada aviso vai para o e-mail do leitor.
 */

import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

// Leitura das variáveis de ambiente
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = (process.env.SMTP_SECURE || "false") === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;
/** Quando preenchido, todos os avisos são redirecionados para este e-mail. */
const EMAIL_REDIRECT_TO = (process.env.EMAIL_REDIRECT_TO || "").trim();

/** Sem senha de SMTP: o envio real está desligado (apenas log). */
const MODO_LOG = !SMTP_PASS;

function buildTransporter(): Transporter | null {
  if (MODO_LOG) {
    console.warn("[notify] SMTP_PASS ausente — MODO LOG (nenhum e-mail é enviado de verdade).");
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

const transporter = buildTransporter();

if (!MODO_LOG && EMAIL_REDIRECT_TO) {
  console.log(`[notify] Redirecionando todos os avisos para ${EMAIL_REDIRECT_TO}.`);
}

/**
 * Destinatário de um aviso.
 * Com `EMAIL_REDIRECT_TO` configurado, tudo vai para esse e-mail;
 * caso contrário, vai para o e-mail real do leitor.
 */
function recipientFor(leitorEmail?: string | null): string {
  if (EMAIL_REDIRECT_TO) return EMAIL_REDIRECT_TO;
  return leitorEmail || EMAIL_FROM;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

/**
 * Envia um e-mail. Em modo log, apenas registra no console.
 * @returns `true` quando o e-mail foi realmente enviado.
 */
async function enviar(destinatario: string, assunto: string, texto: string): Promise<boolean> {
  if (MODO_LOG) {
    console.log(`[notify][LOG] Para: ${destinatario} | Assunto: ${assunto}\n${texto}`);
    return false;
  }

  await transporter!.sendMail({
    from: EMAIL_FROM,
    to: destinatario,
    subject: assunto,
    text: texto
  });

  console.log(`[notify] E-mail enviado para ${destinatario} (${assunto}).`);
  return true;
}

/**
 * E-mail de boas-vindas com a senha provisória da conta.
 * É o único canal de entrega da senha: ela não volta na resposta da API.
 */
export async function sendSenhaProvisoria(usuario: any, senha: string): Promise<boolean> {
  const destinatario = recipientFor(usuario?.email);
  const nome = usuario?.name || "leitor(a)";

  const assunto = "Alexandria — seu acesso à biblioteca";
  const texto =
    `Olá, ${nome}!\n\n` +
    `Sua conta na biblioteca Alexandria foi criada.\n\n` +
    `E-mail de login: ${usuario?.email || "—"}\n` +
    `Senha provisória: ${senha}\n\n` +
    `Use o e-mail acima para entrar no sistema. Por segurança, troque a senha\n` +
    `provisória no primeiro acesso.\n\n` +
    `Boas leituras!\n` +
    `Alexandria`;

  return enviar(destinatario, assunto, texto);
}

/**
 * Aviso de "devolução próxima" (o livro vence em poucos dias).
 */
export async function sendDueSoon(loan: any): Promise<boolean> {
  const destinatario = recipientFor(loan?.leitor?.email);
  const livro = loan?.livro?.title || "livro";
  const prevista = formatDate(loan?.dataDevolucaoPrevista || new Date());

  const assunto = "Alexandria — sua devolução está próxima";
  const texto =
    `Olá, ${loan?.leitor?.name || "leitor(a)"}!\n\n` +
    `Lembrete: o livro "${livro}" deve ser devolvido em ${prevista}.\n` +
    `Se preferir, entre em contato para renovar o empréstimo.\n\n` +
    `Alexandria`;

  return enviar(destinatario, assunto, texto);
}

/**
 * Aviso de "devolução atrasada" (cobrança).
 */
export async function sendOverdue(loan: any): Promise<boolean> {
  const destinatario = recipientFor(loan?.leitor?.email);
  const livro = loan?.livro?.title || "livro";
  const prevista = formatDate(loan?.dataDevolucaoPrevista || new Date());

  const assunto = "Alexandria — Empréstimo atrasado";
  const texto =
    `Olá, ${loan?.leitor?.name || "leitor(a)"}!\n\n` +
    `O livro "${livro}" está com a devolução atrasada desde ${prevista}.\n` +
    `Por favor, devolva-o à biblioteca o quanto antes ou regularize a situação.\n\n` +
    `Alexandria`;

  return enviar(destinatario, assunto, texto);
}
