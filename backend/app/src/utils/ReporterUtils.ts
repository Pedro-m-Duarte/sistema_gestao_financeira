import axios from 'axios';
import Report from '../db/models/Reports';
import superAgent from 'superagent';
import { CookieJar } from 'tough-cookie';
import * as puppeteer from 'puppeteer';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { zabbixApiUrl, zabbixUrl } from '../../server';
import { formatDateAsBRString } from './BackendUtils';
import { BACKEND_AMBIENT } from '../../env';

/**
 * You can pass -1 in [userId] to generate a report that will be available
 * to all users witch are Zabbix Admins (role ID 3).
 */
export async function generateReport(
    auth: string, userId: number, server: number, timePeriod: TimePeriods, customDateStart: string,
    customDateEnd: string, isToAutoGenerateComments: boolean
): Promise<ServerReport> {
    let periodSeconds = 0;
    switch (timePeriod) {
        case 'LastHour':
            periodSeconds = 3600;
            break;
        case 'LastDay':
            periodSeconds = 86400;
            break;
        case 'Last3Days':
            periodSeconds = 259200;
            break;
        case 'LastWeek':
            periodSeconds = 604800;
            break;
        case 'LastMonth':
            periodSeconds = 2678400;
            break;
        case 'LastYear':
            periodSeconds = 31536000;
            break;
        case 'PastMonth':
            periodSeconds = -1;
            break;
        case 'Custom':
            periodSeconds = -2;
            break;
    }
    const period = periodSeconds * 1000;
    const nowAsDate = new Date();

    const nowSeconds = Math.floor(nowAsDate.getTime() / 1000) - 3 * 60 * 60;
    const startSeconds = nowSeconds - periodSeconds;

    let startTime = new Date(startSeconds * 1000);
    let endTime = new Date(nowSeconds * 1000);

    if (periodSeconds === -1) {
        // Past Month
        const lastMonth = getLastMonth(new Date());
        startTime = lastMonth.start;
        endTime = lastMonth.end;
    } else if (periodSeconds === -2) {
        startTime = new Date(`${customDateStart} 00:00:00`);
        endTime = new Date(`${customDateEnd} 00:00:00`);
    }

    const data = await fetchGraphs(
        auth, server, convertDateTime(startTime), convertDateTime(endTime)
    );

    const generatedGraphs = await generateGraphsById(
        auth,
        server,
        data.map(item => item.graphid),
        data.map(item => item.gitems),
        data.map(item => item.name),
        userId, "", "",
        timePeriod, period, convertDateTime(startTime), convertDateTime(startTime), convertDateTime(endTime),
        startTime.getTime(), endTime.getTime(), isToAutoGenerateComments
    );

    return generatedGraphs;
}

export function convertDateTime(dateTime: Date): string {
    return dateTime.toISOString().slice(0, 19).replaceAll('T', '%20');
}

export function getLastMonth(datetime: Date): { start: Date; end: Date } {
    const firstDay = new Date(datetime);
    firstDay.setMonth(firstDay.getMonth() - 1);
    firstDay.setDate(1);

    const lastDay = new Date(firstDay);
    lastDay.setMonth(lastDay.getMonth() + 1);
    lastDay.setDate(0);

    const data = {
        start: firstDay,
        end: lastDay,
    };

    return data;
}

export async function fetchGraphs(auth: string, server: number, timeFrom: string, timeTill: string) {
    const rawGraphGet = await axios.post(`${zabbixApiUrl}/api_jsonrpc.php`, {
        jsonrpc: '2.0',
        method: 'graph.get',
        params: {
            output: 'extend',
            hostids: server,
            time_from: timeFrom,
            time_till: timeTill,
            selectGraphItems: [
                'itemid',
                'color',
                'drawtype',
                'sortorder',
                'yaxisside',
                'calc_fnc',
                'type',
                'periods_cnt'
            ],
            selectHosts: ['hostid', 'name'],
            selectTemplates: ['templateid', 'name'],
            selectItems: ['itemid', 'name', 'key_'],
            selectDiscoveryRule: ['itemid', 'name'],
            selectTriggers: ['triggerid', 'description', 'expression', 'priority', 'status']
        },
        auth: auth,
        id: 1
    });
    return rawGraphGet.data.result;
}

