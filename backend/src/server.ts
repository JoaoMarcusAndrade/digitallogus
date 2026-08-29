import "./env.js";
import { app } from './app.js'
import { startNotifyJob } from './jobs/notify.job.js'

const PORT = 3000

app.listen(PORT, () => {
    console.log("servidor rodando na porta http://localhost:3000");
    startNotifyJob();
});