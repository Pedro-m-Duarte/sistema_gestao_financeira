import bodyParser from 'body-parser';
import cors from 'cors';
import 'colors';
import connectSequelize from 'connect-session-sequelize';
import express from 'express';
import session from 'express-session';
import * as schedule from 'node-schedule';
import performance from 'performance-now';
import DBConnector, { setupDB } from './src/db/Connector';
import APIRouter from './src/routes/APIRouter';
import AuthRouter from './src/routes/AuthRouter';
import { AUTO_GENERATE_REPORTS, AUTO_GENERATE_REPORTS_TIME, BACKEND_PORT, ZABBIX_API_URL, ZABBIX_URL } from './env';
import { generateMonthlyReports } from './src/utils/ReportGenerator';
import ReportsRouter from './src/routes/ReportsRouter';
import LayoutsRouter from './src/routes/LayoutsRouter';
import PanelSettingsRouter from './src/routes/PanelSettingsRouter';
import UserPreferencesRouter from './src/routes/UserPreferencesRouter';
import GraphicsLayoutRouter from './src/routes/GraphicsLayoutRouter';

const app = express();
export const sequelizeStore = new (connectSequelize(session.Store))({
    db: DBConnector,
    tableName: "sessions",
    checkExpirationInterval: 1000 * 60 * 60, // A cada 1 hora verifica as sessões expiradas e as remove do banco, invalidando-as.
    expiration: 1000 * 60 * 60 * 24 * 90 // Uma sessão dura apróx. 3 meses. Após isso o usuário terá que logar novamente.
});

export const pr = {
    b: "[BACKEND]".blue,
    e: "[ERROR]".red,
    i: "[INFO]".green,
    w: "[WARN]".yellow
}

app.use(cors({ origin: "*" }));
app.use(
    session({
        secret: "RJKWEDSGOWU@*7482",
        saveUninitialized: false, // Forces a session that is “uninitialized” to be saved to the store
        resave: true, // Forces the session to be saved back to the session store, even if the session was never modified during the request
        store: sequelizeStore
    })
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Backend Routes - Start
app.use("/public", express.static(`${process.cwd()}/App/src/public`));

app.use("/", APIRouter);
app.use("/panelsettings", PanelSettingsRouter);
app.use("/userpreferences", UserPreferencesRouter);

app.use("/auth", AuthRouter);
app.use("/reports", ReportsRouter);
app.use("/layouts", LayoutsRouter);
app.use("/graphicLayouts", GraphicsLayoutRouter);
// Backend Routes - End

export const compatibilityVersion: string = '1.1.2';

const port = BACKEND_PORT;

app.listen(port, async () => {
    console.log(`${pr.b} Registrando rotinas...`)

    if (AUTO_GENERATE_REPORTS) {
        const autoGenerateReportsRotine = async () => {
            console.log(`${pr.i} Executando rotina de geração de relatórios mensal...`);
            try {
                const startTime = performance();
                await generateMonthlyReports();
                const endTime = performance();
                const elapsedTime = endTime - startTime;
                console.log(`${pr.i} Rotina de geração de relatórios mensal executada com sucesso!`);
                console.log(`(Levou ${formatElapsedTime(elapsedTime)})`);
            } catch (err) {
                console.error('Erro ao executar rotina de geração de relatórios mensal:', err);
            }
        }
        // Todo primeiro dia do mês, às 5h da manhã
        schedule.scheduleJob(AUTO_GENERATE_REPORTS_TIME, autoGenerateReportsRotine);
    } else {
        console.log(`${pr.w} Nenhuma rotina foi registrada pois não há nenhuma ativa no .env do backend.`);
    }

    console.log(`${pr.b} Preparando DB...`)
    await setupDB()

    console.log(`${pr.b} Servidor iniciado na porta ${port.toString().yellow}.`)
});

// Extras functions - Start
function formatElapsedTime(timeInMilliseconds: number): string {
    const hours = Math.floor(timeInMilliseconds / 3600000);
    const minutes = Math.floor((timeInMilliseconds % 3600000) / 60000);
    const seconds = Math.floor(((timeInMilliseconds % 3600000) % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

export const zabbixUrl: string = ZABBIX_URL; // URL direto do Zabbix (Necessário em alguns casos)
export const zabbixApiUrl: string = ZABBIX_API_URL;

declare module "express-session" {
    interface SessionData {
        user?: {
            userId: number;
            username: string;
            savedAuth: string;
            isZabbixAdmin: boolean
        }
    }
}
// Extras functions - End