export enum TimePeriods {
    LastHour = 'LastHour',
    LastDay = 'LastDay',
    Last3Days = 'Last3Days',
    LastWeek = 'LastWeek',
    LastMonth = 'LastMonth',
    LastYear = 'LastYear',
    PastMonth = 'PastMonth',
    Custom = 'Custom',
}
export namespace TimePeriods {
    export function getDisplayName(timeperiod: TimePeriods): string {
        switch (timeperiod) {
            case TimePeriods.LastHour:
                return 'Última hora';
            case TimePeriods.LastDay:
                return 'Últimas 24 horas';
            case TimePeriods.Last3Days:
                return 'Últimos 3 dias';
            case TimePeriods.LastWeek:
                return 'Últimos 7 dias';
            case TimePeriods.LastMonth:
                return 'Últimos 30 dias';
            case TimePeriods.LastYear:
                return 'Últimos 365 dias';
            case TimePeriods.PastMonth:
                return 'Mês passado';
            case TimePeriods.Custom:
                return 'Personalizado';
            default:
                return 'Inválido';
        }
    }
}

interface ServerReportGraph {
    graphId: number,
    graphDisplay: string,
    graphDescription: string,
    graphImage: string, // Base64 image
}

export interface ServerReport {
    id: number,
    serverId: number,
    generatedAt: number,
    generatedTimePeriod: TimePeriods,
    userId: number | null,
    graphs: ServerReportGraph[]
}

/**
 * You can pass -1 in [userId] to generate a report that will be available
 * to all users witch are Zabbix Admins (role ID 3).
 */
