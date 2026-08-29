/**
 * Agendador diário de notificações (cron).
 *
 * Roda uma vez por dia no horário configurado (CRON_HOUR, padrão 8h) e:
 *  1. Marca os empréstimos vencidos como 'atrasado' (markOverdue).
 *  2. Envia aviso de "devolva em breve" para empréstimos com vencimento
 *     dentro de CRON_DUE_SOON_DAYS dias.
 *  3. Envia aviso de "atraso" para empréstimos vencidos.
 */

import cron from "node-cron";
import {
  markOverdue,
  dueSoon,
  overdue
} from "../services/emprestimo.service.js";
import {
  sendDueSoon,
  sendOverdue
} from "../services/notify.service.js";

const CRON_HOUR = Number(process.env.CRON_HOUR || 8);
const DUE_SOON_DAYS = Number(process.env.CRON_DUE_SOON_DAYS || 2);

// Cron expression: minuto 0, hora configurada, todos os dias
const CRON_EXPRESSION = `0 ${CRON_HOUR} * * *`;

/**
 * Executa uma rodada de notificações (inclui o que o cron faz diariamente).
 * Exportado para permitir testes manuais (ex.: chamá-lo uma vez).
 */
export async function runNotifyJob(): Promise<void> {
  console.log(`[cron] Iniciando rodada de notificações (${new Date().toISOString()})`);

  // 1. Mantém os status consistentes: marca como atrasados
  await markOverdue();

  // 2. Aviso de vencimento próximo
  const soon = await dueSoon(DUE_SOON_DAYS);
  console.log(`[cron] ${soon.length} empréstimo(s) vencendo em breve.`);
  for (const loan of soon) {
    try {
      await sendDueSoon(loan);
    } catch (error: any) {
      console.error(`[cron] Falha ao notificar vencimento próximo: ${error.message}`);
    }
  }

  // 3. Aviso de atraso
  const late = await overdue();
  console.log(`[cron] ${late.length} empréstimo(s) atrasado(s).`);
  for (const loan of late) {
    try {
      await sendOverdue(loan);
    } catch (error: any) {
      console.error(`[cron] Falha ao notificar atraso: ${error.message}`);
    }
  }

  console.log(`[cron] Rodada concluída.`);
}

/**
 * Inicia o agendador diário. Deve ser chamado após o servidor subir.
 * Em TEST_MODE (sem SMTP_PASS) ainda agenda, mas apenas loga no console.
 */
export function startNotifyJob(): void {
  const registered = cron.schedule(CRON_EXPRESSION, () => {
    runNotifyJob().catch((error) =>
      console.error(`[cron] Erro na execução agendada: ${error.message}`)
    );
  });

  console.log(`[cron] Agendador ativo: diariamente às ${CRON_HOUR}:00 (${CRON_EXPRESSION})`);
  registered.start();
}
