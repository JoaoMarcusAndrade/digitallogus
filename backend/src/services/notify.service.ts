/**
 * Serviço de Notificações — envia e-mails de aviso (vencimento próximo e atraso)
 * usando nodemailer via SMTP.
 *
 * Em desenvolvimento, se SMTP_PASS não estiver preenchido, os "envios" são
 * apenas logados no console (não quebra o fluxo local).
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
const EMAIL_TO_TEST = process.env.EMAIL_TO_TEST || EMAIL_FROM;

// Modo teste: sem senha → não envia de verdade
const TEST_MODE = !SMTP_PASS;

function buildTransporter(): Transporter | null {
  if (TEST_MODE) {
    console.warn("[notify] SMTP_PASS ausente — rodando em MODO TESTE (sem envio real).");
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

/**
 * Destinatário real de um empréstimo.
 * Em modo de produção usa o e-mail do leitor; em teste usa EMAIL_TO_TEST.
 */
function recipientFor(loan: any): string {
  const readerEmail = loan?.leitor?.email;
  // Em teste direciona tudo para o e-mail de teste configurado
  return TEST_MODE ? EMAIL_TO_TEST : (readerEmail || EMAIL_TO_TEST);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

/**
 * Prepara e envia o e-mail de "devolução em breve".
 */
export async function sendDueSoon(loan: any): Promise<void> {
  const to = recipientFor(loan);
  const livro = loan?.livro?.title || "livro";
  const prevista = formatDate(loan?.dataDevolucaoPrevista || new Date());

  const subject = "BiblioGestor — Sua devolução está próxima";
  const text =
    `Olá, ${loan?.leitor?.name || "leitor(a)"}!\n\n` +
    `Lembrete: o livro "${livro}" deve ser devolvido em ${prevista}.\n` +
    `Se preferir, entre em contato para renovar o empréstimo.\n\n` +
    `BiblioGestor`;

  if (TEST_MODE) {
    console.log(`[notify][TESTE] Para: ${to} | Assunto: ${subject} | Livro: ${livro}`);
    return;
  }

  await transporter!.sendMail({ from: EMAIL_FROM, to, subject, text });
}

/**
 * Prepara e envia o e-mail de "devolução atrasada" (cobrança).
 */
export async function sendOverdue(loan: any): Promise<void> {
  const to = recipientFor(loan);
  const livro = loan?.livro?.title || "livro";
  const prevista = formatDate(loan?.dataDevolucaoPrevista || new Date());

  const subject = "BiblioGestor — Empréstimo atrasado";
  const text =
    `Olá, ${loan?.leitor?.name || "leitor(a)"}!\n\n` +
    `O livro "${livro}" está com a devolução atrasada desde ${prevista}.\n` +
    `Por favor, devolva-o à biblioteca o quanto antes ou regularize a situação.\n\n` +
    `BiblioGestor`;

  if (TEST_MODE) {
    console.log(`[notify][TESTE] Para: ${to} | Assunto: ${subject} | Livro: ${livro}`);
    return;
  }

  await transporter!.sendMail({ from: EMAIL_FROM, to, subject, text });
}