export async function generateGraphsById(
    auth: string, serverId: number, graphIds: string[], graphItems: any[],
    graphDisplays: string[], userId: number, user: string, password: string,
    timePeriodEnum: TimePeriods, period: number, stime: string, from: string,
    to: string, realStartTime: number, realEndTime: number, isToGenerateAutoComments: boolean
): Promise<ServerReport> {
    /**
     * Todos os gráficos que começarem com uma das strings dessa array
     * não vão ir para a pré-visualização, nem para o relatório.
     */
    const excludedGrahps = [
        "Network traffic on",
        "SQL-Server Memory",
        "ODBC SQLServer: Memory"
    ];

    interface GraphDescription {
        itemNameStart: string,
        autoMessageModel: string
    }

    /**
     * Esta array possui as mensagens para cada Item Name.
     * Variáveis podem ser usadas nessas mensagens. Segue uma lista abaixo.
     * 
     * Variáveis disponíveis para uso geral (normalmente trabalhado com %, por exemplo uso de CPU ou Escritas Demoradas):
     * %average%
     * %min%
     * %max%
     * %first%
     * %last%
     * 
     * Variáveis disponíveis para disco (ou qualquer coisa que represente seu valor como Uso de Disco/GB):
     * %average_disk%
     * %min_disk%
     * %max_disk%
     * %first_disk%
     * %last_disk%
     * %increase_desc%
     */
    const graphsDescription: GraphDescription[] = [
        {
            itemNameStart: "Processor load",
            autoMessageModel: "A média de uso de processamento do servidor é de %average%, durante o período monitorado."
        },
        {
            itemNameStart: "CPU Idle time",
            autoMessageModel: "A média de utilização da CPU é de %average%, durante o período monitorado."
        },
        {
            itemNameStart: "Free memory",
            autoMessageModel: "Manteve uma média de %average_disk% de memória disponível, durante o período monitorado."
        },
        {
            itemNameStart: "Used disk space on",
            autoMessageModel: "%increase_desc% durante o período monitorado."
        },
        {
            itemNameStart: "Used memory",
            autoMessageModel: "O servidor manteve uma média de %average_disk% de memória utilizada durante o período monitorado."
        },
        {
            itemNameStart: "SQL: % Processor Time",
            autoMessageModel: "A média de utilização do processador do SQL Server é de %average%% durante o período monitorado. Nota-se que os picos mais elevados ocorrem normalmente durante a execução de backups."
        },
        {
            itemNameStart: "SQL: Buffer Cache",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "SQL: Data File Size",
            autoMessageModel: "O crescimento do banco de dados foi de %first_disk% para %last_disk% durante o período monitorado. A média foi de %average_disk%. %increase_desc%."
        },
        {
            itemNameStart: "SQL: Databases",
            autoMessageModel: "%increase_desc% durante o período monitorado."
        },
        {
            itemNameStart: "SQL: Lazy writes",
            autoMessageModel: "Manteve uma média de %average% escritas demoradas no SQL Server durante o período monitorado."
        },
        {
            itemNameStart: "SQL: Quantidade de Usuários conectados",
            autoMessageModel: "Manteve uma média de %average% usuários conectados durante o período monitorado."
        },
        {
            itemNameStart: "SQL: Transactions per second",
            autoMessageModel: "Manteve uma média de %average% transações por segundo durante o período monitorado."
        },
        {
            itemNameStart: "ODBC SQLServer: % Processor Time",
            autoMessageModel: "A média de utilização do processador do SQL Server é de %average%% durante o período monitorado. Nota-se que os picos mais elevados ocorrem normalmente durante a execução de backups."
        },
        {
            itemNameStart: "ODBC SQLServer: Buffer Cache",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "ODBC SQLServer: Data File Size",
            autoMessageModel: "O crescimento do banco de dados foi de %first_disk% para %last_disk% durante o período monitorado. A média foi de %average_disk%. %increase_desc%."
        },
        {
            itemNameStart: "ODBC SQLServer: Databases",
            autoMessageModel: "%increase_desc% durante o período monitorado."
        },
        {
            itemNameStart: "ODBC SQLServer: Lazy writes",
            autoMessageModel: "Manteve uma média de %average% escritas demoradas no SQL Server durante o período monitorado."
        },
        {
            itemNameStart: "ODBC SQLServer: Quantidade de Usuários conectados",
            autoMessageModel: "Manteve uma média de %average% usuários conectados durante o período monitorado."
        },
        {
            itemNameStart: "ODBC SQLServer: Transactions per second",
            autoMessageModel: "Manteve uma média de %average% transações por segundo durante o período monitorado."
        },
        {
            itemNameStart: "PostgreSQL: Cache hit ratio",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "PostgreSQL: Idle Connections",
            autoMessageModel: "A média de conexões inativas (idle connections) foi de %average% durante o período monitorado."
        },
        {
            itemNameStart: "ODBC PostgreSQL: Cache hit ratio",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "ODBC PostgreSQL: Idle Connections",
            autoMessageModel: "A média de conexões inativas (idle connections) foi de %average% durante o período monitorado."
        },
        {
            itemNameStart: "Oracle: Instance Ativa e aberta",
            autoMessageModel: "O banco de dados ficou disponível para uso em %average_visible_percent% do período monitorado."
        },
        {
            itemNameStart: "Oracle: Processes",
            autoMessageModel: "A média de processos é de %average%."
        },
        {
            itemNameStart: "Oracle: Read Cache hit ratio",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "Oracle: Tamanho usado na Tablespace",
            autoMessageModel: "%increase_desc% durante o período monitorado."
        },
        {
            itemNameStart: "ODBC Oracle: Instance Ativa e aberta",
            autoMessageModel: "O banco de dados ficou disponível para uso em %average_visible_percent%% do período monitorado."
        },
        {
            itemNameStart: "ODBC Oracle: Processes",
            autoMessageModel: "A média de processos é de %average%."
        },
        {
            itemNameStart: "ODBC Oracle: Read Cache hit ratio",
            autoMessageModel: "O índice de acertos de consultas no cache do dicionário está com uma média de %average%%. O ideal é manter acima de 90%."
        },
        {
            itemNameStart: "ODBC Oracle: Tamanho usado na Tablespace",
            autoMessageModel: "%increase_desc% durante o período monitorado."
        }
    ];

    const finalGraphs: ServerReportGraph[] = [];

    const agent = superAgent.agent();
    const cookieJar = new CookieJar();

    const post = await agent.post(`${zabbixUrl}/index.php`)
        .type('form')
        .send({
            name: "mikael.peixoto",
            password: "MigraMika#2022",
            enter: 'Sign+in'
        });
    const cookies = post.headers['set-cookie'];

    cookies.forEach((cookie: any) => {
        cookieJar.setCookie(cookie, zabbixUrl, (err: any, cookie: any) => {
            if (err) {
                console.error(err)
            }
        })
    })

    const itemsRawResult = await axios.post(zabbixApiUrl, {
        jsonrpc: '2.0',
        method: 'item.get',
        params: {
            output: 'extend',
            itemids: graphItems.reduce((acc, graph) => {
                // Mapeia os itemIds do gráfico atual e concatena com o acumulador.
                return acc.concat(graph.map((item) => item.itemid));
            }, []),
            selectHosts: 'extend',
        },
        auth: auth,
        id: 1
    });
    const itemsResult = itemsRawResult.data.result;

    for (let graphIndex = 0; graphIndex < graphIds.length; graphIndex++) {
        const graphId = graphIds[graphIndex];
        let shouldIgnore = false;

        for (const excludedGraph of excludedGrahps) {
            if (graphDisplays[graphIndex].startsWith(excludedGraph)) {
                shouldIgnore = true;
                break;
            }
        }
        if (shouldIgnore) continue;

        // Make the request to get the image data
        const responseRawGraphImage = await agent
            .get(`${zabbixUrl}/chart2.php?graphid=${graphId}&profileIdx=web.graphs.filter&width=750&height=150&period=${period}&stime=${stime}&from=${from}&to=${to}&isNow=`)
            .set('Cookie', cookieJar.getCookieStringSync(zabbixUrl));
        const responseGraphImage = Buffer.from(responseRawGraphImage.body, 'binary').toString('base64');

        let finalDescription = 'Nada a relatar.';
        if (isToGenerateAutoComments) {
            // Obter ItemIDs do gráfico atual.
            const itemIds: string[] = graphItems[graphIndex].map((item) => item.itemid);

            const averageValues: Record<string, number> = {};
            const minValues: Record<string, number | null> = {};
            const maxValues: Record<string, number | null> = {};
            const firstValues: Record<string, number | null> = {};
            const lastValues: Record<string, number | null> = {};

            for (const itemId of itemIds) {
                const item = itemsResult.find(item => item.itemid == itemId);
                const itemName = item.name;

                let foundKey: string | null = null;
                for (const graphDesc of graphsDescription) {
                    if (itemName.startsWith(graphDesc.itemNameStart)) {
                        foundKey = graphDesc.itemNameStart;
                        break;
                    }
                }

                if (foundKey !== null) {
                    const graph = graphsDescription.find((g) => g.itemNameStart === foundKey);
                    if (graph) {
                        finalDescription = graph.autoMessageModel;
                    }
                }

                const trendRawResult = await axios.post(zabbixApiUrl, {
                    jsonrpc: '2.0',
                    method: 'trend.get',
                    params: {
                        output: 'extend',
                        itemids: [itemId],
                        time_from: `${realStartTime / 1000}`,
                        time_till: `${realEndTime / 1000}`,
                    },
                    auth: auth,
                    id: 2,
                });
                const trendResult = trendRawResult.data.result;

                let valueSum = 0;
                let valueCount = 0;
                let minValue: number | null = null;
                let maxValue: number | null = null;

                for (const result of trendResult) {
                    if (result.value_avg) {
                        const value = Number(result.value_avg);
                        valueSum += value;
                        valueCount++;

                        // Atualizar valor mínimo.
                        if (!minValue || value < minValue) {
                            minValue = value;
                        }

                        // Atualizar valor máximo.
                        if (!maxValue || value > maxValue) {
                            maxValue = value;
                        }
                    }
                }

                if (valueCount > 0) {
                    const average = valueSum / valueCount;
                    averageValues[itemId] = average;
                    minValues[itemId] = minValue;
                    maxValues[itemId] = maxValue;

                    const trendResults = trendResult || [];
                    const firstValue = trendResults.length > 0 ? trendResults[0].value_avg : null;
                    const lastValue = trendResults.length > 0 ? trendResults[trendResults.length - 1].value_avg : null;
                    firstValues[itemId] = firstValue;
                    lastValues[itemId] = lastValue;
                } else {
                    averageValues[itemId] = null;
                    minValues[itemId] = null;
                    maxValues[itemId] = null;
                    firstValues[itemId] = null;
                    lastValues[itemId] = null;
                }

                try {
                    if (averageValues[itemId]) {
                        finalDescription = finalDescription.replace('%average%', `${averageValues[itemId].toFixed(2)}`);
                        finalDescription = finalDescription.replace('%average_visible_percent%', (averageValues[itemId] as number * 100).toFixed(0).toString() + "%");
                        finalDescription = finalDescription.replace('%average_disk%', (Number(averageValues[itemId]) / Math.pow(1024, 3)).toFixed(2) + " Gb");
                    }
                    if (minValues[itemId]) {
                        finalDescription = finalDescription.replace('%min%', minValues[itemId].toString());
                        finalDescription = finalDescription.replace('%min_disk%', (minValues[itemId] as number / Math.pow(1024, 3)).toFixed(2) + " Gb");
                    }
                    if (maxValues[itemId]) {
                        finalDescription = finalDescription.replace('%max%', maxValues[itemId].toString());
                        finalDescription = finalDescription.replace('%max_disk%', (maxValues[itemId] as number / Math.pow(1024, 3)).toFixed(2) + " Gb");
                    }
                    if (firstValues[itemId]) {
                        finalDescription = finalDescription.replace('%first%', firstValues[itemId].toString());
                        finalDescription = finalDescription.replace('%first_disk%', (firstValues[itemId] as number / Math.pow(1024, 3)).toFixed(2) + " Gb");
                    }
                    if (lastValues[itemId]) {
                        finalDescription = finalDescription.replace('%last%', lastValues[itemId].toString());
                        finalDescription = finalDescription.replace('%last_disk%', (lastValues[itemId] as number / Math.pow(1024, 3)).toFixed(2) + " Gb");
                    }
                    if (firstValues[itemId] && lastValues[itemId]) {
                        const difference = ((firstValues[itemId] as number) < (lastValues[itemId] as number))
                            ? (lastValues[itemId] as number - firstValues[itemId] as number)
                            : (firstValues[itemId] as number - lastValues[itemId] as number);
                        const increaseDesc = (difference >= Math.pow(1024, 3))
                            ? (((firstValues[itemId] as number) < (lastValues[itemId] as number))
                                ? "Houve um aumento de "
                                : "Houve um decréscimo de ") + (difference / Math.pow(1024, 3)).toFixed(2) + " Gb"
                            : "Não houve mudanças consideráveis";
                        finalDescription = finalDescription.replace('%increase_desc%', increaseDesc);
                    }
                } catch (err) {
                    // finalDescription = "Não foi possível gerar automaticamente uma descrição para este gráfico."
                }

                if (finalDescription !== 'Nada a relatar.') break; // Já encontrou uma descrição para o gráfico.
            }
        }

        finalGraphs.push({
            graphId: Number(graphId),
            graphDisplay: graphDisplays[graphIndex],
            graphDescription: finalDescription,
            graphImage: responseGraphImage,
        });
    }

    const reportData = await Report.create({
        serverId: serverId,
        generatedAt: Date.now(),
        generatedTimePeriod: timePeriodEnum,
        data: JSON.stringify({
            serverId: serverId,
            generatedAt: Date.now(),
            generatedTimePeriod: timePeriodEnum,
            userId: userId === -1 ? null : userId,
            graphs: finalGraphs
        }),
        userId: userId === -1 ? null : userId
    });
    const finalReport: ServerReport = {
        id: reportData.id,
        serverId: serverId,
        generatedAt: reportData.generatedAt,
        generatedTimePeriod: timePeriodEnum,
        userId: userId === -1 ? null : userId,
        graphs: finalGraphs
    };

    return finalReport;
}

