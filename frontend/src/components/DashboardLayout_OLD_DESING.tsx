// // src/components/DashboardLayout.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import '../css/Dashboard.css'; // CSS principal
// import axios from 'axios';
// import { backendUrl, zabbixApiUrl } from '../App';
// import Swal from 'sweetalert2';
// import { FullScreenProvider, useFullScreen } from './extras/FullScreenContext';
// import { CSSTransition } from 'react-transition-group';
// import '../css/EditUserModal.css'; // CSS do modal de editar usuário

// import DashDefault from './templates/DashDefault';
// import DashSQL from './templates/DashSQL';
// import BackupPage from './BackupPage';
// import EditUserModal from './modals/PanelSettingsModal';
// import ReportsPage from './ReportsPage';
// import PanelFooterComponent from './extras/PanelFooterComponent';
// import AdminPage from './AdminPage';
// import { popupErrorWarn } from '../FrontendUtils';

// import GraphicForm from "./builderTemplates/GraphicForm"
// import withReactContent from 'sweetalert2-react-content';
// /**
//  * Tipos de servidores monitorados pelo Zabbix suportados pelo MigraTITitanPanel.
//  *
//  * Obs: É possível adicionar novos tipos, mas é necessário criar uma classe
//  * dentro de src/templates para o novo tipo e ajustar o código aqui para suportá-lo.
//  */
// export enum ServerType {
//     SQLSERVER = 'SQLSERVER',
//     ORACLE = 'ORACLE',

//     // Qualquer servidor que não se encaixe nos tipos acima.
//     // Esse template mostra itens que todo servidor tem no Zabbix da MigraTI, como os discos.
//     DEFAULT = 'DEFAULT'
// }

// const DashboardLayout: React.FC<{ setIsLoggedIn: (loggedIn: boolean) => void }> = ({ setIsLoggedIn }) => {
//     const location = useLocation();
//     const navigate = useNavigate();

//     // Configuração do alerta para atualização de dados
//     const UpdatingDataAlert = Swal.mixin({
//         toast: false,
//         position: 'center',
//         showConfirmButton: false,
//         allowOutsideClick: false,
//         width: '300px',
//     });

//     const MySwal = withReactContent(Swal);

//     const showGraphicFormModal = async () => {
//         const { value: newLayoutName } = await MySwal.fire({
//           icon: 'info',
//           title: 'Novo Layout',
//           html: '<div id="graphic-form-container"></div>', // Contêiner para o componente React
//           inputPlaceholder: 'Nome do Layout',
//           showCancelButton: true,
//           confirmButtonText: 'Criar',
//           cancelButtonText: 'Cancelar',
//           confirmButtonColor: '#19bf4e',
//           cancelButtonColor: 'red',
//           customClass: {
//             container: 'custom-swal-width'
//           },
//           didOpen: () => {
//             // Monte o componente React no contêiner
//             ReactDOM.render(<GraphicForm 
//                                 serverId={selectedServer} 
//                                 serverName={selectedServerName} 
//                                 isAdmPage={false} 
//                                 onSubmit={() => MySwal.clickConfirm()}/>, document.getElementById('graphic-form-container'));
//           },
//           willClose: () => {
//             // Desmonte o componente React quando o modal fechar
//             ReactDOM.unmountComponentAtNode(document.getElementById('graphic-form-container')!);
//           }
//         });
    
//         if (newLayoutName) {
//           // Faça algo com o nome do layout
//           console.log('Nome do Layout:', newLayoutName);
//         }
//     };

//     // Configuração do toast de informações gerais
//     const GeneralInfoToast = Swal.mixin({
//         toast: true,
//         position: 'top-end',
//         showConfirmButton: false,
//     });

//     // Função para lidar com o logout do usuário
//     const handleLogout = () => {
//         GeneralInfoToast.fire({
//             title: 'Deslogando...',
//             didOpen: () => {
//                 GeneralInfoToast.showLoading();
//             }
//         });
//         logoutUser();
//     };

//     // Função para realizar o logout do usuário
//     const logoutUser = async () => {
//         const SID = sessionStorage.getItem('session_user_SID')!!;
//         try {
//             const apiLogoutResult = await axios.post(`${backendUrl}/auth/logout`, {
//                 sID: SID
//             });
//             const apiLogoutResultData = apiLogoutResult.data;
//             if (!apiLogoutResultData.success) {
//                 if (apiLogoutResultData.errorId !== -2) {
//                     popupErrorWarn('Um erro ocorreu na API Titan ao tentar encerrar a sessão atual.', apiLogoutResultData.error);
//                 } else {
//                     setIsLoggedIn(false);
//                 }
//                 return
//             }
//             localStorage.removeItem('session_token');
//             sessionStorage.clear();
//             sessionStorage.setItem('justloguedout', 'true');
//             setIsLoggedIn(false);

