import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, redirect } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/LoginPage';
import NotFoundPage from './components/NotFound';
import MaintenancePage from './components/MaintenancePage';
import { FullScreenProvider } from './components/extras/FullScreenContext';
import { BACKEND_COMPATIBILITY_VERSION, DASH_VERSION, PANEL_BACKEND_URL, ZABBIX_API_URL } from './env';
import axios from 'axios';
import Swal from 'sweetalert2';

export const dashVersion: string = DASH_VERSION;
export const backendCompatibilityVersion: string = BACKEND_COMPATIBILITY_VERSION;
export const zabbixApiUrl: string = ZABBIX_API_URL;
export const backendUrl: string = PANEL_BACKEND_URL;

const App: React.FC = () => {
  const [loadingContent, setLoadingContent] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('session_token') !== null);
  const [isZabbixAdmin, setIsZabbixAdmin] = useState(sessionStorage.getItem('session_user_is_zabbix_admin') === true.toString());
  const [isDashAvailable, setIsDashAvailable] = useState(true);

  // Configuração do Toast de informações gerais
  const GeneralInfoToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
  });

  const checkDashData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/info`);
      const compVer = response.data.backendVersion;
      if (compVer !== backendCompatibilityVersion) {
        console.error(`A versão do backend (${compVer}) é incompatível com a versão do frontend (${backendCompatibilityVersion}). (IsDashAvailable: ${response.data.isAvailable})`);
        setIsDashAvailable(false);
        Swal.fire({
          icon: 'error',
          title: 'Erro de Compatibilidade de Versão',
          text: `A versão de comp. do backend (${compVer}) é incompatível com a versão de comp. do frontend (${backendCompatibilityVersion}).`,
          footer: 'Por favor atualize a página (CTRL + F5). Caso o problema persista, entre em contato conosco.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCloseButton: false,
          showConfirmButton: false,
        });
        return;
      }
      setIsDashAvailable(response.data.isAvailable);
    } catch (err) {
      console.error(err);
      setIsDashAvailable(false);
    }
  }

  // Isso é responsável por "manter o usuário logado" caso ele marque a caixa "Continuar logado" na página de login
  useEffect(() => {
    const localStorageToken = localStorage.getItem('session_token');
    const sessionUserSID = localStorage.getItem('session_user_SID');

    // Verifica se a sessão ainda é válida
    const sIDToVerify = sessionUserSID ? sessionUserSID : sessionStorage.getItem('session_user_SID');
    if (sIDToVerify) {
      axios.get(`${backendUrl}/auth/validade`, {
        params: {
          sID: sIDToVerify
        }
      }).then((res) => {
        setLoadingContent(false);
        if (res.data.valid === false) {
          sessionStorage.removeItem('session_token');
          sessionStorage.removeItem('session_user_info');
          sessionStorage.removeItem('session_user');
          sessionStorage.removeItem('session_user_is_zabbix_admin');
          sessionStorage.removeItem('session_user_SID');
          localStorage.removeItem('session_token');
          localStorage.removeItem('session_user_info');
          localStorage.removeItem('session_user');
          localStorage.removeItem('session_user_is_zabbix_admin');
          localStorage.removeItem('session_user_SID');
          setIsLoggedIn(false);

          redirect('/login');
          setTimeout(() => {
            GeneralInfoToast.fire({
              icon: 'warning',
              title: 'Sessão Expirada',
              text: 'Sua sessão expirou, por favor faça login novamente.',
              timer: 1000 * 3,
              timerProgressBar: true
            });
          }, 1000)
        }
      });
    } else {
      setLoadingContent(false);
    }

    // Se existir o localStorageToken, vai existir os outros itens
    if (sessionStorage.getItem('session_token') === null && localStorageToken !== null) {
      sessionStorage.setItem('session_user_info', localStorage.getItem('session_user_info')!!);
      sessionStorage.setItem('session_user', localStorage.getItem('session_user')!!);
      sessionStorage.setItem('session_user_is_zabbix_admin', localStorage.getItem('session_user_is_zabbix_admin')!!);
      sessionStorage.setItem('session_token', localStorageToken);
      sessionStorage.setItem('session_user_SID', sessionUserSID!!);
      // express set cookie of SID (express-session) remove old if exists -> connect.sid
      document.cookie = `connect.sid=${sessionUserSID!!}; path=/; expires=${new Date(new Date().getTime() + Number.MAX_VALUE).toUTCString()}`;
    }

    setIsLoggedIn(sessionStorage.getItem('session_token') !== null);
    setIsZabbixAdmin(sessionStorage.getItem('session_user_is_zabbix_admin') === true.toString());
    // checkDashData();
  }, [isLoggedIn])

  const preparingPanelElement = (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-2xl">Preparando Painel Titan...</p>
      </div>
    </>
  )

  return (
    <FullScreenProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !loadingContent ? (
                isDashAvailable ? (
                  isLoggedIn ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/manutencao" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route
            path="/login"
            element={
              !loadingContent ? (
                isDashAvailable ? (
                  isLoggedIn ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <LoginPage setIsLoggedIn={setIsLoggedIn} />
                  )
                ) : (
                  <Navigate to="/manutencao" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route
            path="/dashboard"
            element={
              !loadingContent ? (
                isDashAvailable ? (
                  isLoggedIn ? (
                    <DashboardLayout setIsLoggedIn={setIsLoggedIn} />
                  ) : (
                    <Navigate to={"/login"} />
                  )
                ) : (
                  <Navigate to="/manutencao" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route
            path="/backup"
            element={
              !loadingContent ? (
                isDashAvailable ? (
                  isLoggedIn ? (
                    <DashboardLayout setIsLoggedIn={setIsLoggedIn} />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/manutencao" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route
            path="/reports"
            element={
              !loadingContent ? (
                isDashAvailable ? (
                  isLoggedIn ? (
                    <DashboardLayout setIsLoggedIn={setIsLoggedIn} />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/manutencao" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route
            path="/admin"
            element={
              !loadingContent ? (
                isLoggedIn && isZabbixAdmin ? (
                  <DashboardLayout setIsLoggedIn={setIsLoggedIn} />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (preparingPanelElement)
            }
          />
          <Route path="/manutencao" element={isDashAvailable ? <Navigate to="/" /> : <MaintenancePage />} />
          <Route path="*" element={isDashAvailable ? <NotFoundPage /> : <Navigate to="/manutencao" />} />
        </Routes>
      </Router>
    </FullScreenProvider>
  );
};

export default App;