const base64MigraTILogo = "data:image/png;base64,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"
async function generateHtmlContent(report: ServerReport, finalConclusion: string, auth: string): Promise<string> {
    const generateGraphPage = (graph1: ServerReportGraph, graph2?: ServerReportGraph): string => {
        return `
        <div class='page-block'>
        <div class='graph-block'>
            <h2 class='graph-title'>${graph1.graphDisplay}</h2>
            <img class='graph-image' src="data:image/png;base64,${graph1.graphImage}" />
            <p class='graph-description'>${graph1.graphDescription.replace(/\n/g, '<br/>')}</p>
        </div>
        
        ${graph2 ? `
            <div class='graph-block graph-block-2'>
                <h2 class='graph-title'>${graph2.graphDisplay}</h2>
                <img class='graph-image' src="data:image/png;base64,${graph2.graphImage}" />
                <p class='graph-description'>${graph2.graphDescription.replace(/\n/g, '<br/>')}</p>
            </div>
        ` : ''}
    </div>
        `;
    };

    const graphPages = [];
    for (let i = 0; i < report.graphs.length; i += 2) {
        const graph1 = report.graphs[i];
        const graph2 = report.graphs[i + 1];
        graphPages.push(generateGraphPage(graph1, graph2));
    }

    const serverItemRawResult = await axios.post(zabbixApiUrl, {
        jsonrpc: '2.0',
        method: 'host.get',
        params: {
            output: ['name'],
            hostids: [report.serverId],
        },
        auth: auth,
        id: 1
    });
    const serverItemResult = serverItemRawResult.data.result;

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                </style>
            </head>
            <body>
                <div class='introduction-page'>
                    <img class='migrati-logo' src="${base64MigraTILogo}" />
                    <h1 class='introduction-title' >Relatório do Servidor: <br/>${serverItemResult[0].name}</h1>
                </div>
        
                ${graphPages.join('')}

                <div class='conclusion-page'>
                    <h1 class='conclusion-title'>Conclusão Geral</h1>
                    <p class='conclusion-text'>${finalConclusion.replace(/\n/g, '<br/>')}</p>
                </div>
            </body>
        </html>
    `;
}

export async function exportReportAsRawFile(report: ServerReport, finalConclusion: string, auth: string): Promise<Uint8Array> {
    return new Promise<Uint8Array>(async (resolve, reject) => {
        const htmlContent = await generateHtmlContent(report, finalConclusion, auth);

        const launchOptions: puppeteer.PuppeteerLaunchOptions = {};
        if (BACKEND_AMBIENT !== 'dev') { // Se estiver em ambiente de produção ('prod'), use o Chromium do sistema. (Testado no Ubuntu mais recente em mar. 2024)
            launchOptions['executablePath'] = '/usr/bin/chromium-browser';
            launchOptions['args'] = ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'];
        }
        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        try {
            await page.setContent(htmlContent);
            await page.addStyleTag({
                path: '../backend/app/src/utils/assets/reportpdf.css'
            });

            const buffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '0.5in', // Ajuste conforme necessário
                    bottom: '0.5in',
                    left: '0.5in',
                    right: '0.5in'
                },
                preferCSSPageSize: true,
                printBackground: true
            });

            const uint8Array = new Uint8Array(buffer);
            resolve(uint8Array);
        } catch (err) {
            reject(err);
        } finally {
            await browser.close();
        }
    });
}

export async function sendReportToEmail(mailsTo: string[], report: ServerReport, attachment: Buffer, auth: string): Promise<boolean> {
    const transporter = nodemailer.createTransport({
        host: 'smtp.terra.com.br',
        port: 587,
        secure: false, // Defina para true se estiver usando SSL
        auth: {
            user: 'migrati@terra.com.br',
            pass: 'MigraMail#2020',
        },
    });

    const serverItemRawResult = await axios.post(zabbixApiUrl, {
        jsonrpc: '2.0',
        method: 'host.get',
        params: {
            output: ['name'],
            hostids: [report.serverId],
        },
        auth: auth,
        id: 1
    });
    const serverItemResult = serverItemRawResult.data.result;

    const mailOptions: Mail.Options = {
        from: {
            address: 'migrati@terra.com.br',
            name: 'Equipe de Monitoramento MigraTI',
        },
        to: mailsTo,
        subject: `MigraTI - Relatório gerencial do servidor ${serverItemResult[0].name}`,
        html: `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Relatório Gerencial MigraTI</title>
                </head>
                <body>
                    Olá, <br>
                    Segue em anexo o relatório de monitoramento do servidor do cliente ${serverItemResult[0].name}.
                    <br> <br>
                    ID do relatório: #${report.id} <br>
                    Gerado em: ${formatDateAsBRString(report.generatedAt, true)} <br>
                    Período de tempo: ${TimePeriods.getDisplayName(report.generatedTimePeriod)}
                    <br> <br>
                    Atenciosamente, Equipe de Monitoramento da MigraTI.
                    <br>
                    <img id="migrati_logo" src="https://i.imgur.com/Ig2WASx.png" alt="10px" />
                </body>
            </html>
        `,
        attachments: [{
            filename: `report_server_${serverItemResult[0].name}_reportid_${report.id}.pdf`, // Nome do anexo
            content: attachment, // Dados do anexo (assumindo que é um PDF) // Buffer.from(await attachment.arrayBuffer())
        }],
    };

    // Enviar e-mail
    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.log('Erro ao enviar e-mail: ', err);
        return false;
    }
}