//             navigate('/login'); // Redireciona para a página de login
//         } catch (err) {
//             popupErrorWarn('Um erro ocorreu ao tentar encerrar a sessão atual. A API Titan parece estar indisponível no momento.', err);
//         }
//     };

//     // Configuração do modo tela cheia
//     const { isFullScreen, setIsFullScreen } = useFullScreen();

//     const toggleFullScreen = () => {
//         setIsFullScreen(!isFullScreen);
//     };

//     useEffect(() => {
//         if (isFullScreen) {
//             document.body.classList.add('no-scroll');
//         } else {
//             document.body.classList.remove('no-scroll');
//         }

//         return () => {
//             document.body.classList.remove('no-scroll');
//         };
//     }, [isFullScreen]);

//     // Referência para o intervalo utilizado para atualização automática
//     const intervalRef = useRef<NodeJS.Timeout | null>(null);

//     // Função interna para buscar as opções dos servidores
//     async function internalFetchOptions() {
//         UpdatingDataAlert.fire({
//             title: "Carregando..."
//         });
//         UpdatingDataAlert.showLoading();
//         if (await fetchOptions()) {
//             UpdatingDataAlert.close();
//         }
//     };

//     // Na primeira vez que o painel é acesso, o DashboardLayout se encarrega de buscar os servidores
//     // Depois, o próprio template invocado através do renderComponentBasedOnRoute() fica responsável por essa atualização
//     useEffect(() => {
//         internalFetchOptions();
//     }, []);

//     // Estado para o servidor selecionado
//     const [selectedServer, setSelectedServer] = useState('');
//     const [selectedServerName, setSelectedServerName] = useState('');
//     const [selectedServerType, setSelectedServerType] = useState('');
//     const [servers, setServers] = useState<[] | null>(null);
//     const [layouts, setLayouts] = useState<Layout[] | null>(null);
//     const [layout, setLayout] = useState<Layout | null>(null);
//     const [selectLayout, setSelectLayout] = useState('');

//     // Função para buscar as opções dos servidores
//     const fetchOptions = async (): Promise<boolean> => {
//         try {
//             const zabbixApiAuth = sessionStorage.getItem('session_token')
//             if (zabbixApiAuth) {
//                 const requestData = {
//                     jsonrpc: '2.0',
//                     method: 'host.get',
//                     params: {
//                         output: [
//                             'hostid',
//                             'name'
//                         ],
//                         selectedInterfaces: [
//                             'interfaceid',
//                             'ip'
//                         ],
//                         selectParentTemplates: [
//                             'name'
//                         ],
//                         filter: {
//                             // Filtra apenas hosts que estão sendo monitorados (status 0)
//                             'status': '0'
//                         }
//                     },
//                     id: 1,
//                     auth: zabbixApiAuth
//                 };

//                 // Faz a requisição para a API do Zabbix
//                 const response = await axios.post(zabbixApiUrl, requestData);
//                 const data = response.data.result;

//                 // Extrai e formata as opções da resposta da API
//                 const newServers = data.map((s: any) => {
//                     if (s.parentTemplates && s.parentTemplates.length > 0) {
//                         for (const template of s.parentTemplates) {
//                             if (template.name.includes('SQLSERVER')) {
//                                 return {
//                                     value: s.hostid,
//                                     label: s.name,
//                                     type: ServerType.SQLSERVER,
//                                 };
//                             } else if (template.name.includes('ORACLE')) {
//                                 return {
//                                     value: s.hostid,
//                                     label: s.name,
//                                     type: ServerType.ORACLE,
//                                 };
//                             }
//                         }
//                     }

//                     return {
//                         value: s.hostid,
//                         label: s.name,
//                         type: ServerType.DEFAULT,
//                     };
//                 });
                
