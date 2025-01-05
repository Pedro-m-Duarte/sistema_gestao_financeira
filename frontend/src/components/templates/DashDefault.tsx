// src/components/templates/DashDefault.tsx
import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import { Layout } from "../DashboardLayout";

export interface DashboardPageProps {
    FetchServersFromZabbix: () => Promise<boolean>;
    selectedServer: string;
    selectedServerName: string,
    isFullScreen: boolean;
    toggleFullScreen: () => void;
    intervalRef: React.MutableRefObject<NodeJS.Timeout | null>
    selectedLayout: Layout | null;
}

/**
 * Template renderizado para servidores do tipo 'DEFAULT'.
 */
const DashDefault: React.FC<DashboardPageProps> = ({ FetchServersFromZabbix, selectedServer, selectedServerName }) => {
    // Define o título da página
    document.title = "Painel Titan | Monitoramento (Padrão)";

    // Configuração do alerta de atualização de dados
    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    // Função para atualizar o painel default
    async function updateDashDefault() {
        UpdatingDataAlert.fire({
            title: "Carregando..."
        });
        UpdatingDataAlert.showLoading();
        if (await FetchServersFromZabbix()) {
            UpdatingDataAlert.close();
        }
    }

    // Efeito para atualizar o painel quando o servidor selecionado mudar
    useEffect(() => {
        updateDashDefault();
    }, [selectedServer]);

    return (
        <div id="notfound">
            <div className="notfound">
                <div className="notfound-bg">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <h1>Ops...</h1>
                <h2>O tipo do servidor selecionado ({selectedServerName}) ainda não é suportado pelo Monitoramento Titan. :c</h2>
            </div>
        </div>
    );
};

export default DashDefault;