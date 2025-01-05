// src/components/templates/DashSQL.tsx
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactGridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import '../../css/Templates.css'; // CSS usado em todas as páginas de template
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DiskSquare from '../paneltypes/DiskSquare';
import Swal from 'sweetalert2';
import axios from 'axios';
import { zabbixApiUrl } from '../../App';
import { isEqual } from 'lodash';
import CustomChart, { CustomChartData } from '../paneltypes/CustomChart';
import { DashboardPageProps } from './DashDefault';
import { generatePastelColor } from '../../FrontendUtils';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Template renderizado para servidores do tipo 'SQLSERVER'.
 */
const DashSQL: React.FC<DashboardPageProps> = ({
    FetchServersFromZabbix,
    selectedServer,
    selectedServerName,
    isFullScreen,
    toggleFullScreen,
    intervalRef,
    selectedLayout
}) => {
    // Define o título da página
    document.title = "Painel Titan | Monitoramento (SQLServer)";

    const initialLayouts: ReactGridLayout.Layout[] = selectedLayout ? selectedLayout.layout : [
        { i: '1', x: 0, y: 0, w: 2, h: 2 }
    ]

    // Define o estado para os layouts
    const [layouts, setLayouts] = useState<ReactGridLayout.Layout[]>(initialLayouts);

    // Configuração do alerta de atualização de dados
    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    // Estado para a altura da gauge
    const [gaugeHeight, setGaugeHeight] = useState(0);

    // Lista de discos que nunca devem aparecer
    const excludedDisks = ['Free disk space on /boot : (%)'];

    // Estado para os itens de disco
    const [diskItems, setDiskItems] = useState<any[]>([]);

    // Estado para os valores de disco
    const [diskValues, setDiskValues] = useState<{ [key: string]: number }>({});

    // Estados e funções para os indicadores de desempenho SQL
    const [sqlProcessorTimeItem, setSqlProcessorTimeItem] = useState<string | null>(null);
    const [sqlProcessorTime, setSqlProcessorTime] = useState(0);

    const [sqlUsedMemoryInSqlServerItem, setSqlUsedMemoryInSqlServerItem] = useState<string | null>(null);
    const [sqlUsedMemoryInSqlServer, setSqlUsedMemoryInSqlServer] = useState(0);

    const [sqlBufferCacheHitRatioItem, setSqlBufferCacheHitRatioItem] = useState<string | null>(null);
    const [sqlBufferCacheHitRatio, setSqlBufferCacheHitRatio] = useState(0);


    const [sqlTransactionsPerSecond, setSqlTransactionsPerSecond] = useState<CustomChartData | null>(null);

    const [sqlMemoryDatas, setSqlMemoryDatas] = useState<(CustomChartData | null)[]>([]);

    const [sqlConnectedUsers, setSqlConnectedUsers] = useState<CustomChartData | null>(null); // Incompleto! Item inválido!

    const [sqlDeadLocks, setSqlDeadLocks] = useState<CustomChartData | null>(null); // Incompleto!

    // Função para atualizar o painel
    async function updatePanel(ignoreServers: boolean) {
        try {
            UpdatingDataAlert.fire({
                toast: true,
                position: 'top-end',
                customClass: {
                    container: isFullScreen ? 'loading-custom-swal-fullscreen' : 'loading-custom-swal',
                },
                title: undefined,
                width: 'auto',
            });
            UpdatingDataAlert.showLoading();

            if (!ignoreServers) {
                await FetchServersFromZabbix();
            }

            const requestData = {
                jsonrpc: '2.0',
                method: 'item.get',
                params: {
                    output: ["hostid", "name", "itemid"],
                    hostids: [selectedServer],
                },
                id: 1,
                auth: sessionStorage.getItem('session_token')
            };

            // Faz a requisição para a API do Zabbix
            const response = await axios.post(zabbixApiUrl, requestData);
            const data = response.data.result;

            // Extrair e formatar as opções da resposta filtrada
            const hostsData = data.map((item: { hostid: string, name: string, itemid: string }) => ({
                hostid: item.hostid,
                name: item.name,
                itemid: item.itemid
            }));
            const disksFilteredData = hostsData.filter((item: {
                name: string
            }) => !excludedDisks.includes(item.name) && item.name.startsWith("Free disk space on") && item.name.endsWith("(%)"));

            // Gauges (PanelType: DiskSquare)
            await loadAndSetDiskValues(disksFilteredData);
            setDiskItems(disksFilteredData);
            await loadAndSetSqlProcessorTime(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": % Processor Time"))[0]);
            await loadAndSetSqlUsedMemoryInSqlServer(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": % Memória usado no SQL-Server"))[0]);
            await loadAndSetSqlBufferCacheHitRatio(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": Buffer Cache"))[0]);

            // Charts (PanelType: CustomChart)
            await loadAndSetSqlTransactionsPerSecond(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": Transactions per second"))[0]);
            await loadAndSetSqlMemory(hostsData.filter((item: { name: string }) => item.name.endsWith(" memory")));
            await loadAndSetSqlConnectedUsers(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": QtdConnections"))[0]);
            await loadAndSetSqlDeadLocks(hostsData.filter((item: {
                name: string
            }) => item.name.endsWith(": DeadLock"))[0]);
            UpdatingDataAlert.close();
        } catch (error) {
            UpdatingDataAlert.close();
            console.error('Erro ao buscar itens da API do Zabbix:', error);
        }
    }

    async function loadAndSetDiskValues(hostsData: any) {
        const newPanelValues: { [key: string]: number } = {};
        for (const item of hostsData) {
            const requestData = {
                jsonrpc: '2.0',
                method: 'history.get',
                params: {
                    output: ["value"],
                    history: 0,
                    hostids: [item.hostid],
                    itemids: [item.itemid],
                    sortfield: 'clock',
                    sortorder: 'DESC',
                    limit: 1
                },
                id: 2,
                auth: sessionStorage.getItem('session_token')
            };

            try {
                const response = await axios.post(zabbixApiUrl, requestData);

                if (response.data.result) {
                    const value = parseFloat(response.data.result[0].value || '0');
                    newPanelValues[item.itemid] = value; // Usar itemid como chave
                } else {
                    console.warn('Nenhum dado encontrado para o item:', item);
                }
            } catch (error) {
                console.error('Erro ao pegar os valores dos discos:', error);
            }
        }

        setDiskValues(newPanelValues);
    };

    async function loadAndSetSqlProcessorTime(hostData: any | null | undefined) {
        if (!hostData) return
        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value"],
                // history: 3, // O history type deve ser deixado como indefinido para a API trazer os dados neste caso.
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                sortfield: 'clock',
                sortorder: 'DESC',
                limit: 1
            },
            id: 3,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            setSqlProcessorTimeItem(hostData.name);
            if (response.data.result) {
                const value = parseFloat(response.data.result[0].value || '0');
                setSqlProcessorTime(value);
            } else {
                console.warn('Nenhum dado encontrado para o item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    async function loadAndSetSqlUsedMemoryInSqlServer(hostData: any | null | undefined) {
        if (!hostData) return
        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value"],
                // history: 3, // O history type deve ser deixado como indefinido para a API trazer os dados neste caso.
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                sortfield: 'clock',
                sortorder: 'DESC',
                limit: 1
            },
            id: 4,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            setSqlUsedMemoryInSqlServerItem(hostData.name);
            if (response.data.result) {
                const value = parseFloat(response.data.result[0].value || '0');
                setSqlUsedMemoryInSqlServer(value);
            } else {
                console.warn('Nenhum dado encontrado para o item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    async function loadAndSetSqlBufferCacheHitRatio(hostData: any | null | undefined) {
        if (!hostData) return
        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value"],
                history: 0,
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                sortfield: 'clock',
                sortorder: 'DESC',
                limit: 1
            },
            id: 5,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            setSqlBufferCacheHitRatioItem(hostData.name);
            if (response.data.result) {
                const value = parseFloat(response.data.result[0].value || '0');
                setSqlBufferCacheHitRatio(value);
            } else {
                console.warn('Nenhum dado encontrado para o item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    async function loadAndSetSqlTransactionsPerSecond(hostData: any | null | undefined) {
        if (!hostData) return;
        const nowInSeconds = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        const fromPeriodInSeconds = nowInSeconds - (3 * 60 * 60); // Subtract 3 hours in seconds

        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value", "clock"],
                history: 0,
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                time_from: fromPeriodInSeconds,
                time_till: nowInSeconds,
                sortfield: 'clock',
                sortorder: 'ASC',
            },
            id: 6,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            if (response.data.result) {
                const apiData = response.data.result;

                // Process API data to create CustomChartData
                const labels: string[] = [];
                const datasets: {
                    label: string;
                    data: number[];
                    backgroundColor: string;
                    fill: boolean;
                }[] = [
                        {
                            label: hostData.name,
                            data: [],
                            backgroundColor: 'rgba(0, 200, 0, 0.3)',
                            fill: true,
                        }
                    ];

                let maxTransactionCount = 0;

                apiData.forEach((item: any, index: number) => {
                    // Convert "clock" to hours and minutes
                    const timestampInSeconds = parseInt(item.clock, 10);
                    const date = new Date(timestampInSeconds * 1000); // Convert to milliseconds
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const formattedTime = `${hours}:${minutes}`;

                    labels.push(formattedTime);
                    datasets[0].data.push(parseFloat(item.value)); // Convert "value" to a floating-point number

                    // Keep track of the maximum transaction count
                    if (parseFloat(item.value) > maxTransactionCount) {
                        maxTransactionCount = parseFloat(item.value);
                    }
                });

                // Determine the chart's y-axis maximum value
                const yAxisMax = Math.ceil(maxTransactionCount / 5) * 5 + 5; // Round up to the nearest multiple of 5 and add 5

                const sqlTransactionsPerSecond: CustomChartData = {
                    title: "Total de Transações por Segundo",
                    labels,
                    datasets,
                    options: {
                        scales: {
                            y: {
                                max: yAxisMax, // Set the maximum value for the y-axis
                            },
                        },
                        showGridLines: true,
                    },
                };

                setSqlTransactionsPerSecond(sqlTransactionsPerSecond);
            } else {
                console.warn('Nenhum dado encontrado para o item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    interface HostData {
        hostid: string;
        itemid: string;
        name: string;
    }

    interface ApiItem {
        clock: string;
        value: string;
    }

    interface ChartData {
        label: string;
        data: (number | null)[];
        backgroundColor: string;
        fill: boolean;
    }

    async function loadAndSetSqlMemory(hostsData: HostData[]) {
        if (!hostsData || hostsData.length === 0) return;

        const nowInSeconds = Math.floor(Date.now() / 1000);
        const fromPeriodInSeconds = nowInSeconds - (3 * 60 * 60);

        const labels: string[] = [];
        const datasets: ChartData[] = [];

        let maxCount = 0;

        const uniqueLabels: Set<string> = new Set();

        for (const hostData of hostsData) {
            const requestData = {
                jsonrpc: '2.0',
                method: 'history.get',
                params: {
                    output: ["value", "clock"],
                    hostids: [hostData.hostid],
                    itemids: [hostData.itemid],
                    time_from: fromPeriodInSeconds,
                    time_till: nowInSeconds,
                    sortfield: 'clock',
                    sortorder: 'ASC',
                },
                id: 7,
                auth: sessionStorage.getItem('session_token'),
            };

            try {
                const response = await axios.post(zabbixApiUrl, requestData);

                if (response.data.result) {
                    const apiData: ApiItem[] = response.data.result;

                    const dataset: ChartData = {
                        label: hostData.name,
                        data: [],
                        backgroundColor: generatePastelColor(),
                        fill: true,
                    };

                    apiData.forEach((item: ApiItem) => {
                        const timestampInSeconds = parseInt(item.clock, 10);
                        const date = new Date(timestampInSeconds * 1000);
                        const hours = date.getHours();
                        const minutes = date.getMinutes();
                        const formattedTime = `${hours}:${minutes}`;

                        uniqueLabels.add(formattedTime);

                        const dataIndex = labels.indexOf(formattedTime);
                        if (dataIndex === -1) {
                            labels.push(formattedTime);
                            dataset.data.push(parseFloat(item.value));
                        } else {
                            dataset.data[dataIndex]!! += parseFloat(item.value);
                        }

                        if (dataset.data[dataIndex]!! > maxCount) {
                            maxCount = dataset.data[dataIndex]!!;
                        }
                    });

                    datasets.push(dataset);
                } else {
                    console.warn('Nenhum dado encontrado para o item:', hostData);
                }
            } catch (error) {
                console.error('Erro ao pegar o valor de um item:', error);
            }
        }

        const sortedLabels = Array.from(uniqueLabels).sort();

        datasets.forEach((dataset) => {
            dataset.data = sortedLabels.map((label) => {
                const dataIndex = labels.indexOf(label);
                return dataIndex !== -1 ? dataset.data[dataIndex] : null;
            });
        });

        const yAxisMax = Math.ceil(maxCount / 5) * 5 + 5;

        const sqlMemoryChartOpt = {
            title: "Memória",
            labels: sortedLabels,
            datasets,
            options: {
                scales: {
                    y: {
                        max: yAxisMax,
                    },
                },
                showGridLines: true,
            },
        };

        setSqlMemoryDatas([sqlMemoryChartOpt]);
    };

    async function loadAndSetSqlConnectedUsers(hostData: any | null | undefined) {
        if (!hostData) return;

        const nowInSeconds = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        const fromPeriodInSeconds = nowInSeconds - (3 * 60 * 60); // Subtract 3 hours in seconds

        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value", "clock"],
                history: 0,
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                time_from: fromPeriodInSeconds,
                time_till: nowInSeconds,
                sortfield: 'clock',
                sortorder: 'ASC',
            },
            id: 8,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            if (response.data.result) {
                const apiData = response.data.result;

                // Process API data to create CustomChartData
                const labels: string[] = [];
                const datasets: {
                    label: string;
                    data: number[];
                    backgroundColor: string;
                    fill: boolean;
                }[] = [
                        {
                            label: hostData.name,
                            data: [],
                            backgroundColor: 'rgba(0, 0, 150, 0.3)',
                            fill: true,
                        }
                    ];

                let maxTransactionCount = 0;

                apiData.forEach((item: any, index: number) => {
                    // Convert "clock" to hours and minutes
                    const timestampInSeconds = parseInt(item.clock, 10);
                    const date = new Date(timestampInSeconds * 1000); // Convert to milliseconds
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const formattedTime = `${hours}:${minutes}`;

                    labels.push(formattedTime);
                    datasets[0].data.push(parseFloat(item.value)); // Convert "value" to a floating-point number

                    // Keep track of the maximum transaction count
                    if (parseFloat(item.value) > maxTransactionCount) {
                        maxTransactionCount = parseFloat(item.value);
                    }
                });

                // Determine the chart's y-axis maximum value
                const yAxisMax = Math.ceil(maxTransactionCount / 5) * 5 + 5; // Round up to the nearest multiple of 5 and add 5

                const sqlConnectedUsers: CustomChartData = {
                    title: "Qnt de Usuários Conectados",
                    labels,
                    datasets,
                    options: {
                        scales: {
                            y: {
                                max: yAxisMax, // Set the maximum value for the y-axis
                            },
                        },
                        showGridLines: false,
                    },
                };

                setSqlConnectedUsers(sqlConnectedUsers);
            } else {
                console.warn('Nenhum dado encontrado para o item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    async function loadAndSetSqlDeadLocks(hostData: any | null | undefined) {
        if (!hostData) return;

        const nowInSeconds = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        const fromPeriodInSeconds = nowInSeconds - (3 * 60 * 60); // Subtract 3 hours in seconds

        const requestData = {
            jsonrpc: '2.0',
            method: 'history.get',
            params: {
                output: ["value", "clock"],
                // history: 3,
                hostids: [hostData.hostid],
                itemids: [hostData.itemid],
                time_from: fromPeriodInSeconds,
                time_till: nowInSeconds,
                sortfield: 'clock',
                sortorder: 'ASC',
            },
            id: 9,
            auth: sessionStorage.getItem('session_token')
        };

        try {
            const response = await axios.post(zabbixApiUrl, requestData);

            if (response.data.result) {
                const apiData = response.data.result;

                // Process API data to create CustomChartData
                const labels: string[] = [];
                const datasets: {
                    label: string;
                    data: number[];
                    backgroundColor: string;
                    fill: boolean;
                }[] = [
                        {
                            label: hostData.name,
                            data: [],
                            backgroundColor: 'rgba(0, 0, 100, 0.3)',
                            fill: true,
                        }
                    ];

                let maxTransactionCount = 0;

                apiData.forEach((item: any, index: number) => {
                    // Convert "clock" to hours and minutes
                    const timestampInSeconds = parseInt(item.clock, 10);
                    const date = new Date(timestampInSeconds * 1000); // Convert to milliseconds
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const formattedTime = `${hours}:${minutes}`;

                    labels.push(formattedTime);
                    datasets[0].data.push(parseFloat(item.value)); // Convert "value" to a floating-point number

                    // Keep track of the maximum transaction count
                    if (parseFloat(item.value) > maxTransactionCount) {
                        maxTransactionCount = parseFloat(item.value);
                    }
                });

                // Determine the chart's y-axis maximum value
                const yAxisMax = Math.ceil(maxTransactionCount / 5) * 5 + 5; // Round up to the nearest multiple of 5 and add 5

                const sqlDeadLocks: CustomChartData = {
                    title: "Dead Locks",
                    labels,
                    datasets,
                    options: {
                        scales: {
                            y: {
                                max: yAxisMax, // Set the maximum value for the y-axis
                            },
                        },
                        showGridLines: false,
                    },
                };

                setSqlDeadLocks(sqlDeadLocks);
            } else {
                console.warn('No data found for item:', hostData);
            }
        } catch (error) {
            console.error('Erro ao pegar o valor de um item:', error);
        }
    };

    useEffect(() => {
        const fetchDataAndSetTimer = async () => {
            await updatePanel(false); // Initial data fetch

            /*
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(async () => {
                await updatePanel(true);
            }, 1000 * 10) // Auto atualiza a cada 10s

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
            */
        };

        fetchDataAndSetTimer();
    }, [selectedServer]);

    const disksContainerRef = React.createRef<HTMLDivElement>();

    useEffect(() => {
        const savedLayout = sessionStorage.getItem('userLayout_' + selectedServer);
        if (savedLayout) {
            try {
                const parsedLayouts = JSON.parse(savedLayout);
                setLayouts(parsedLayouts);
            } catch (error) {
                console.error('Erro ao analisar os layouts salvos:', error);
            }

            const disksContainer = disksContainerRef.current;
            if (disksContainer) {
                const containerHeight = disksContainer.getBoundingClientRect().height;
                const numDisks = diskItems.length;
                const calculatedGaugeHeight = containerHeight / numDisks;

                // Atualiza o estado com a altura calculada da gauge
                setGaugeHeight(calculatedGaugeHeight);
            }
        }
    }, [diskItems, selectedServer]);

    const [isLayoutSaved, setIsLayoutSaved] = useState(false);
    const [lastLayout, setLastLayout] = useState<any[] | null>(null);


    useEffect(() => {
        if (!selectedLayout) return;
        const diskGraphs = layouts.filter((item) => item.i.includes("disk-"));
        const sqlUsedGraphs = layouts.filter((item) => item.i.includes("sql-used"));
        const sqlBufferGraphs = layouts.filter((item) => item.i.includes("sql-buffer"));
        const sqlProcessorGraphs = layouts.filter((item) => item.i.includes("sql-processor"));
        const sqlConnectedGraphs = layouts.filter((item) => item.i.includes("sql-connected"));
        const sqlTransactionsGraphs = layouts.filter((item) => item.i.includes("sql-transactions"));
        const sqlMemoryGraphs = layouts.filter((item) => item.i.includes("custom-chart-"));

        const allItemsLoaded: boolean =
            (diskGraphs.length === diskItems.length) &&
            (sqlUsedGraphs.length === 1) &&
            (sqlBufferGraphs.length === 1) &&
            (sqlProcessorGraphs.length === 1) &&
            (sqlConnectedGraphs.length === 0 && !sqlConnectedUsers) &&
            (sqlTransactionsGraphs.length === 1) &&
            (sqlMemoryGraphs.length === 1);

        console.log("diskGraphs", diskGraphs.length, diskItems.length, diskGraphs.length === diskItems.length)
        console.log("sqlUsedGraphs", sqlUsedGraphs.length, sqlUsedGraphs.length === 1)
        console.log("sqlBufferGraphs", sqlBufferGraphs.length, sqlBufferGraphs.length === 1)
        console.log("sqlProcessorGraphs", sqlProcessorGraphs.length, sqlProcessorGraphs.length === 1)
        console.log("sqlConnectedGraphs", sqlConnectedGraphs.length, sqlConnectedGraphs.length === 0 && !sqlConnectedUsers)
        console.log("sqlTransactionsGraphs", sqlTransactionsGraphs.length, sqlTransactionsGraphs.length === 1)
        console.log("sqlMemoryGraphs", sqlMemoryGraphs.length, sqlMemoryGraphs.length === 1)

        console.log(allItemsLoaded)

        // if (allItemsLoaded) {
            let selectedArray = selectedLayout.layout;
            if (typeof selectedArray === 'string') {
                selectedArray = JSON.parse(selectedArray);
            }

            const isEqualsArr = isEqual(selectedArray, lastLayout)

            console.log("SE NAO IR, TMNC", !isEqualsArr, lastLayout, selectedArray)
            if (!isEqualsArr) {
                console.log("ENTROU")
                updateLayout();
                setLastLayout(selectedArray);
            }
            console.log("SE NAO IR, TMNC", !isEqualsArr, lastLayout, selectedArray)
        // }
    }, [selectedLayout, /** layouts */]);

    function updateLayout() {
        if (selectedLayout) {
            const oldLayouts = layouts;
            let currentLayout = selectedLayout.layout;
            if (typeof currentLayout === 'string') {
                currentLayout = JSON.parse(currentLayout);
            }

            console.log("currentLayout", currentLayout)

            const newLayouts = oldLayouts.map((layout) => {
                const currentId = layout.i;
                if (layout.i.includes("disk-")) {
                    const firstDisk = currentLayout.find((item) => item.i.includes("disk-"));
                    if (firstDisk) {
                        // remove from currentLayout
                        currentLayout.splice(currentLayout.indexOf(firstDisk), 1);

                        // set new position

                        layout.x = firstDisk.x;
                        layout.y = firstDisk.y;
                        layout.i = currentId;
                        layout.w = firstDisk.w;
                        layout.h = firstDisk.h;
                        layout.moved = firstDisk.moved;
                        layout.static = firstDisk.static;
                    }
                } else if (layout.i.includes("sql-used-memory-in-sql-server-disksquare")) {
                    const usedMemoryData = currentLayout.find((item) => item.i.includes("sql-used-memory-in-sql-server-disksquare"));

                    if (usedMemoryData) {
                        // set new position
                        layout.x = usedMemoryData.x;
                        layout.y = usedMemoryData.y;
                        layout.i = currentId;
                        layout.w = usedMemoryData.w;
                        layout.h = usedMemoryData.h;
                        layout.moved = usedMemoryData.moved;
                        layout.static = usedMemoryData.static;
                    }
                } else if (layout.i.includes("sql-buffer-cache-disksquare")) {
                    const bufferCache = currentLayout.find((item) => item.i.includes("sql-buffer-cache-disksquare"));

                    if (bufferCache) {
                        // set new position
                        layout.x = bufferCache.x;
                        layout.y = bufferCache.y;
                        layout.i = currentId;
                        layout.w = bufferCache.w;
                        layout.h = bufferCache.h;
                        layout.moved = bufferCache.moved;
                        layout.static = bufferCache.static;
                    }
                } else if (layout.i.includes("sql-processor-time-disksquare")) {
                    const processorTime = currentLayout.find((item) => item.i.includes("sql-processor-time-disksquare"));

                    if (processorTime) {
                        // set new position
                        layout.x = processorTime.x;
                        layout.y = processorTime.y;
                        layout.i = currentId;
                        layout.w = processorTime.w;
                        layout.h = processorTime.h;
                        layout.moved = processorTime.moved;
                        layout.static = processorTime.static;
                    }
                } else if (layout.i.includes("sql-transactions-per-second-customchart")) {
                    const transactionsPerSecond = currentLayout.find((item) => item.i.includes("sql-transactions-per-second-customchart"));

                    if (transactionsPerSecond) {
                        // set new position
                        layout.x = transactionsPerSecond.x;
                        layout.y = transactionsPerSecond.y;
                        layout.i = currentId;
                        layout.w = transactionsPerSecond.w;
                        layout.h = transactionsPerSecond.h;
                        layout.moved = transactionsPerSecond.moved;
                        layout.static = transactionsPerSecond.static;
                    }
                } else if (layout.i.includes("custom-chart-")) {
                    const customChart = currentLayout.find((item) => item.i.includes("custom-chart-"));

                    if (customChart) {
                        // remove from currentLayout
                        currentLayout.splice(currentLayout.indexOf(customChart), 1);
                        // set new position
                        layout.x = customChart.x;
                        layout.y = customChart.y;
                        layout.i = currentId;
                        layout.w = customChart.w;
                        layout.h = customChart.h;
                        layout.moved = customChart.moved;
                        layout.static = customChart.static;
                    }
                }

                return layout;
            })

            setLayouts(newLayouts);
            const layoutJson = JSON.stringify(newLayouts);
            sessionStorage.setItem('userLayout_' + selectedServer, layoutJson);

            console.log("Layouts setted to ", newLayouts)
            updatePanel(true).then(() => {
                console.log("PANEL ATUALIZADO")
            });
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div id="sql-panel-template">
                {isFullScreen && (
                    <div id='full-screen-header-div'>
                        <button
                            className="btn btn-link btn-sm text-white"
                            onClick={toggleFullScreen}
                            title='Exibir painel em Modo Informativo'
                        >
                            <i className='fas fa-compress' color='gray'></i>
                        </button>

                        <div key="selected-server-title" className="selected-server-title">
                            Monitorando → {selectedServerName}
                        </div>
                    </div>
                )}
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layouts }}
                    onLayoutChange={(newLayouts) => {
                        if (!isEqual(newLayouts, layouts)) {
                            setLayouts(newLayouts);
                            const layoutJson = JSON.stringify(newLayouts);
                            sessionStorage.setItem('userLayout_' + selectedServer, layoutJson);
                        }
                    }}

                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                >
                    {diskItems.length !== 0 ? (
                        diskItems.map(item => {
                            const value = diskValues[item.itemid] || 0;
                            const percent = value / 100;
                            let textColor = 'black';
                            if (percent >= 0 && percent <= 0.10) {
                                textColor = '#ff0000';
                            } else if (percent > 0.10 && percent <= 0.20) {
                                textColor = '#e8b313';
                            }

                            return (
                                <div key={`disk-${item.itemid}`}>
                                    <DiskSquare
                                        name={item.name}
                                        value={value}
                                        arcsLength={[0.1, 0.1, 0.8]}
                                        colors={['#ff0000', '#e8b313', '#4dbd11']}
                                        textColor={textColor}
                                    />
                                </div>
                            );
                        })
                    ) : (<div></div>)} &&
                    {sqlUsedMemoryInSqlServerItem ? (
                        <div key='sql-used-memory-in-sql-server-disksquare'>
                            {(() => {
                                const value = sqlUsedMemoryInSqlServer;
                                const percent = value / 100;
                                let textColor = 'black'; // Default color
                                if (percent >= 0.8 && percent < 0.9) {
                                    textColor = '#e8b313'; // Yellow
                                } else if (percent >= 0.9) {
                                    textColor = '#ff0000'; // Red
                                }

                                return (
                                    <DiskSquare
                                        name={sqlUsedMemoryInSqlServerItem}
                                        value={value}
                                        arcsLength={[0.8, 0.1, 0.1]}
                                        colors={['#4dbd11', '#e8b313', '#ff0000']}
                                        textColor={textColor}
                                    />
                                );
                            })()}
                        </div>
                    ) : (<div></div>)} &&
                    {sqlBufferCacheHitRatioItem ? (
                        <div key='sql-buffer-cache-disksquare'>
                            {(() => {
                                const value = sqlBufferCacheHitRatio;
                                const percent = value / 100;
                                let textColor = 'black'; // Default color
                                if (percent >= 0.8 && percent < 0.9) {
                                    textColor = '#e8b313'; // Yellow
                                } else if (percent >= 0 && percent < 0.8) {
                                    textColor = '#ff0000'; // Red
                                }

                                return (
                                    <DiskSquare
                                        name={sqlBufferCacheHitRatioItem}
                                        value={value}
                                        arcsLength={[0.8, 0.1, 0.1]}
                                        colors={['#ff0000', '#e8b313', '#4dbd11']}
                                        textColor={textColor}
                                    />
                                );
                            })()}
                        </div>
                    ) : (<div></div>)} &&
                    {sqlProcessorTimeItem ? (
                        <div key='sql-processor-time-disksquare'>
                            {(() => {
                                const value = sqlProcessorTime;
                                const percent = value / 100;
                                let textColor = 'black'; // Default color
                                if (percent >= 0.8 && percent < 0.9) {
                                    textColor = '#e8b313'; // Yellow
                                } else if (percent >= 0.9) {
                                    textColor = '#ff0000'; // Red
                                }

                                return (
                                    <DiskSquare
                                        name={sqlProcessorTimeItem}
                                        value={value}
                                        arcsLength={[0.8, 0.1, 0.1]}
                                        colors={['#4dbd11', '#e8b313', '#ff0000']}
                                        textColor={textColor}
                                    />
                                );
                            })()}
                        </div>
                    ) : (<div></div>)} &&
                    {sqlConnectedUsers ? (
                        <div
                            key="sql-connected-users-customchart"
                            style={{
                                width: '100%', // Garanta que o gráfico ocupe toda a largura do contêiner
                                height: '100%', // Garanta que o gráfico ocupe toda a altura do contêiner
                            }}
                        >
                            {(() => {
                                return (
                                    <CustomChart data={sqlConnectedUsers} />
                                );
                            })()}
                        </div>
                    ) : (<div></div>)} &&
                    {sqlTransactionsPerSecond ? (
                        <div
                            key="sql-transactions-per-second-customchart"
                            style={{
                                width: '100%', // Garanta que o gráfico ocupe toda a largura do contêiner
                                height: '100%', // Garanta que o gráfico ocupe toda a altura do contêiner
                            }}
                        >
                            {(() => {
                                return (
                                    <CustomChart data={sqlTransactionsPerSecond} />
                                );
                            })()}
                        </div>
                    ) : (<div></div>)} &&
                    sqlMemoryDatas ? (
                    {sqlMemoryDatas.map((data, index) => {
                        return (
                            <div key={`custom-chart-${index}`}>
                                {data ? (
                                    <CustomChart data={data} />
                                ) : null}
                            </div>
                        );
                    })}
                    ) : (
                    <div></div>
                    )
                </ResponsiveGridLayout>
            </div>
        </DndProvider>
    );
};

export default DashSQL;