//                 setServers(newServers);
//                 if (sessionStorage.getItem('panel_selected_server') !== selectedServer) {
//                     sessionStorage.setItem('panel_selected_server', newServers[0].value.toString());
//                     setSelectedServer(newServers[0].value);
//                     setSelectedServerName(newServers[0].label);
//                     setSelectedServerType(newServers[0].type);
//                 }
//                 return await getLayouts();
//             }
//             return false
//         } catch (err) {
//             setSelectedServer('');
//             setSelectedServerName('');
//             setSelectedServerType('');
//             setServers(null);
//             popupErrorWarn('Um erro ocorreu ao buscar os servidores associados ao seu usuário. A API Titan parece estar indisponível no momento.', err);
//             return false
//         }
//     }

//     // Função para buscar os layouts personalizados do usuário baseado no tipo do servidor selecionado
//     async function getLayouts(): Promise<boolean> {
//         try {
//             const sID = sessionStorage.getItem('session_user_SID');
//             if (sID) {
//                 const res = await axios.get(`${backendUrl}/layouts/list`, {
//                     params: {
//                         sID,
//                         selectedServerType
//                     }
//                 })

//                 if (res.data.success) {
//                     setLayouts(res.data.layouts.map((layout: any) => {
//                         return {
//                             name: layout.name,
//                             layout: JSON.parse(layout.layout),
//                             serverID: layout.serverID,
//                             serverName: layout.serverName,
//                             serverType: layout.serverType
//                         }
//                     }));
//                 } else {
//                     setLayouts(null);
//                     setLayout(null);
//                     setSelectLayout('');
//                     if (res.data.errorId !== -2) {
//                         popupErrorWarn('Um erro ocorreu na API Titan ao buscar os layouts personalizados associados ao seu usuário.', res.data.error);
//                         return false
//                     } else {
//                         setIsLoggedIn(false);
//                     }
//                 }
//             }
//             return true
//         } catch (err) {
//             setLayouts(null);
//             setLayout(null);
//             setSelectLayout('');
//             popupErrorWarn('Um erro ocorreu ao buscar os layouts personalizados associados ao seu usuário. A API Titan parece estar indisponível no momento.', err);
//             return false
//         }
//     }

//     // Função para lidar com a mudança na seleção do servidor
//     const handleSelectChange = async (event: { target: { value: string; }; }) => {
//         const selectedValue = event.target.value;
//         sessionStorage.setItem('panel_selected_server', selectedValue);
//         console.log("DashboardLayout - handleSelectChange\n", selectedValue);

//         setSelectedServer(selectedValue);

//         const selectedServerObject = servers ? servers.find(server => server['value'] === selectedValue) : null;
//         if (selectedServerObject) {
//             setSelectedServerName(selectedServerObject['label']);
//             setSelectedServerType(selectedServerObject['type']);
//             await getLayouts();
//         }
//     };

//     // Função para renderizar o componente com base na rota
//     const renderComponentBasedOnRoute = () => {
//         switch (location.pathname) {
//             case "/dashboard": {
//                 if (selectedServerType === ServerType.SQLSERVER) {
//                     return <DashSQL FetchServersFromZabbix={fetchOptions} selectedServer={selectedServer}
//                         selectedServerName={selectedServerName} isFullScreen={isFullScreen}
//                         toggleFullScreen={toggleFullScreen} intervalRef={intervalRef} selectedLayout={layout} />;
//                 } else if (selectedServerType === ServerType.ORACLE) {
//                     return <DashDefault FetchServersFromZabbix={fetchOptions} selectedServer={selectedServer}
//                         selectedServerName={selectedServerName} isFullScreen={isFullScreen}
//                         toggleFullScreen={toggleFullScreen} intervalRef={intervalRef}
//                         selectedLayout={layout}></DashDefault>; // Mudar isso!
//                 } else if (selectedServerType === ServerType.DEFAULT) {
//                     return <DashDefault FetchServersFromZabbix={fetchOptions} selectedServer={selectedServer}
//                         selectedServerName={selectedServerName} isFullScreen={isFullScreen}
//                         toggleFullScreen={toggleFullScreen} intervalRef={intervalRef}
//                         selectedLayout={layout}></DashDefault>;
//                 } else {
//                     break;
//                     // Não renderiza nada durante o carregamento
//                 }
//             }

//             case "/backup": {
//                 return <BackupPage FetchServersFromZabbix={fetchOptions} selectedServer={selectedServer} selectedServerName={selectedServerName} />;
//             }

//             case "/reports": {
//                 return <ReportsPage fetchServersFromZabbix={fetchOptions} selectedServer={selectedServer} selectedServerName={selectedServerName} setIsLoggedIn={setIsLoggedIn} />;
//             }

