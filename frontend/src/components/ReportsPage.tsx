// src/components/ReportsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import '../css/Reports.css'; // CSS da página de Reports
import Swal from 'sweetalert2';
import { backendUrl, zabbixApiUrl } from '../App';
import axios from 'axios';
import { isEmpty } from 'lodash';
import ExportReportModal from './modals/ExportReportModal';
import { formatDateAsBRString, popupErrorWarn } from '../FrontendUtils';
import GraphComponent from './extras/GraphComponent';
import { Skeleton, Stack } from '@mui/material';

interface ReportsPageProps {
    fetchServersFromZabbix: () => Promise<boolean>;
    selectedServer: string; // ID
    selectedServerName: string;
    setIsLoggedIn: (loggedIn: boolean) => void
}

enum TimePeriods {
    LastHour = 'LastHour',
    LastDay = 'LastDay',
    Last3Days = 'Last3Days',
    LastWeek = 'LastWeek',
    LastMonth = 'LastMonth',
    LastYear = 'LastYear',
    PastMonth = 'PastMonth',
    Custom = 'Custom',
}
namespace TimePeriods {
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

export interface ServerReportGraph {
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

const ReportsPage: React.FC<ReportsPageProps> = ({ fetchServersFromZabbix, selectedServer, selectedServerName, setIsLoggedIn }) => {
    document.title = 'Painel Titan | Relatórios';

    const GeneralInfoToast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
    });

    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    const [reportsHistoryRawData, setReportsHistoryRawData] = useState<any | null>(null)

    async function updateReportsHistory(): Promise<boolean> {
        if (!selectedServer) return true;
        try {
            const sID = sessionStorage.getItem('session_user_SID');
            const res = await axios.get(`${backendUrl}/reports/history`, {
                params: {
                    sID: sID,
                    server: selectedServer,
                }
            });
            if (!res.data.success) {
                setReportsHistory([]);
                setSelectedReportHistory('default');
                setSeeingReport(null);
                if (res.data.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao carregar o histórico de relatórios.', res.data.error);
                } else {
                    setIsLoggedIn(false);
                }
                return false;
            }

            setReportsHistoryRawData(res.data.reports);
            if (res.data.reports) {
                setReportsHistory(res.data.reports.map((report: any) => {
                    return report.id
                }));
            };
            return true;
        } catch (err) {
            setReportsHistory([]);
            setSelectedReportHistory('default');
            setSeeingReport(null);
            popupErrorWarn('Um erro ocorreu ao carregar o histórico de relatórios. A API Titan parece estar indisponível no momento.', err);
            return false;
        }
    }

    async function updateReportsPage() {
        UpdatingDataAlert.fire({
            title: 'Carregando...',
        });
        UpdatingDataAlert.showLoading();

        const successFetchServers = await fetchServersFromZabbix();
        const successUpdateReportsHistory = await updateReportsHistory();

        if (successFetchServers && successUpdateReportsHistory) {
            UpdatingDataAlert.close();
        }
    }

    // State variables
    const [selectedTimePeriod, setSelectedTimePeriod] = useState(TimePeriods.PastMonth);
    const [showCustomTimeperiodInputs, setShowCustomTimeperiodInputs] = useState(false);
    const [customTimeperiodStart, setCustomTimeperiodStart] = useState<string>();
    const [customTimeperiodEnd, setCustomTimeperiodEnd] = useState<string>();

    const [autogenerateComments, setAutogenerateComments] = useState(true);
    const [generateButtomDisabled, setGenerateButtomDisabled] = useState(false);
    const [autogenerateCommentsDisabled, setAutogenerateCommentsDisabled] = useState(false);

    const [reportsHistory, setReportsHistory] = useState<string[] | null>(null);
    const [selectedReportHistory, setSelectedReportHistory] = useState('default');

    const [seeingReport, setSeeingReport] = useState<ServerReport | null>(null);

    // Refs
    const graphsTitleRef = useRef<HTMLDivElement>(null);

