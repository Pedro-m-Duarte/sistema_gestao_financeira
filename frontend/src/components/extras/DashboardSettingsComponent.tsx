import axios from "axios";
import { backendUrl } from "../../App";
import { popupErrorWarn } from "../../FrontendUtils";
import { useEffect, useState } from "react";
import GraphicForm from "../builderTemplates/GraphicForm";
import CheckIcon from '@mui/icons-material/Check';
import ToggleButton from '@mui/material/ToggleButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Swal from "sweetalert2";

interface DashboardSettingsComponentProps {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    allServersNames: string[];
    setIsLoggedIn: (loggedIn: boolean) => void;
    updateAdminPage: () => void;
}

const DashboardSettingsComponent: React.FC<DashboardSettingsComponentProps> = ({ allServersNames, loading, setLoading, setIsLoggedIn, updateAdminPage }) => {
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

       // const sID = sessionStorage.getItem('session_user_SID');

       setLoading(false);
    }

    useEffect(() => {
        updateData();
    }, []);

    return (
        <>
            {/* <p>As configurações do Dashboard estarão disponíveis em breve.</p> */}
            <GraphicForm serverId='' serverName='' isAdmPage={true}></GraphicForm>
        </>
    );
};

export default DashboardSettingsComponent;
