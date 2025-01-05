import axios from "axios";
import { backendUrl } from "../../App";
import { popupErrorWarn } from "../../FrontendUtils";
import { useEffect, useState } from "react";
import CheckIcon from '@mui/icons-material/Check';
import ToggleButton from '@mui/material/ToggleButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Swal from "sweetalert2";

interface GeneralSettingsComponentProps {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    allServersNames: string[];
    setIsLoggedIn: (loggedIn: boolean) => void;
    updateAdminPage: () => void;
}

const GeneralSettingsComponent: React.FC<GeneralSettingsComponentProps> = ({ allServersNames, loading, setLoading, setIsLoggedIn, updateAdminPage }) => {
    // Configuração do alerta de atualização de dados
    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    async function updateData() {
        setLoading(true);
        await updateAdminPage();
        
        const sID = sessionStorage.getItem('session_user_SID');

        // Verificar se o Painel Titan está disponível
        try {
            const setting1Res = await axios.get(`${backendUrl}/panelsettings/get`, {
                params: {
                    sID: sID,
                    setting: 'IsDashAvailable',
                }
            });
            if (!setting1Res.data.success) {
                setIsTitanPanelAvailable(false);
                if (setting1Res.data.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao carregar as configurações do Painel Titan.', setting1Res.data.error);
                } else {
                    setIsLoggedIn(false);
                }
            } else {
                setIsTitanPanelAvailable(setting1Res.data.value);
            }
        } catch (err) {
            popupErrorWarn('Um erro ocorreu ao carregar as configurações do Painel Titan. A API Titan parece estar indisponível no momento.', err);
        }

        try {
            const setting2Res = await axios.get(`${backendUrl}/panelsettings/get`, {
                params: {
                    sID: sID,
                    setting: 'ServersToGenerateMonthlyReport',
                }
            });
            if (!setting2Res.data.success) {
                setServersToGenerateMonthlyReport([]);
                if (setting2Res.data.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao carregar as configurações do Painel Titan.', setting2Res.data.error);
                } else {
                    setIsLoggedIn(false);
                }
            } else {
                setServersToGenerateMonthlyReport(setting2Res.data.value);
            }
        } catch (err) {
            popupErrorWarn('Um erro ocorreu ao carregar as configurações do Painel Titan. A API Titan parece estar indisponível no momento.', err);
        }

        setLoading(false);
    }

    // State variables
    const [isTitanPanelAvailable, setIsTitanPanelAvailable] = useState(true);
    const [serversToGenerateMonthlyReport, setServersToGenerateMonthlyReport] = useState<string[]>([]);

    useEffect(() => {
        updateData();
    }, []);

    return (
        <>
            {loading ? (
                <>
                    <div id='skeleton-loading'>
                        <Stack spacing={1} alignItems={'center'}>
                            <Skeleton variant="rounded" width={500} height={150} />
                            <Skeleton variant="rounded" width={600} height={100} />
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    columnCount: 3,
                                    columnGap: '10%',
                                }}
                            >
                                {Array.from({ length: 51 }, (_, index) => (
                                    <div key={index} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                   x
                                    </div>
                                ))}
                            </div>
                        </Stack>
                    </div>

                </>
            ) : (
                <>
                    <div
                        id='dash-availability'
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <h4
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                margin: '1% 0',
                                fontSize: '1.3em',
                            }}
                        >
                            Disponibilidade do Painel Titan
                        </h4>
                        <div
                            id='dash-availability-toggle'
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <p
                                style={{
                                    width: 'auto',
                                    textAlign: 'center',
                                    margin: '0',
                                    marginRight: '5px',
                                }}
                            >
                                O Painel Titan está disponível? <br />Caso desativado, os usuários verão uma tela de manutenção. <br />Admins ainda poderão acesar o '/admin' do painel.
                            </p>
                            {
                                loading ? <p>Carregando...</p> : (<>
                                    <ToggleButton
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                            backgroundColor: isTitanPanelAvailable ? 'green' : 'gray',
                                            border: 'none',
                                            borderRadius: '5px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            marginLeft: '5px',
                                        }}
                                        value='check'
                                        selected={isTitanPanelAvailable}
                                        onChange={async () => {
                                            const sID = sessionStorage.getItem('session_user_SID');
                                            try {
                                                const res = await axios.post(`${backendUrl}/panelsettings/update`, {
                                                    sID: sID,
                                                    setting: 'IsDashAvailable',
                                                    value: !isTitanPanelAvailable,
                                                });
                                                setIsTitanPanelAvailable(res.data.newValue);
                                                if (!res.data.success) {
                                                    if (res.data.errorId !== -2) {
                                                        popupErrorWarn('Um erro ocorreu na API Titan ao atualizar a disponibilidade do Painel Titan.', res.data.error);
                                                    } else {
                                                        setIsLoggedIn(false);
                                                    }
                                                    return;
                                                }
                                                Swal.fire({
                                                    toast: true,
                                                    position: 'top-end',
                                                    icon: isTitanPanelAvailable ? 'info' : 'success',
                                                    title: isTitanPanelAvailable ? 'Modo de Manutenção do painel ativado com sucesso!' : 'Modo de Manutenção desativado com sucesso!',
                                                    text: `O Painel Titan agora está ${isTitanPanelAvailable ? 'indisponível' : 'disponível'} para usuários não-admins.`,
                                                    showConfirmButton: false,
                                                    timer: 1000 * 3,
                                                    timerProgressBar: true
                                                });
                                            } catch (err) {
                                                popupErrorWarn('Um erro ocorreu ao atualizar a disponibilidade do Painel Titan. A API Titan parece estar indisponível no momento.', err);
                                            }
                                        }}
                                    >
                                        {isTitanPanelAvailable ? <CheckIcon /> : null}
                                    </ToggleButton>
                                </>)
                            }
                        </div>
                    </div>

                    <div id='monthly-report-servers'>
                        <h4
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                margin: '1% 0',
                                marginTop: '2%',
                                fontSize: '1.3em',
                            }}
                        >
                            Servidores excluídos dos Relatórios Mensais Automáticos
                        </h4>
                        <p
                            style={{
                                paddingLeft: '28%',
                                paddingRight: '28%',
                                paddingBottom: '0.5%'
                            }}
                        >
                            Selecione os servidores que NÃO devem ter seus relatórios gerados automaticamente todo mês:
                        </p>

                        <div
                            id='monthly-report-servers-add'
                            style={{
                                width: '100%',
                                columnCount: 3,  // Definindo o número de colunas desejado
                                columnGap: '10%', // Espaço entre as colunas
                            }}
                        >
                            <>
                                {!loading ? allServersNames.map((server, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            marginBottom: '1%',
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <p
                                                style={{
                                                    fontSize: '1em',
                                                    marginRight: '1%'
                                                }}
                                            >
                                                • {server}
                                            </p>
                                        </div>
                                        <div style={{ marginLeft: '1%' }}>
                                            <input
                                                type="checkbox"
                                                checked={serversToGenerateMonthlyReport.includes(server)}
                                                onChange={async () => {
                                                    try {
                                                        let newServersToGenerate: string[] = []
                                                        if (serversToGenerateMonthlyReport.includes(server)) {
                                                            newServersToGenerate = serversToGenerateMonthlyReport.filter((s) => s !== server);
                                                        } else {
                                                            newServersToGenerate = [...serversToGenerateMonthlyReport, server];
                                                        }
                                                        const sID = sessionStorage.getItem('session_user_SID');
                                                        const res = await axios.post(`${backendUrl}/panelsettings/update`, {
                                                            sID: sID,
                                                            setting: 'ServersToGenerateMonthlyReport',
                                                            value: newServersToGenerate,
                                                        });
                                                        setServersToGenerateMonthlyReport(res.data.newValue);
                                                        if (!res.data.success) {
                                                            if (res.data.errorId !== -2) {
                                                                popupErrorWarn('Um erro ocorreu na API Titan ao atualizar os Servidores excluídos dos Relatórios Mensais Automáticos.', res.data.error);
                                                            } else {
                                                                setIsLoggedIn(false);
                                                            }
                                                            return;
                                                        }
                                                        Swal.fire({
                                                            toast: true,
                                                            position: 'top-end',
                                                            icon: 'success',
                                                            title: 'Regras de exclusão de servidores atualizadas com sucesso!',
                                                            text: `Atualmente há ${newServersToGenerate.length} servidores que NÃO têm seu relatório gerado automaticamente.`,
                                                            showConfirmButton: false,
                                                            timer: 1000 * 3,
                                                            timerProgressBar: true,
                                                        });
                                                    } catch (err) {
                                                        popupErrorWarn('Um erro ocorreu ao atualizar os Servidores excluídos dos Relatórios Mensais Automáticos. A API Titan parece estar indisponível no momento.', err);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )) : (<p>Carregando servidores...</p>)}
                            </>
                        </div>
                    </div>
                </>
            )}
            <br />
        </>
    );
};

export default GeneralSettingsComponent;