//             case "/admin": {
//                 return <AdminPage FetchServersFromZabbix={fetchOptions} allServersNames={servers?.map(s => s['label']) ?? []} setIsLoggedIn={setIsLoggedIn} />;
//             }
//         }
//     };

//     // Opções do EditUserModal
//     const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

//     const openUserEditModal = () => {
//         setIsEditUserModalOpen(true);
//     };

//     const userData = {
//         rawData: sessionStorage.getItem('session_user_info')!!,
//         name: sessionStorage.getItem('session_user')!!,
//     };

//     return (
//         <>
//             <CSSTransition
//                 in={isEditUserModalOpen}
//                 timeout={300}
//                 classNames="dialog"
//             >
//                 <EditUserModal
//                     isOpen={isEditUserModalOpen}
//                     setIsOpen={setIsEditUserModalOpen}
//                     onClose={() => setIsEditUserModalOpen(false)}
//                     layouts={layouts || []} userData={userData}
//                     panelLayoutData={{
//                         getLayouts: getLayouts,
//                         setSelectLayout: setSelectLayout
//                     }}
//                     setIsLoggedIn={setIsLoggedIn}
//                 />
//             </CSSTransition>
//             <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
//                 <a className="navbar-brand ps-3">MigraTI | Titan</a>
//                 {/*
//                 <div style={{ paddingLeft: '8px' }}>
//                     <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
//                         <li className="nav-item dropdown">
//                             <a className="nav-link" id="navbarDropdown" role="button" data-bs-toggle="dropdown"
//                                 aria-expanded="false"><i className="fas fa-bell"></i></a>
//                             <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
//                                 <h5 style={{ marginLeft: '10px' }}>Notificações</h5>
//                                 <li>
//                                     <hr className="dropdown-divider" />
//                                 </li>
//                                 <li><span className="dropdown-item"><h6>Notificação Teste</h6><br />Fodaaaaa</span></li>
//                             </ul>
//                         </li>
//                     </ul>
//                 </div>
//                 */}
//                 {location.pathname !== '/dashboard' ? <></> : (
//                     <>
//                         <button
//                             className="btn btn-link btn-sm text-white"
//                             onClick={toggleFullScreen}
//                             title='Exibir dashboard em Modo de Monitoramento'
//                         >
//                             <i className='fas fa-expand'></i>
//                         </button>
//                     </>
//                 )}
//                 <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
//                     {
//                         location.pathname !== '/admin' ? (
//                             <>
//                                 <div className="input-group">
//                                     <div className="input-group-prepend">
//                                         <span className="input-group-text bg-transparent border-0 text-white"><i
//                                             className="fas fa-solid fa-cloud me-1"></i> Servidor</span>
//                                     </div>
//                                     <select
//                                         className="form-select"
//                                         style={{ marginRight: '15px', borderRadius: '5px' }}
//                                         value={selectedServer}
//                                         onChange={handleSelectChange}
//                                         aria-label="Selecione o servidor desejado"
//                                     >
//                                         {servers ? (
//                                             <>
//                                                 {servers.map((option, index) => (
//                                                     <option key={index} value={option['value']}>
//                                                         {option['label']}
//                                                     </option>
//                                                 ))}
//                                             </>
//                                         ) : (
//                                             <option value="loading">Carregando...</option>
//                                         )}
//                                     </select>
//                                     {location.pathname === '/dashboard' ? (
//                                         <>
//                                             < div className="input-group-prepend">
//                                                 <span className="input-group-text bg-transparent border-0 text-white"><i
//                                                     className="fas fa-chart-bar me-1"></i> Layout</span>
//                                             </div>
//                                             <select
//                                                 className="form-select"
//                                                 style={{ marginRight: '15px', borderRadius: '5px' }}
//                                                 value={layout?.name || 'loading'}
//                                                 onChange={async (e) => {
//                                                     const selectedLayoutName = e.target.value
//                                                     const selectedLayout = layouts ? layouts.find((layout) => layout.name === selectedLayoutName) : null;
//                                                     const t = {
//                                                         name: "Padrão",
//                                                         layout: JSON.parse("[{\"w\":1,\"h\":1,\"x\":0,\"y\":0,\"i\":\"disk-25962\",\"moved\":false,\"static\":false},{\"w\":1,\"h\":1,\"x\":0,\"y\":1,\"i\":\"sql-used-memory-in-sql-server-disksquare\",\"moved\":false,\"static\":false},{\"w\":1,\"h\":1,\"x\":0,\"y\":2,\"i\":\"sql-buffer-cache-disksquare\",\"moved\":false,\"static\":false},{\"w\":1,\"h\":1,\"x\":0,\"y\":3,\"i\":\"sql-processor-time-disksquare\",\"moved\":false,\"static\":false},{\"w\":1,\"h\":1,\"x\":0,\"y\":4,\"i\":\"sql-transactions-per-second-customchart\",\"moved\":false,\"static\":false},{\"w\":1,\"h\":1,\"x\":0,\"y\":5,\"i\":\"custom-chart-0\",\"moved\":false,\"static\":false}]"),
//                                                         serverID: "",
//                                                         serverName: "",
//                                                         serverType: ""
//                                                     }
//                                                     if (selectedLayout) {
//                                                         sessionStorage.setItem('userLayout_' + selectedServer, JSON.stringify(selectedLayout.layout));
//                                                         setSelectLayout(selectedLayout.name);
//                                                         setLayout(selectedLayout);
//                                                     } else if (selectedLayoutName != "new-layout") {
//                                                         sessionStorage.setItem('userLayout_' + selectedServer, JSON.stringify(t.layout));
//                                                         setSelectLayout(t.name);
//                                                         setLayout(t);
//                                                     } else { // Ele clicou na opção 'new-layout', isso vai iniciar o processo para salvar o layout atual.
//                                                         setTimeout(() => {
//                                                             if (layout) {
//                                                                 setSelectLayout(layout.name);
//                                                             } else {
//                                                                 setSelectLayout(t.name);
//                                                             }
//                                                         }, 300)

