// src/components/modals/PanelSettingsModal.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { Layout } from '../DashboardLayout';
import { first, isEmpty } from 'lodash';
import Swal from 'sweetalert2';
import { backendUrl } from '../../App';
import axios from 'axios';
import { popupErrorWarn } from '../../FrontendUtils';
import Stack from '@mui/material/Stack';
import { Skeleton } from '@mui/material';

interface PanelSettingsModalProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
    layouts: Layout[];
    userData: {
        rawData: string;
        name: string;
    };
    panelLayoutData: {
        getLayouts: () => Promise<boolean>;
        setSelectLayout: React.Dispatch<React.SetStateAction<string>>;
    };
    setIsLoggedIn: (loggedIn: boolean) => void
}

// Estilos personalizados para o modal
const customStyles: Modal.Styles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro, meio transparente
        zIndex: 5000, // Z-index alto para garantir que fique acima do conteúdo anterior
    },
    content: {
        top: '50%', // Posição vertical no centro
        left: '50%', // Posição horizontal no centro
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)', // Centraliza o modal
        borderRadius: '5px', // Borda arredondada
        backgroundColor: 'white',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)', // Sombra leve
        maxHeight: '80%',
        overflowY: 'auto'
    },
};

export interface UserPreferences {
    autoUpdatePanelItems: string;
    autoDownloadPDFReportCopy: string;
}

