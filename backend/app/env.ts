// Configurações do Backend do App Painel Titan (env)

export const BACKEND_PORT = 8008 // Porta que o Backend irá rodar.
export let BACKEND_AMBIENT = 'dev' // Ambiente de execução do Backend. Valores válidos: 'dev' | 'prod'. Marcar como dev no ambiente de produção pode causar problemas em dependências.

export const BACKEND_DB_HOST = '127.0.0.1' // IP de acesso (ou URL) ao banco de dados.
export const BACKEND_DB_PORT = 5432 // Porta de acesso ao banco de dados.
export const BACKNED_DB_DIALECT = 'postgres' // Dialeto do banco. Valores válidos: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle'.

export const BACKEND_DB_NAME = 'migrati' // Nome do banco de dados.
export const BACKEND_DB_USER = 'postgres' // Usuário de acesso ao banco de dados.
export const BACKEND_DB_PASS = 'tisoBU80' // Opcional; Deixe vazio caso não

export const ZABBIX_URL = 'https://titan.migrati.com.br'; // URL de acesso direto ao Zabbix. (Sem '/' no final)
export const ZABBIX_API_URL = 'https://titan.migrati.com.br/api_jsonrpc.php' // URL de acesso da API do Zabbix. (Sem '/' no final)
export const ZABBIX_SUPER_ADMIN_USER = 'mikael.peixoto' // Um usuário com permissões máximas no Zabbix. Necessário para gerar relatórios.
export const ZABBIX_SUPER_ADMIN_PASS = 'MigraMika#2022' // Senha do usuário acima.

export const AUTO_GENERATE_REPORTS = true // Se 'true', o sistema irá gerar relatórios mensais automaticamente.
export const AUTO_GENERATE_REPORTS_TIME = '0 3 1 * *' // Horário de execução (Cron Job) da rotina de geração de relatórios mensal. Se AUTO_GENERATE_REPORTS for 'false', este valor será ignorado.