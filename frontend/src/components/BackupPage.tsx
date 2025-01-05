// src/components/BackupPage.tsx
import React, { useEffect } from 'react';
import '../css/NotFound.css'; // CSS da página de 404
import Swal from 'sweetalert2';

interface BackupPageProps {
    FetchServersFromZabbix: () => Promise<boolean>; // Função para atualizar os servidores
    selectedServer: string; // ID do servidor selecionado
    selectedServerName: string
}

const BackupPage: React.FC<BackupPageProps> = ({ FetchServersFromZabbix, selectedServer, selectedServerName }) => {
    // Define o título da página
    document.title = 'Painel Titan | Backup';

    // Configuração do alerta de atualização de dados
    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    // Função para atualizar o painel de backup
    async function updateBackupPanel() {
        UpdatingDataAlert.fire({
            title: "Carregando...",
        });
        UpdatingDataAlert.showLoading();
        if (await FetchServersFromZabbix()) {
            UpdatingDataAlert.close();
        }
    }

    // Efeito para atualizar o painel quando o servidor selecionado mudar
    useEffect(() => {
        updateBackupPanel();
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
                <h2>O Backup está em desenvolvimento e estará disponível em breve.</h2>
            </div>
        </div>
    );
};

export default BackupPage;