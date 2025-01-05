// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../css/Login.css';
import '../css/Util.css';
import { backendUrl } from '../App';
import PanelFooterComponent from './extras/PanelFooterComponent';
import { popupErrorWarn } from '../FrontendUtils';

// Componente da página de login
const LoginPage: React.FC<{ setIsLoggedIn: (loggedIn: boolean) => void }> = ({ setIsLoggedIn }) => {
  // Define o título da página
  document.title = "Painel Titan | Fazer Login";

  const navigate = useNavigate();

  // Estados para gerenciar dados do formulário e status do botão
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Função para lidar com a mudança no campo de nome de usuário
  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  // Função para lidar com a mudança no campo de senha
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  // Configuração do Toast de informações gerais
  const GeneralInfoToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
  });

  // Verifica se o usuário acabou de sair e mostra uma mensagem
  if (sessionStorage.getItem('justloguedout') != null) {
    sessionStorage.removeItem('justloguedout');
    GeneralInfoToast.fire({
      icon: 'info',
      title: 'Deslogado com sucesso.',
      timer: 1000 * 2,
      timerProgressBar: true
    });
  }

  // Função para lidar com o botão de login
  const handleLogin = () => {
    if (!username || !password) {
      GeneralInfoToast.fire({
        icon: 'error',
        title: 'Preencha todos os campos.',
        timer: 1000 * 2,
        timerProgressBar: true
      });
      return;
    }

    setButtonDisabled(true);
    GeneralInfoToast.fire({
      title: 'Fazendo login...',
      didOpen: () => {
        GeneralInfoToast.showLoading();
      }
    });
    loginUser(username, password);
  };
  
  // Função para fazer o login do usuário
  const loginUser = async (username: string, password: string) => {
    try {
      const apiLoginResult = await axios.post(`${backendUrl}/auth/login`, {
        user: username,
        password: password
      });
      const apiLoginResultData = apiLoginResult.data;

      if (!apiLoginResultData.success) {
        switch (apiLoginResultData.zabbixErrorCode) {
          case -32602: {
            GeneralInfoToast.fire({
              icon: 'error',
              title: apiLoginResultData.error,
              timer: 1000 * 2,
              timerProgressBar: true
            });
            setButtonDisabled(false);
            return;
          }
          case -32500: {
            GeneralInfoToast.fire({
              icon: 'error',
              title: apiLoginResultData.error,
              timer: 1000 * 2,
              timerProgressBar: true
            });
            setButtonDisabled(false);
            return;
          }
          default: {
            popupErrorWarn('Um erro ocorreu na API Titan ao fazer login.', apiLoginResultData.error);
            setButtonDisabled(false);
            return;
          }
        }
      }

      // Salvar informações do usuário na sessão e no localStorage
      sessionStorage.setItem('session_user_info', apiLoginResultData.data);
      sessionStorage.setItem('session_user', apiLoginResultData.data['username']);
      sessionStorage.setItem('session_user_is_zabbix_admin', apiLoginResultData.data['isZabbixAdmin']);
      sessionStorage.setItem('session_token', apiLoginResultData.data['sessionid']);
      sessionStorage.setItem('session_user_SID', apiLoginResultData.data['SID']);
      // express set cookie of SID (express-session) remove old if exists -> connect.sid
      document.cookie = `connect.sid=${apiLoginResultData.data['SID']}; path=/; expires=${new Date(new Date().getTime() + Number.MAX_VALUE).toUTCString()}`;
      if (rememberMe) {
        localStorage.setItem('session_user_info', apiLoginResultData.data);
        localStorage.setItem('session_user', apiLoginResultData.data['username']);
        localStorage.setItem('session_user_is_zabbix_admin', apiLoginResultData.data['isZabbixAdmin']);
        localStorage.setItem('session_token', apiLoginResultData.data['sessionid']);
        localStorage.setItem('session_user_SID', apiLoginResultData.data['SID']);
      } else {
        localStorage.removeItem('session_user_info');
        localStorage.removeItem('session_user');
        localStorage.removeItem('session_user_is_zabbix_admin');
        localStorage.removeItem('session_token');
        localStorage.removeItem('session_user_SID');
      }
      setIsLoggedIn(true);
      navigate('/dashboard'); // Ir para o dashboard
    } catch (err) {
      popupErrorWarn('Um erro ocorreu ao fazer login. A API Titan parece estar indisponível no momento.', err);
      setButtonDisabled(false);
    }
  };

  // Função para lidar com a tecla Enter pressionada nos campos de usuário e senha
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !buttonDisabled) {
      handleLogin();
    }
  };

  // Renderização do componente de login
  return (
    <div className="limiter">
      <div className="container-login100">
        <div className="logo-container">
          <img src="logo_migrati.png" alt="Logo MigraTI" className="logo" />
        </div>
        <div className="wrap-login100">
          <span className="login100-form-title-1">Painel Titan</span>

          <form className="login100-form validate-form">
            <div className="wrap-input100 validate-input m-b-26" data-validate="O usuário é obrigatório">
              <span className="label-input100"><i className="fas fa-user"></i> Usuário</span>
              <input
                className="input100"
                type="text"
                name="username"
                value={username}
                onChange={handleUsernameChange}
                onKeyPress={handleKeyPress}
                disabled={buttonDisabled}
                placeholder="Usuário do Titan"
              />
              <span className="focus-input100"></span>
            </div>

            <div className="wrap-input100 validate-input m-b-18" data-validate="A senha é obrigatória">
              <span className="label-input100"><i className="fas fa-key"></i> Senha</span>
              <input
                className="input100"
                type="password"
                name="pass"
                value={password}
                onChange={handlePasswordChange}
                onKeyPress={handleKeyPress}
                disabled={buttonDisabled}
                placeholder="Senha do Titan"
              />
              <span className="focus-input100"></span>
            </div>

            <div className="remember-me-container" style={{ paddingLeft: '1%' }}>
              <label htmlFor="remember-me" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={buttonDisabled}
                  style={{ marginRight: '5px' }}
                />
                <a>Continuar logado</a>
              </label>
            </div> 

            <div className="login100-form-btn-container">
              <button className="login100-form-btn" type="button" onClick={handleLogin} disabled={buttonDisabled}>
                {buttonDisabled ? 'Aguarde...' : 'Fazer login'}
              </button>
            </div>

          </form>
        </div>
      </div>
      <PanelFooterComponent />
    </div>
  );
};

export default LoginPage;