    // Reset page state variables
    function resetPageStates() {
        setSelectedTimePeriod(TimePeriods.PastMonth);
        setShowCustomTimeperiodInputs(false);
        setCustomTimeperiodStart(undefined);
        setCustomTimeperiodEnd(undefined);
        setAutogenerateComments(true);
        setGenerateButtomDisabled(false);
        setAutogenerateCommentsDisabled(false);
        // setReportsHistory([]);
        setSelectedReportHistory('default');
        setSeeingReport(null);
    }

    useEffect(() => {
        setReportsHistory(null);
        resetPageStates();
        updateReportsPage();
    }, [selectedServer]);

    const onChangeSelectedReportHistory = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value == 'default') {
            resetPageStates();
        } else {
            if (!reportsHistoryRawData) {
                GeneralInfoToast.fire({
                    icon: 'error',
                    title: 'O histórico ainda está sendo carregado.',
                    timer: 1000 * 3,
                    timerProgressBar: true
                });
                return
            }
            const report = reportsHistoryRawData!!.find((report: any) => report.id == e.target.value)!! as ServerReport;
            if (!report) {
                GeneralInfoToast.fire({
                    icon: 'error',
                    title: 'Parece que esse relatório não existe mais no histórico.',
                    timer: 1000 * 3,
                    timerProgressBar: true
                });
                await updateReportsHistory();
                return
            }
            setSeeingReport(report);
            setSelectedTimePeriod(report.generatedTimePeriod);
            setTimeout(() => {
                if (graphsTitleRef.current) {
                    window.scrollTo({ top: graphsTitleRef.current.offsetTop, behavior: 'smooth' });
                }
            }, 100);
        }
        setSelectedReportHistory(e.target.value);
    }

    const onChooseCustomTimestemp = () => {
        if ((selectedTimePeriod == TimePeriods.LastDay || selectedTimePeriod == TimePeriods.LastHour)) {
            if (!autogenerateCommentsDisabled) {
                GeneralInfoToast.fire({
                    icon: 'warning',
                    title: 'A geração automática de mensagens descritivas é incompatível para o Período de Tempo selecionado.',
                    timer: 1000 * 3,
                    timerProgressBar: true
                });
            }
            setAutogenerateComments(false);
            setAutogenerateCommentsDisabled(true);
        } else {
            setAutogenerateCommentsDisabled(false);
            setAutogenerateComments(true);
        }
        if (selectedTimePeriod == TimePeriods.Custom) {
            setShowCustomTimeperiodInputs(true);
        } else {
            setShowCustomTimeperiodInputs(false);
        }
    };

    useEffect(() => {
        onChooseCustomTimestemp();
    }, [selectedTimePeriod])

    const onAutoGenerateCommentsClick = () => {
        if ((selectedTimePeriod == TimePeriods.LastDay || selectedTimePeriod == TimePeriods.LastHour)) {
            GeneralInfoToast.fire({
                icon: 'error',
                title: 'A geração automática de mensagens descritivas é incompatível para o Período de Tempo selecionado.',
                timer: 1000 * 3,
                timerProgressBar: true
            });
        }
    };

    const onGenerateReportClick = async () => {
        if (selectedTimePeriod == TimePeriods.Custom) {
            if (!customTimeperiodStart || !customTimeperiodEnd) {
                GeneralInfoToast.fire({
                    icon: 'error',
                    title: 'Para gerar os relatórios com o período Personalizado, você deve selecionar as datas de início e término.',
                    timer: 1000 * 3,
                    timerProgressBar: true
                });
                return
            }
            if (customTimeperiodEnd <= customTimeperiodStart) {
                GeneralInfoToast.fire({
                    icon: 'error',
                    title: 'Com o período Personalizado, a data de término deve ser futura a de início.',
                    timer: 1000 * 3,
                    timerProgressBar: true
                });
                return
            }
        }
        setSeeingReport(null);
        setGenerateButtomDisabled(true);
        GeneralInfoToast.fire({
            icon: 'info',
            title: 'Gerando relatório...',
            text: 'Isso pode levar até 5 minutos. Você será notificado quando esse relatório ficar pronto. Você pode gerar outros relatórios enquanto isso.',
            timer: 1000 * 5, // 1000 * 60 * 5,
            timerProgressBar: true
        })
        GeneralInfoToast.showLoading();
        setTimeout(() => {
            setGenerateButtomDisabled(false);
        }, 1000 * 5)

        try {
            const sID = sessionStorage.getItem('session_user_SID');
            const res = await axios.post(`${backendUrl}/reports/generate`, {
                sID: sID,
                server: selectedServer,
                timePeriod: selectedTimePeriod,
                customDateStart: customTimeperiodStart,
                customDateEnd: customTimeperiodEnd,
                isToAutoGenerateComments: autogenerateComments
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    // express-session
                    'cookie': `connect.sid=${sID}`
                },
                timeout: 1000 * 60 * 5
            });
            if (!res.data.success) {
                if (res.data.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao gerar o relatório solicitado.', res.data.error);
                } else {
                    setIsLoggedIn(false);
                }
                setGenerateButtomDisabled(false);
                return;
            }
            const generatedReport = res.data.generatedReport as ServerReport
            let seeingNewReport = false
            await updateReportsHistory();
            /*
            if (generatedReport.serverId == Number(selectedServer) && !seeingReport) {
                setSeeingReport(generatedReport);
                setGenerateButtomDisabled(false);
                setSelectedReportHistory(`${generatedReport.id}`);
                setTimeout(() => {
                    if (graphsTitleRef.current) {
                        window.scrollTo({ top: graphsTitleRef.current.offsetTop, behavior: 'smooth' });
                    }
                }, 500)
                seeingNewReport = true
            }
            */
            const response = await axios.post(zabbixApiUrl, {
                jsonrpc: '2.0',
                method: 'host.get',
                params: {
                    output: ['name'],
                    hostids: [`${generatedReport.serverId}`]
                },
                id: 1,
                auth: sessionStorage.getItem('session_token')
            });
            GeneralInfoToast.fire({
                icon: 'success',
                title: `Um relatório com o ID #${generatedReport.id} foi gerado para o servidor ${response.data.result[0].name}.`,
                text: seeingNewReport ? 'Você já está visualizando esse relatório.' : 'Você pode acessá-lo em Relatórios > Ver do Histórico.',
                timer: 1000 * 5,
                timerProgressBar: true
            })
        } catch (err) {
            popupErrorWarn('Um erro ocorreu ao gerar o relatório solicitado. A API Titan parece estar indisponível no momento.', err);
            setGenerateButtomDisabled(false);
        }
    };

    const customTimeperiodInputCSS: React.CSSProperties = {
        padding: '0.375rem 0.5rem 0.375rem 0.75rem',
        MozPaddingStart: 'calc(0.75rem - 3px)',
        fontSize: 'rem',
        fontWeight: '400',
        lineHeight: '1.5',
        color: '#212529',
        backgroundColor: '#fff',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px 12px',
        border: '3px solid #ced4da',
        borderRadius: '0.375rem',
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none'
    };

    // Opções do ExportReportModal
    const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);

    const openExportReportModal = () => {
        if (!seeingReport) {
            GeneralInfoToast.fire({
                icon: 'error',
                title: 'Você deve primeiro gerar um relatório para poder exportá-lo.',
                timer: 1000 * 3,
                timerProgressBar: true
            });
            return
        }
        setIsExportReportModalOpen(true);
    };

    return (
        <div>
            <CSSTransition
                in={isExportReportModalOpen}
                timeout={300}
                classNames='dialog'
            >
                <ExportReportModal
                    isOpen={isExportReportModalOpen}
                    setIsOpen={setIsExportReportModalOpen}
                    onClose={() => setIsExportReportModalOpen(false)}
                    seeingReport={seeingReport}
                />
            </CSSTransition>
            <div
                id='page'
                className='reports-page'
                style={{ position: 'relative' }}
            >
                <h3 className='stats-title'>Gerar Relatórios</h3>
                <hr
                    style={{
                        marginLeft: '20%',
                        width: '60%',
                        border: 'none',
                        borderTop: '0.5px solid black'
                    }}
                />
                <div
                    id='reports-history-div'
                    style={{ marginLeft: '68%', textAlign: 'left' }}
                >
                    <p style={{ marginLeft: '1%', fontSize: '15px' }}>Ver do Histórico:</p>

                    {reportsHistory ? !isEmpty(reportsHistory) ? (
                        <select
                            name='reports-history'
                            id='reports-history'
                            value={selectedReportHistory}
                            onChange={(e) => onChangeSelectedReportHistory(e)}
                            style={{
                                padding: '0.375rem 2rem 0.375rem 0.75rem',
                                MozPaddingStart: 'calc(0.75rem - 3px)',
                                fontSize: '1rem',
                                fontWeight: '400',
                                lineHeight: '1.5',
                                color: '#212529',
                                backgroundColor: '#fff',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '16px 12px',
                                border: '3px solid #ced4da',
                                borderRadius: '0.375rem',
                                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                            }}
                        >
                            <option key='defaultopt' value='default'>Selecione...</option>
                            {reportsHistory.map((option) => {
                                const reportData = reportsHistoryRawData?.find((report: any) => report.id === option);
                                const isAutomatic = reportData?.userId === null;
                                const content = reportData ? `${isAutomatic ? '[A] ' : ''}Rel. de ${formatDateAsBRString(reportData.generatedAt, true)}` : `Relatório ID #${option}`;
                                return (
                                    <option key={option} value={option}>
                                        {content}
                                    </option>
                                );
                            })}
                        </select>
                    ) : (
                        <>
                            <p style={{ fontSize: '13px', paddingRight: '30%' }}>Ops! Ainda não há nenhum relatório no histórico para o servidor selecionado.</p>
                        </>
                    ) : (
                        <>
                            <>
                                <Stack spacing={1} alignItems={'center'} justifyContent={'center'}>
                                    <Skeleton variant="text" style={{ fontSize: '13px', marginRight: '40%' }} width={250} height={35} />
                                </Stack>
                            </>
                        </>
                    )}
                </div>

                <h3
                    style={{
                        fontSize: '135%',
                        // paddingTop: isEmpty(graphs) ? '1%' : '0%',
                        color: 'gray'
                    }}
                >
                    Período de Tempo
                </h3>
                <select
                    name='timestamps'
                    id='available-timestamps'
                    disabled={generateButtomDisabled}
                    // onClick={onChooseCustomTimestemp}
                    value={selectedTimePeriod}
                    onChange={(e) => setSelectedTimePeriod(e.target.value as TimePeriods)}
                    style={{
                        padding: '0.375rem 2rem 0.375rem 0.75rem',
                        MozPaddingStart: 'calc(0.75rem - 3px)',
                        fontSize: '1rem',
                        fontWeight: '400',
                        lineHeight: '1.5',
                        color: '#212529',
                        backgroundColor: '#fff',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '16px 12px',
                        border: '3px solid #ced4da',
                        borderRadius: '0.375rem',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none'
                    }}
                >
                    {Object.keys(TimePeriods).map((timeperiodKey) => {
                        const timeperiod = TimePeriods[timeperiodKey as keyof typeof TimePeriods];
                        if (typeof timeperiod !== 'function') {
                            return (
                                <option key={timeperiod} value={timeperiod}>
                                    {TimePeriods.getDisplayName(timeperiod)}
                                </option>
                            );
                        }
                        return null;
                    })}
                </select>

                <CSSTransition
                    in={showCustomTimeperiodInputs}
                    timeout={500}
                    classNames={{
                        enter: 'custom-timestamp-inputs-enter',
                        enterActive: 'custom-timestamp-inputs-enter-active',
                        exit: 'custom-timestamp-inputs-exit',
                        exitActive: 'custom-timestamp-inputs-exit-active'
                    }}
                    unmountOnExit
                >
                    <div>
                        <label
                            id='custom-timestamp-inputs'
                            className='custom-timestamp-inputs'
                            style={{
                                paddingTop: '1%',
                            }}>
                            Data de início <br />
                            <input
                                type='date'
                                disabled={generateButtomDisabled}
                                value={customTimeperiodStart}
                                onChange={(e) => setCustomTimeperiodStart(e.target.value)}
                                style={customTimeperiodInputCSS}
                            />
                        </label>
                        <label
                            style={{
                                paddingTop: '1%',
                                paddingBottom: '1%'
                            }}
                        >
                            Data de término <br />
                            <input
                                type='date'
                                disabled={generateButtomDisabled}
                                value={customTimeperiodEnd}
                                onChange={(e) => setCustomTimeperiodEnd(e.target.value)}
                                style={customTimeperiodInputCSS}
                            />
                        </label>
                    </div>
                </CSSTransition>

                {
                    (selectedTimePeriod != TimePeriods.LastDay && selectedTimePeriod != TimePeriods.LastHour) ? (
                        <>
                            <h3
                                style={{
                                    fontSize: '135%',
                                    paddingTop: '2%',
                                    color: 'gray'
                                }}
                            >
                                Mensagens Descritivas
                            </h3>
                            <label
                                htmlFor='auto-generate-graphs-messages'
                                style={{ alignItems: 'center', marginTop: '1%', marginLeft: '40%', marginRight: '40%' }}
                            >
                                <input
                                    type='checkbox'
                                    id='auto-generate-graphs-messages'
                                    checked={autogenerateComments}
                                    onClick={onAutoGenerateCommentsClick}
                                    onChange={(e) => setAutogenerateComments(e.target.checked)}
                                    disabled={(autogenerateCommentsDisabled || generateButtomDisabled)}
                                    style={{ marginRight: '5px', }}
                                />
                                <a><i className='fas fa-solid fa-pen-to-square'></i> Gerar automaticamente mensagens descritivas para os gráficos</a>
                            </label>
                        </>
                    ) : (<>
                        <label htmlFor='auto-generate-graphs-messages'></label>
                    </>)
                }

                <button
                    id='generate-stats-button'
                    className='generate_stats_button'
                    onClick={onGenerateReportClick}
                    disabled={generateButtomDisabled}
                >
                    <span className='generate_stats_button__text'>{generateButtomDisabled ? 'Gerando relatório...' : !seeingReport ? 'Gerar relatório' : 'Gerar novamente'}</span>
                </button>

                <div id='graphs'>
                    {seeingReport ? (
                        <>
                            <hr style={{ marginTop: '2%', marginLeft: '20%', width: '60%', border: 'none', borderTop: '0.5px solid black' }} />

                            <button
                                type='button'
                                className='btn'
                                style={{
                                    marginLeft: '48%',
                                    backgroundColor: '#494a4d',
                                    color: 'white'
                                }}
                                onClick={openExportReportModal}
                            >
                                <i className='fas fa-download'></i> Exportar relatório
                            </button>

                            <h3 className='stats-title' ref={graphsTitleRef}>Relatório ID #{seeingReport.id}: {selectedServerName}</h3>
                            <p
                                style={{
                                    fontSize: '14px',
                                    marginLeft: '30%',
                                    marginRight: '30%'
                                }}
                            >
                                Este relatório foi gerado em {formatDateAsBRString(seeingReport.generatedAt, true)}.
                            </p>

                            <div
                                style={{
                                    paddingTop: '1%'
                                }}
                            >
                                {
                                    seeingReport.graphs.map((graph, index) => (
                                        <GraphComponent key={graph.graphId || index} {...graph} />
                                    ))
                                }
                                <br /> <br />
                            </div>
                        </>
                    ) : (
                        <>
                            <p
                                style={{
                                    fontSize: '14px',
                                    marginTop: '1%',
                                    marginBottom: '1%',
                                    marginLeft: '30%',
                                    marginRight: '30%'
                                }}

                            >
                                Gere relatórios com gráficos detalhados para o servidor selecionado '{selectedServerName}'. Descrições automáticas também podem ser adicionadas aos relatórios.
                            </p>
                        </>
                    )}
                </div>
            </div >
        </div >
    );
};

export default ReportsPage;