/**
 * Script de disparo manual das notificações por e-mail.
 *
 * Executa a mesma rotina do cron diário (vencimento próximo + atraso), sob
 * demanda — útil para testar o envio sem esperar o horário agendado.
 *
 * Uso: npm run notify
 */

import "../env.js";
import "../models/index.js";
import { runNotifyJob } from "../jobs/notify.job.js";

runNotifyJob()
  .then(() => {
    console.log("[notify] Rodada manual concluída.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[notify] Falha na rodada manual:", error.message);
    process.exit(1);
  });