//                                                         showGraphicFormModal();

//                                                         // const { value: newLayoutName } = await Swal.fire({
//                                                         //     icon: 'question',
//                                                         //     title: 'Informe o Nome do Layout',

//                                                         //     input: 'text',
//                                                         //     inputLabel: 'Insira o nome que este layout receberá.',
//                                                         //     inputPlaceholder: 'Nome do Layout',
//                                                         //     showCancelButton: true,
//                                                         //     confirmButtonText: 'Criar',
//                                                         //     cancelButtonText: 'Cancelar',
//                                                         //     confirmButtonColor: '#19bf4e',
//                                                         //     cancelButtonColor: 'red'
//                                                         // });
//                                                         // if (!newLayoutName) return

//                                                         // UpdatingDataAlert.fire({
//                                                         //     title: "Salvando layout..."
//                                                         // });
//                                                         // UpdatingDataAlert.showLoading();

//                                                         // const sID = sessionStorage.getItem('session_user_SID')!!;
//                                                         // const layoutString = sessionStorage.getItem('userLayout_' + selectedServer)!!;
//                                                         // const response = await axios.post(`${backendUrl}/layouts/create`, {
//                                                         //     layout: layoutString,
//                                                         //     sID: sID,
//                                                         //     serverID: selectedServer,
//                                                         //     serverName: selectedServerName,
//                                                         //     serverType: selectedServerType,
//                                                         //     layoutCustomName: "AQYUUU"//newLayoutName
//                                                         // });

