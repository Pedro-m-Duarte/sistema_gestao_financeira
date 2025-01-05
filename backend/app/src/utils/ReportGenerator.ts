import axios from "axios";
import { pr, zabbixApiUrl } from "./../../server";
import { TimePeriods, generateReport } from "./ReporterUtils";
import PanelSettings from "../db/models/PanelSettings";
import { PanelSettingType } from "./PanelSettingsAdapter";
import { ZABBIX_SUPER_ADMIN_PASS, ZABBIX_SUPER_ADMIN_USER } from "./../../env";
import Report from "../db/models/Reports";

export async function generateMonthlyReports() {
    const deletedPastAutoReports = await Report.destroy({
        where: {
            user: null // null = relatórios automáticos
        }
    });
    console.log(`${pr.i} Preparando para gerar relatórios mensal: ${deletedPastAutoReports} relatórios automáticos passados foram deletados do banco para otimização. Prosseguindo rotina de criação de relatório mensal...`);

    const zabbixAuth = await axios.post(zabbixApiUrl, {
        jsonrpc: '2.0',
        method: 'user.login',
        params: {
            user: ZABBIX_SUPER_ADMIN_USER,
            password: ZABBIX_SUPER_ADMIN_PASS,
            userData: true,
        },
        id: 1,
        auth: null
    });
    const auth = zabbixAuth.data.result.sessionid;

    const serversResponse = await axios.post(zabbixApiUrl, {
        jsonrpc: '2.0',
        method: 'host.get',
        params: {
            output: [
                'hostid',
                'name'
            ],
            selectedInterfaces: [
                'interfaceid',
                'ip'
            ],
            selectParentTemplates: [
                'name'
            ],
            filter: {
                // Filtra apenas hosts que estão sendo monitorados (status 0)
                'status': '0'
            }
        },
        id: 2,
        auth: auth
    });
    const serversData = serversResponse.data.result;

    const settingData = await PanelSettings.findOne({
        where: {
            setting: Object.keys(PanelSettingType).find(k => PanelSettingType[k] === PanelSettingType.ServersToGenerateMonthlyReport)
        }
    });
    const excludedServers = JSON.parse(settingData.value) as string[];
    console.log(`${pr.i} Foram econtrados ${excludedServers.length} servidores na lista de servidores excluídos dos Relatórios Mensais Automáticos. Servidores excluídos:`, excludedServers);
    for (const s of serversData) {
        try {
            if (excludedServers.includes(s.name)) {
                console.log(`${pr.i} O servidor ${s.name} está na lista de servidores excluídos, pulando...`);
                continue;
            }
            console.log(`${pr.i} Gerando relatório para o servidor ${s.name}...`);
            await generateReport(
                auth, -1, s.hostid, TimePeriods.LastMonth, '-1', '-1', true
            );
            console.log(`${pr.i} Relatório gerado para o servidor ${s.name}!`);
        } catch (err) {
            console.error('Erro ao gerar relatório para o servidor', s.name, err);
        }
    }
}