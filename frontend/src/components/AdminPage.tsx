// src/components/BackupPage.tsx
import React, { useEffect, useState } from 'react';
import '../css/Admin.css'; // CSS da página de Admin
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import GeneralSettingsComponent from './extras/GeneralSettingsComponent';
import DashboardSettingsComponent from './extras/DashboardSettingsComponent';

interface AdminPageProps {
    FetchServersFromZabbix: () => Promise<boolean>; // Função para atualizar os servidores
    allServersNames: string[]; // Lista de nomes de todos os servidores
    setIsLoggedIn: (loggedIn: boolean) => void
}

const AdminPage: React.FC<AdminPageProps> = ({ FetchServersFromZabbix, allServersNames, setIsLoggedIn }) => {
    // Define o título da página
    document.title = 'Painel Titan | Configurações do Painel';

    const location = useLocation();

    // Função para atualizar a página admin
    async function updateAdminPage() {
        const successFetchServers = await FetchServersFromZabbix();
        if (successFetchServers) {
            if (location.pathname === '/admin' && !sessionStorage.getItem('SentLastAdminPagePopupWarn')) {
                sessionStorage.setItem('SentLastAdminPagePopupWarn', Date.now().toString());
                Swal.fire({
                    icon: 'question',
                    title: 'Calma aí! \nVocê está na página de configurações do Painel Titan',
                    text: 'Qualquer configuração alterada aqui entra em vigor imediatamente. Cuidado ao modificar as configurações!',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Entendi',
                });
            }
            // UpdatingDataAlert.close();
        }
    }

    // State variables
    const [selectedConfigCategory, setSelectedConfigCategory] = useState('general');
    const [loading, setLoading] = useState(true);

    const renderSettingsComponentBasedOnSelection = () => {
        switch (selectedConfigCategory) {
            case 'general': {
                return <GeneralSettingsComponent loading={loading} setLoading={setLoading} allServersNames={allServersNames} setIsLoggedIn={setIsLoggedIn} updateAdminPage={updateAdminPage} />;
            }
            
            case 'dashboard': {
                return <DashboardSettingsComponent loading={loading} setLoading={setLoading} allServersNames={allServersNames} setIsLoggedIn={setIsLoggedIn} updateAdminPage={updateAdminPage} />;
            }
        }
    };

   /*
    useEffect(() => {
        updateAdminPage();
    }, []);
    */

    useEffect(() => {
        setLoading(true);
    }, [selectedConfigCategory]);

    // MUI Extras - Start
    const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
        '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            },
        },
    }));

    function StyledToggleButton() {
        const handleChange = (
            event: React.MouseEvent<HTMLElement>,
            newSelectedCategory: string,
        ) => {
            if (newSelectedCategory === null) return;
            setSelectedConfigCategory(newSelectedCategory);
        };

        return (
            <ToggleButtonGroup
                color="primary"
                value={selectedConfigCategory}
                exclusive
                onChange={handleChange}
                aria-label="Platform"
                style={{ paddingBottom: '0.5%' }}
                disabled={loading}
            >
                <CustomToggleButton value="general">Geral</CustomToggleButton>
                <CustomToggleButton value="dashboard">Dashboard</CustomToggleButton>
            </ToggleButtonGroup>
        );
    }
    // MUI Extras- End

    return (
        <div>
            <div
                id='page'
                className='admin-page'
                style={{ position: 'relative' }}
            >
                <h3 className='stats-title'>Config. do Painel Titan</h3>
                <hr
                    style={{
                        marginLeft: '20%',
                        width: '60%',
                        border: 'none',
                        borderTop: '0.5px solid black'
                    }}
                />
                <div
                    id='admin-page-category'
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <p
                        style={{
                            fontSize: '15px',
                            marginBottom: '0.5%',
                        }}
                    >
                        Categorias de configuração:
                    </p>
                    {StyledToggleButton()}
                    <hr
                        style={{
                            width: '30%',
                            border: 'none',
                            borderTop: '0.5px solid black'
                        }}
                    />
                </div>
                <div
                    id='admin-page-content'
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {renderSettingsComponentBasedOnSelection()}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;