//                                                         // await getLayouts();
//                                                         // if (response.data.success) {
//                                                         //     setSelectLayout(response.data.layoutName);
//                                                         //     Swal.fire({
//                                                         //         title: `Layout '${response.data.layoutName}' salvo!`,
//                                                         //         text: 'Você pode selecioná-lo em Layout.',
//                                                         //         icon: 'success',
//                                                         //         confirmButtonText: 'OK',
//                                                         //         confirmButtonColor: '#19bf4e'
//                                                         //     });
//                                                         // } else {
//                                                         //     console.log(response.data.error);
//                                                         //     Swal.fire({
//                                                         //         title: 'Ops...',
//                                                         //         text: 'Um erro ocorreu ao salvar o layout.',
//                                                         //         icon: 'error',
//                                                         //         confirmButtonText: 'OK',
//                                                         //         confirmButtonColor: 'red'
//                                                         //     });
//                                                         // }
//                                                     }
//                                                 }}
//                                                 aria-label="Selecione o layout desejado"
//                                             >
//                                                 {layouts ? (
//                                                     <>
//                                                         <option value="Padrão">Padrão</option>
//                                                         {layouts.map((option, index) => (
//                                                             <option key={index} value={option.name}>{option.name}</option>
//                                                         ))}
//                                                     </>
//                                                 ) : (
//                                                     <option value="loading">Carregando...</option>
//                                                 )} {
//                                                     <option value="new-layout">Novo layout...</option>
//                                                 }
//                                             </select>
//                                         </>
//                                     ) : (<></>)}
//                                 </div>
//                             </>
//                         ) : (<>
//                             <p>Só admins como você podem acessar as Configurações do Painel.</p>
//                         </>)
//                     }
//                 </form>
//                 <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
//                     <li className="nav-item dropdown">
//                         <a className="nav-link" id="navbarDropdown" role="button" data-bs-toggle="dropdown"
//                             aria-expanded="false"><i className="fas fa-solid fa-bars"></i></a>
//                         <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
//                             <li><span className="dropdown-item">Usuário Titan<br /> <i
//                                 className="fas fa-user fa-fw"></i> {sessionStorage.getItem('session_user')}</span></li>
//                             <li>
//                                 <hr className="dropdown-divider" />
//                             </li>
//                             <li><a className="dropdown-item dropdown-item-clickable" onClick={openUserEditModal}><i
//                                 className="fas fa-solid fa-sliders"></i> Configurações</a></li>
//                             <li><a className="dropdown-item dropdown-item-clickable" onClick={handleLogout}><i
//                                 className="fas fa-sign-out-alt"></i> Deslogar</a></li>
//                         </ul>
//                     </li>
//                 </ul>
//             </nav>
//             <div id="layoutSidenav">
//                 <div id="layoutSidenav_nav">
//                     <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
//                         <div className="sb-sidenav-menu">
//                             <div className="nav">
//                                 <div className="sb-sidenav-menu-heading">Serviços Titan</div>
//                                 <Link to="/dashboard"
//                                     className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
//                                     <div className="sb-nav-link-icon"><i className="fas fa-tachometer-alt"></i></div>
//                                     Dashboard
//                                 </Link>
//                                 <Link to="/backup"
//                                     className={`nav-link ${location.pathname === '/backup' ? 'active' : ''}`}>
//                                     <div className="sb-nav-link-icon"><i className="fas fa-table"></i></div>
//                                     Backup
//                                 </Link>
//                                 <Link to="/reports"
//                                     className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>
//                                     <div className="sb-nav-link-icon"><i className="fas fa-chart-area"></i></div>
//                                     Relatórios
//                                 </Link>
//                             </div>
//                             {
//                                 sessionStorage.getItem('session_user_is_zabbix_admin') === 'true' ?
//                                     (<>
//                                         <div className="nav">
//                                             <div className="sb-sidenav-menu-heading">Admin</div>
//                                             <Link to="/admin"
//                                                 className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
//                                                 <div className="sb-nav-link-icon"><i className="fas fa-sliders"></i></div>
//                                                 Config. do Painel
//                                             </Link>
//                                         </div>
//                                     </>) : <></>
//                             }
//                         </div>
//                         <div className="sb-sidenav-footer py-3">
//                             <div className="small">Você está logado como</div>
//                             <i className="fas fa-user fa-fw"></i> {sessionStorage.getItem('session_user')}
//                         </div>
//                     </nav>
//                 </div>
//                 <div id="layoutSidenav_content">
//                     <div className="d-flex flex-column min-vh-100">
//                         <FullScreenProvider>
//                             <main className={`flex-grow-1 ${isFullScreen ? 'fullscreen' : ''}`}>
//                                 {isFullScreen ? (
//                                     <div className="fullscreen-component">
//                                         { /*Renderiza em tela cheia*/
//                                             renderComponentBasedOnRoute()
//                                         }
//                                     </div>
//                                 ) : (
//                                     renderComponentBasedOnRoute() // Renderiza a página necessária conforme a rota (BackupPage, DashSQL, etc.)
//                                 )}
//                             </main>
//                         </FullScreenProvider>
//                         <PanelFooterComponent />
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };

// /*
//         await Layout.create({
//             userId: findU.user.userId,
//             data: JSON.stringify({
//                 layout,
//                 serverID,
//                 serverName,
//                 serverType
//             })
//         })

//         const layouts = await Layout.findAll({
//             where: {
//                 userId: findU.user.userId
//             }
//         })

//         const data = layouts.map((layout) => {
//             // Layout #${layout.id}
//             return {
//                 name: "Layout #"+layout.id,
//                 ...JSON.parse(layout.data)
//             }
//         });
//  */
// export interface Layout {
//     name: string;
//     layout: any[]; // the layout
//     serverID: string;
//     serverName: string;
//     serverType: string;
// }

// export default DashboardLayout;