function PanelSettingsModal({ isOpen, setIsOpen, onClose, layouts, userData, panelLayoutData, setIsLoggedIn }: PanelSettingsModalProps) {
    const handleClose = () => {
        onClose();
    };

    // Configuração do alerta de atualização de dados
    const UpdatingDataAlert = Swal.mixin({
        toast: false,
        position: 'center',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: '300px',
    });

    // Preferências do Usuário - Início
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

    const updateUserPreferencesToServer = async () => {
        try {
            const sID = sessionStorage.getItem('session_user_SID');
            const updatePreferencesResponse = await axios.post(`${backendUrl}/userpreferences/update`, {
                sID: sID,
                prefs: userPreferences
            });
            const updatePreferencesResponseData = updatePreferencesResponse.data;
            if (!updatePreferencesResponseData.success) {
                onClose();
                if (updatePreferencesResponseData.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao atualizar as preferências do usuário.', updatePreferencesResponseData.error);
                } else {
                    setIsLoggedIn(false);
                }
            }
        } catch (err) {
            onClose();
            popupErrorWarn('Um erro ocorreu ao atualizar as preferências do usuário. A API Titan parece estar indisponível no momento.', err);
        }
    };

    const fetchUserPreferences = async () => {
        try {
            const sID = sessionStorage.getItem('session_user_SID');
            const getPreferencesResponse = await axios.get(`${backendUrl}/userpreferences/get`, {
                params: {
                    sID: sID
                }
            });
            const getPreferencesResponseData = getPreferencesResponse.data;
            if (getPreferencesResponseData.success) {
                setUserPreferences(getPreferencesResponseData.prefs);
            } else {
                onClose();
                if (getPreferencesResponseData.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao buscar as preferências do usuário.', getPreferencesResponseData.error);
                } else {
                    setIsLoggedIn(false);
                }
            }
        } catch (err) {
            onClose();
            popupErrorWarn('Um erro ocorreu ao buscar as preferências do usuário. A API Titan parece estar indisponível no momento.', err);
        }
    };

    useEffect(() => {
        if (!userPreferences) return
        updateUserPreferencesToServer();
    }, [userPreferences]);

    useEffect(() => {
        if (!isOpen) {
            setUserPreferences(null);
        } else if (!userPreferences) {
            setTimeout(() => {
                fetchUserPreferences();
            }, 500);
        }
    }, [isOpen]);
    // Preferências do Usuário - Fim

    // Layots - Início
    const [layoutName, setLayoutName] = useState('');

    const handleDeleteLayout = async () => {
        onClose();

        UpdatingDataAlert.fire({
            title: `Deletando layout '${layoutName}'...`,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const sID = sessionStorage.getItem('session_user_SID')!!;
            const deleteResponse = await axios.post(`${backendUrl}/layouts/delete`, {
                sID: sID,
                layoutCustomName: layoutName
            });
            const deleteResponseData = deleteResponse.data;

            await panelLayoutData.getLayouts();
            if (deleteResponseData.success) {
                setLayoutName(first(layouts)?.name || '');
                Swal.fire({
                    title: `Layout '${deleteResponseData.layoutName}' deletado!`,
                    text: 'Esse layout não aparecerá mais em Layout.',
                    icon: 'warning',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#19bf4e'
                }).then(() => {
                    setIsOpen(true);
                });
            } else {
                if (deleteResponseData.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao deletar o layout.', deleteResponseData.error, () => {
                        setIsOpen(true);
                    });
                } else {
                    setIsLoggedIn(false);
                }
            }
        } catch (err) {
            popupErrorWarn('Um erro ocorreu ao deletar o layout. A API Titan parece estar indisponível no momento.', err, () => {
                setIsOpen(true);
            });
        }
    }

    const handleRenameLayout = async () => {
        onClose();

        const { value: newLayoutName } = await Swal.fire({
            icon: 'question',
            title: 'Informe o Novo Nome',
            input: 'text',
            inputLabel: `Insira o novo nome que o layout '${layoutName}' receberá.`,
            inputPlaceholder: 'Novo Nome do Layout',
            showCancelButton: true,
            confirmButtonText: 'Renomear',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#19bf4e',
            cancelButtonColor: 'red'
        });
        if (!newLayoutName) {
            setIsOpen(true);
            return;
        }

        UpdatingDataAlert.fire({
            title: 'Renomeando layout...',
            didOpen: () => {
                UpdatingDataAlert.showLoading();
            },
        });

        try {
            const sID = sessionStorage.getItem('session_user_SID')!!;
            const renameResponse = await axios.post(`${backendUrl}/layouts/rename`, {
                sID: sID,
                layoutName: layoutName,
                newLayoutName: newLayoutName
            });
            const renameResponseData = renameResponse.data;

            await panelLayoutData.getLayouts();
            if (renameResponseData.success) {
                setLayoutName(first(layouts)?.name || '');
                Swal.fire({
                    title: 'Layout renomeado com sucesso!',
                    text: `O layout foi renomeado de '${renameResponseData.oldLayoutName}' para '${renameResponseData.layoutName}'.`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#19bf4e'
                }).then(() => {
                    setIsOpen(true);
                });
            } else {
                if (renameResponseData.errorId !== -2) {
                    popupErrorWarn('Um erro ocorreu na API Titan ao renomear o layout.', renameResponseData.error, () => {
                        setIsOpen(true);
                    });
                } else {
                    setIsLoggedIn(false);
                }
            }
        } catch (err) {
            popupErrorWarn('Um erro ocorreu ao renomear o layout. A API Titan parece estar indisponível no momento.', err, () => {
                setIsOpen(true);
            });
        }
    }

    useEffect(() => {
        setLayoutName(first(layouts)?.name || '')
    }, [layouts])
    // Layots - Fim

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            contentLabel="Configurações"
            ariaHideApp={false} // Deve ser false
           // preventScroll={true}
            closeTimeoutMS={400}
            style={customStyles} // Aplica os estilos personalizados ao modal
        >
            <div id='settings-modal'>
                <h3>Configurações</h3>

                <div
                    id='settings-modal-options'
                    style={{
                        display: 'left',
                        justifyContent: 'left',
                        alignItems: 'left',
                        textAlign: 'left',
                        height: '100%',
                        width: '100%',
                        paddingTop: '25px',
                        paddingBottom: '25px',
                        paddingLeft: '5%',
                        paddingRight: '5%'
                    }}
                >
                    {
                        !userPreferences ? (<>
                            <Stack>
                                <Skeleton variant="text" style={{ marginLeft: '10%', marginBottom: '3%', fontSize: '20px' }} width={180} />
                            </Stack>
                            <Stack alignItems={'center'}>
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={280} height={35} />
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={300} height={45} />
                            </Stack>
                            <br />
                            <Stack alignItems={'center'}>
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={280} height={35} />
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={300} height={45} />
                            </Stack>
                            <br /> <br />
                            <Stack>
                                <Skeleton variant="text" style={{ marginLeft: '10%', marginBottom: '3%', fontSize: '20px' }} width={180} />
                            </Stack>
                            <Stack alignItems={'center'}>
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={280} height={35} />
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={300} height={45} />
                            </Stack>
                            <br />
                            <Stack alignItems={'center'}>
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={280} height={35} />
                                <Skeleton variant="text" style={{ textAlign: 'left', marginLeft: '1%', fontSize: '15px' }} width={300} height={45} />
                            </Stack>
                        </>) : (<>
                            <p style={{ paddingLeft: '10%', paddingBottom: '3%', fontSize: '20px', color: '#494a4d' }}>• Dashboard</p>
                            <div
                                id='settings-modal-options-manage-panel'
                                style={{
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    height: '100%',
                                    paddingLeft: '20%',
                                    paddingRight: '20%',
                                    paddingBottom: '2%'
                                }}
                            >
                                <p style={{ textAlign: 'left', paddingLeft: '1%', fontSize: '15px' }}>Auto atualizar os dados dos elementos de monitoramento: </p>
                                <select
                                    className="form-select"
                                    id='update-panel-timestamps'
                                    style={{ marginRight: '15px', borderRadius: '5px' }}
                                    aria-label="Selecione o período de tempo para atualizar os itens"
                                    value={userPreferences?.autoUpdatePanelItems || 'loading'}
                                    onChange={(e) => {
                                        if (e.target.value === 'loading') return
                                        setUserPreferences({
                                            ...userPreferences!!,
                                            autoUpdatePanelItems: e.target.value,
                                        })
                                    }}
                                >
                                    {
                                        userPreferences ? <>
                                            <option value='30'>
                                                A cada 30 segundos
                                            </option>
                                            <option value='60'>
                                                A cada 1 minuto
                                            </option>
                                            <option value='300'>
                                                A cada 5 minutos
                                            </option>
                                            <option value='600'>
                                                A cada 10 minutos
                                            </option>
                                            <option value='0'>
                                                Nunca
                                            </option>
                                        </> : <>
                                            <option value='loading'>
                                                Carregando...
                                            </option>
                                        </>
                                    }
                                </select>
                            </div>
                            <div
                                id='settings-modal-options-manage-layouts'
                                style={{
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    height: '100%',
                                    paddingLeft: '20%',
                                    paddingRight: '20%',
                                    paddingTop: '3%'
                                }}
                            >
                                <p style={{ textAlign: 'left', paddingLeft: '1%', fontSize: '15px' }}>Seus layouts customizados:</p>
                                {isEmpty(layouts) ? (
                                    <>
                                        <p style={{ fontSize: '13px' }}>Ops! Você ainda não possui layouts para gerenciar.</p>
                                    </>
                                ) : (
                                    <>
                                        <select
                                            className="form-select"
                                            id='personal-layouts'
                                            style={{ marginRight: '15px', borderRadius: '5px' }}
                                            aria-label="Selecione o layout para gerenciar"
                                            value={layoutName}
                                            onChange={(e) => {
                                                setLayoutName(e.target.value);
                                            }}
                                        >
                                            {layouts.map((option, index) => (
                                                <option key={index} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p style={{ paddingLeft: '1%', paddingTop: '1%', paddingBottom: '1%', fontSize: '15px' }}>
                                            Com o layout selecionado '{layoutName}':
                                        </p>
                                        <button type="button"
                                            className="btn"
                                            style={{
                                                backgroundColor: 'gray',
                                                color: 'white',
                                                marginRight: '10px'
                                            }}
                                            onClick={handleRenameLayout}
                                        >
                                            Renomear
                                        </button>
                                        <button type="button"
                                            className="btn"
                                            style={{
                                                backgroundColor: 'red',
                                                color: 'white'
                                            }}
                                            onClick={handleDeleteLayout}
                                        >
                                            Deletar
                                        </button>
                                    </>
                                )}
                            </div>
                            <hr style={{ marginLeft: '10%', width: '80%', border: 'none', borderTop: '0.5px solid black' }} />
                            <p style={{ paddingLeft: '10%', paddingBottom: '3%', fontSize: '20px', color: '#494a4d' }}>• Relatórios</p>
                            <div
                                id='settings-modal-options-report-settings'
                                style={{
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    height: '100%',
                                    paddingLeft: '20%',
                                    paddingRight: '20%',
                                    paddingBottom: '2%'
                                }}
                            >
                                <p style={{ textAlign: 'left', paddingLeft: '1%', fontSize: '15px' }}>Baixar automaticamente uma cópia do PDF ao enviar um relatório por email: </p>
                                <select
                                    className="form-select"
                                    id='auto-download-pdf-copy-preference'
                                    style={{ marginRight: '15px', borderRadius: '5px' }}
                                    aria-label="Selecione a preferência de download"
                                    value={userPreferences?.autoDownloadPDFReportCopy || 'ask'}
                                    onChange={(e) => {
                                        if (e.target.value === 'loading') return
                                        setUserPreferences({
                                            ...userPreferences!!,
                                            autoDownloadPDFReportCopy: e.target.value
                                        })
                                    }}
                                >
                                    {
                                        userPreferences ? <>
                                            <option value='always'>
                                                Sempre baixar
                                            </option>
                                            <option value='ask'>
                                                Perguntar sempre para baixar
                                            </option>
                                            <option value='never'>
                                                Nunca baixar
                                            </option>
                                        </> : <>
                                            <option value='loading'>
                                                Carregando...
                                            </option>
                                        </>
                                    }
                                </select>
                            </div>
                        </>)
                    }
                </div>

                <div className="modal-footer" style={{ paddingTop: '15px', paddingLeft: '500px' }}>
                    <button type="button"
                        className="btn"
                        style={{
                            backgroundColor: '#494a4d',
                            color: 'white'
                        }}
                        onClick={handleClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default PanelSettingsModal;