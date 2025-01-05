// src/components/modals/ExportReportModal.tsx
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { ServerReport } from '../ReportsPage';
import axios from 'axios';
import { backendUrl, zabbixApiUrl } from '../../App';
import { isEmpty } from 'lodash';
import { UserPreferences } from './PanelSettingsModal';

interface ExportReportModalProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
    seeingReport: ServerReport | null;
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
        // backgroundColor: 'white',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)', // Sombra leve
        maxHeight: '80%',
        overflowY: 'auto'
    },
};

function ExportReportModal({ isOpen, setIsOpen, onClose, seeingReport }: ExportReportModalProps) {
    const handleClose = () => {
        onClose();
    };

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

    // Refs
    const finalConclusionRef = useRef<HTMLTextAreaElement>(null);

    const handleDownloadAsPDF = async () => {
        if (isEmpty(finalConclusion)) {
            GeneralInfoToast.fire({
                icon: 'error',
                title: 'É necessário preencher a Conclusão Geral para exportar o relatório.',
                timer: 3 * 1000,
            });
            return
        }
        onClose();

        UpdatingDataAlert.fire({
            title: 'Exportando PDF...',
        });
        UpdatingDataAlert.showLoading();

        const sID = sessionStorage.getItem('session_user_SID');
        if (sID) {
            const updatedGraphs = seeingReport!!.graphs.filter((g) => includedGraphs.find((ig) => g.graphId === ig.id)?.value || false).map((graph) => {
                const customDescription = customDescriptions.find((customDesc) => customDesc.id === graph.graphId);
                const updatedDescription = customDescription ? customDescription.value : graph.graphDescription;
                return {
                    ...graph,
                    graphDescription: updatedDescription,
                };
            });

            const response = await axios.post(`${backendUrl}/reports/export`, {
                sID: sID,
                re: {
                    ...seeingReport,
                    graphs: updatedGraphs,
                },
                reConclusion: finalConclusion
            }, {
                responseType: 'arraybuffer',
            });

            const serverItemRawResult = await axios.post(zabbixApiUrl, {
                jsonrpc: '2.0',
                method: 'host.get',
                params: {
                    output: ['name'],
                    hostids: [seeingReport?.serverId],
                },
                auth: sessionStorage.getItem('session_token')!!,
                id: 1
            });
            const serverItemResult = serverItemRawResult.data.result;

            if (response.data) {
                Swal.fire({
                    title: `PDF exportado com sucesso!`,
                    text: 'Iniciando download...',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#19bf4e'
                }).then(() => {
                    setIsOpen(true);
                    setTimeout(() => {
                        if (finalConclusionRef.current) {
                            finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                });

                const pdfFile = new File([new Blob([response.data])], `report_server_${serverItemResult[0]?.name || 'unknserver'}_reportid_${seeingReport?.id || 'unknid'}.pdf`, { type: 'application/pdf' });

                const url = URL.createObjectURL(pdfFile);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_server_${serverItemResult[0]?.name || 'unknserver'}_reportid_${seeingReport?.id || 'unknid'}.pdf`;
                a.click();

                // Limpe o objeto de URL
                URL.revokeObjectURL(url);
            } else {
                console.log(response.data.error);
                Swal.fire({
                    title: 'Ops...',
                    text: 'Um erro ocorreu ao exportar o PDF desse relatório.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: 'red'
                }).then(() => {
                    setIsOpen(true);
                    setTimeout(() => {
                        if (finalConclusionRef.current) {
                            finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                });
            }
        } else {
            UpdatingDataAlert.close();
        }
    }

    const handleSendAsPDFToEmail = async () => {
        if (isEmpty(finalConclusion)) {
            GeneralInfoToast.fire({
                icon: 'error',
                title: 'É necessário preencher a Conclusão Geral para exportar o relatório.',
                timer: 3 * 1000,
            });
            return;
        }
        onClose();

        const sID = sessionStorage.getItem('session_user_SID');
        if (sID) {
            const updatedGraphs = seeingReport!!.graphs.filter((g) => includedGraphs.find((ig) => g.graphId === ig.id)?.value || false).map((graph) => {
                const customDescription = customDescriptions.find((customDesc) => customDesc.id === graph.graphId);
                const updatedDescription = customDescription ? customDescription.value : graph.graphDescription;
                return {
                    ...graph,
                    graphDescription: updatedDescription,
                };
            });

            const emails: string[] = [];

            while (emails.length < 5) {
                const { value: email, dismiss, isConfirmed, isDenied } = await Swal.fire({
                    icon: 'question',
                    title: 'Informe o(s) Destinatário(s)',
                    input: 'email',
                    inputLabel: `Insira o email que irá receber o relatório em PDF. (${emails.length + 1}/5)`,
                    inputPlaceholder: 'Email do Destinatário',
                    showCancelButton: true,
                    confirmButtonText: 'Enviar',
                    cancelButtonText: 'Cancelar',
                    showConfirmButton: true,
                    showDenyButton: (emails.length + 1) === 5 ? false : true,
                    denyButtonText: 'Add. Email',
                    confirmButtonColor: '#19bf4e',
                    denyButtonColor: 'orange',
                    cancelButtonColor: 'red',
                    inputValidator: (value) => {
                        if (emails.length === 0 && (!value || !/\S+@\S+\.\S+/.test(value))) {
                            return 'Por favor, digite um endereço de email válido.';
                        }
                    }
                });

                if (isConfirmed && email) {
                    emails.push(email);
                    break;
                }

                if (dismiss) {
                    setIsOpen(true);
                    setTimeout(() => {
                        if (finalConclusionRef.current) {
                            finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                    return;
                }

                if (isDenied) {
                    const addedEmail = await Swal.fire({
                        icon: 'question',
                        title: 'Informe o email adicional',
                        input: 'email',
                        inputLabel: `Insira o email adicional que irá receber o relatório em PDF.`,
                        inputPlaceholder: 'Email adicional',
                        showCancelButton: true,
                        confirmButtonText: 'Adicionar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: 'orange',
                        cancelButtonColor: 'red',
                        inputValidator: (value) => {
                            if (!value || !/\S+@\S+\.\S+/.test(value)) {
                                return 'Por favor, digite um endereço de email válido.';
                            }
                        }
                    });

                    if (addedEmail && addedEmail.value) {
                        emails.push(addedEmail.value);
                    } else {
                        setIsOpen(true);
                        setTimeout(() => {
                            if (finalConclusionRef.current) {
                                finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 500);
                        return;
                    }
                } else {
                    if (email) {
                        emails.push(email);
                    }
                    if (isConfirmed) {
                        break;
                    }
                }
            }

            if (emails.length > 0) {
                UpdatingDataAlert.fire({
                    title: 'Enviando relatório...',
                });
                UpdatingDataAlert.showLoading();

                const response = await axios.post(`${backendUrl}/reports/sendtoemail`, {
                    sID: sID,
                    re: {
                        ...seeingReport,
                        graphs: updatedGraphs,
                    },
                    reConclusion: finalConclusion,
                    emails: emails.filter(e => e !== ''), // Remove strings vazias (representando "Add. Email")
                });

                if (response.data.reportId) {
                    const prefsResponse = await axios.get(`${backendUrl}/userpreferences/get`, {
                        params: {
                            sID: sID
                        }
                    });
                    const prefs = prefsResponse.data.prefs as UserPreferences;
                    let result;
                    if (prefs.autoDownloadPDFReportCopy === 'always') {
                        result = true;
                    } else if (prefs.autoDownloadPDFReportCopy === 'ask') {
                        const { isConfirmed } = await Swal.fire({
                            title: 'Relatório enviado com sucesso!',
                            text: 'Deseja baixar uma cópia do PDF agora?',
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonText: 'Baixar',
                            cancelButtonText: 'Não baixar',
                            confirmButtonColor: '#19bf4e',
                            cancelButtonColor: 'gray',
                        });
                        result = isConfirmed;
                    } else {
                        result = false;
                    }
                    if (result) {
                        UpdatingDataAlert.fire({
                            title: 'Preparando cópia do PDF...',
                        });
                        UpdatingDataAlert.showLoading();

                        const serverItemRawResult = await axios.post(zabbixApiUrl, {
                            jsonrpc: '2.0',
                            method: 'host.get',
                            params: {
                                output: ['name'],
                                hostids: [seeingReport?.serverId]
                            },
                            auth: sessionStorage.getItem('session_token')!!,
                            id: 1
                        });
                        const serverItemResult = serverItemRawResult.data.result;

                        const link = document.createElement('a');
                        link.href = `data:application/pdf;base64,${response.data.reportPDFBase64}`;
                        link.download = `report_server_${serverItemResult[0]?.name || 'unknserver'}_reportid_${seeingReport?.id || 'unknid'}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        Swal.fire({
                            title: `Cópia do PDF enviado pronta!`,
                            text: prefs.autoDownloadPDFReportCopy === 'always' ? 'Iniciando download automático...' : 'Iniciando download...',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#19bf4e'
                        }).then(() => {
                            setIsOpen(true);
                            setTimeout(() => {
                                if (finalConclusionRef.current) {
                                    finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 500);
                        });
                    } else if (prefs.autoDownloadPDFReportCopy === 'never') {
                        Swal.fire({
                            title: `Relatório enviado com sucesso!`,
                            text: 'A pergunta de se uma cópia do PDF enviado deveria ser baixada foi ignorada pois a opção de download automático está como Nunca baixar nas preferências do usuário.',
                            icon: 'warning',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#19bf4e'
                        }).then(() => {
                            setIsOpen(true);
                            setTimeout(() => {
                                if (finalConclusionRef.current) {
                                    finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 500);
                        });
                    } else {
                        setIsOpen(true);
                        setTimeout(() => {
                            if (finalConclusionRef.current) {
                                finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 500);
                    }
                } else {
                    console.log(response.data.error);
                    Swal.fire({
                        title: 'Ops...',
                        text: 'Um erro ocorreu ao exportar esse relatório para o(s) email(s) informado(s).',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: 'red'
                    }).then(() => {
                        setIsOpen(true);
                        setTimeout(() => {
                            if (finalConclusionRef.current) {
                                finalConclusionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 500);
                    });
                }
            }
        }
    };

    interface CustomDescriptionArea {
        id: number;
        value: string;
    }

    interface CustomIncluded {
        id: number;
        value: boolean;
    }

    const [customDescriptions, setCustomDescriptions] = useState<CustomDescriptionArea[]>([]);
    const [includedGraphs, setIncludedGraphs] = useState<CustomIncluded[]>([]);

    const handleDescriptionChange = (id: number) => (event: ChangeEvent<HTMLTextAreaElement>) => {
        setCustomDescriptions((prevDescriptions) => {
            const updatedTextareaStates = [...prevDescriptions];
            const index = updatedTextareaStates.findIndex((state) => state.id === id);
            updatedTextareaStates[index] = { ...updatedTextareaStates[index], value: event.target.value };
            return updatedTextareaStates;
        });
    };

    const handleIncludedGraphsChange = (id: number) => (event: ChangeEvent<HTMLInputElement>) => {
        setIncludedGraphs((prevIncluded) => {
            const updatedIncluded = [...prevIncluded];
            const index = updatedIncluded.findIndex((state) => state.id === id);
            updatedIncluded[index] = { ...updatedIncluded[index], value: event.target.checked };
            return updatedIncluded;
        });
    };

    const [finalConclusion, setFinalConclusion] = useState('Nada a relatar.');

    useEffect(() => {
        setIncludedGraphs([]);
        setCustomDescriptions([]);
        setFinalConclusion('Nada a relatar.');

        if (isOpen && !seeingReport) {
            onClose();
            GeneralInfoToast.fire({
                icon: 'error',
                title: 'Ops.. Parece que não há um relatório disponível. Exportação cancelada.',
                timer: 3 * 1000,
            });
            return
        }

        const newIncluded: CustomIncluded[] = [];
        seeingReport?.graphs.forEach((graph) => {
            newIncluded.push({
                id: graph.graphId,
                value: true
            });
        })
        setIncludedGraphs(newIncluded);

        const newDescriptions: CustomDescriptionArea[] = [];
        seeingReport?.graphs.forEach((graph) => {
            newDescriptions.push({
                id: graph.graphId,
                value: `${graph.graphDisplay}: ${graph.graphDescription || 'Nada a relatar.'}`
            });
        })
        setCustomDescriptions(newDescriptions);
    }, [seeingReport]);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            contentLabel="Exportar Relatório"
            ariaHideApp={false} // Deve ser false
            preventScroll={true}
            closeTimeoutMS={500}
            style={customStyles} // Aplica os estilos personalizados ao modal
        >
            <div id='export-report-modal'>
                <h3>Exportar Relatório</h3>
                <div
                    id='export-report-modal-content'
                    style={{
                        display: 'left',
                        justifyContent: 'left',
                        alignItems: 'left',
                        textAlign: 'left',
                        height: '100%',
                        width: '100%',
                        marginTop: '25px',
                        marginBottom: '25px',
                    }}
                >
                    <p
                        style={{
                            marginTop: '1%',
                            fontSize: '14px',
                            marginLeft: '15%',
                            marginRight: '15%',
                            textAlign: 'center'
                        }}
                    >
                        Verifique se está tudo certo com os gráficos e com as descrições para exportar o relatório. É possível personalizar as descrições caso você queira. Além de baixar como PDF, você pode enviar esse relatório diretamente para um endereço de email.
                    </p>
                    <hr style={{ marginTop: '2%', marginLeft: '10%', width: '80%', border: 'none', borderTop: '0.5px solid black' }} />
                    <div
                        style={{
                            marginTop: '1%',
                            textAlign: 'center'
                        }}
                    >
                        {seeingReport?.graphs.map((graph) => (
                            <div
                                id={`export-graph-container-${graph.graphId}`}
                            >
                                <br />
                                <input
                                    type='checkbox'
                                    checked={includedGraphs.find((desc) => desc.id === graph.graphId)?.value || false}
                                    onChange={handleIncludedGraphsChange(graph.graphId)}
                                    // disabled={buttonDisabled}
                                    style={{ marginRight: '5px' }}
                                />
                                <a style={{ fontSize: '15px' }}>Incluir gráfico ao exportar</a>
                                <h4>{graph.graphDisplay}</h4>
                                {
                                    includedGraphs.find((desc) => desc.id === graph.graphId)?.value || false ? (
                                        <>
                                            <img
                                                alt={`Export Graph ID ${graph.graphId}`}
                                                src={`data:image/png;base64, ${graph.graphImage}`}
                                                style={{
                                                    objectFit: 'contain', // Maintain the aspect ratio and fit the image within the container
                                                }}
                                            />
                                            {graph.graphDescription ? (
                                                <textarea
                                                    rows={3}
                                                    value={customDescriptions.find((desc) => desc.id === graph.graphId)?.value || ''}
                                                    onChange={handleDescriptionChange(graph.graphId)}
                                                    placeholder="Insira uma descrição para o gráfico acima..."
                                                    style={{
                                                        marginTop: '0.5%',
                                                        backgroundColor: '#edece8',
                                                        textAlign: 'center',
                                                        width: '80%',
                                                        borderRadius: '3px'
                                                    }}
                                                />
                                            ) : (<br />)}
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '14px' }}>Este gráfico não está incluído para a exportação.</p>
                                        </>
                                    )
                                }
                                <br />
                            </div>
                        ))}

                        <h2
                            style={{
                                marginTop: '5%'
                            }}
                        >Conclusão Geral</h2>
                        <textarea
                            rows={3}
                            value={finalConclusion}
                            onChange={(e) => { setFinalConclusion(e.target.value) }}
                            placeholder="Insira uma conclusão geral para exportar o relatório..."
                            ref={finalConclusionRef}
                            style={{
                                marginTop: '0.5%',
                                backgroundColor: '#edece8',
                                textAlign: 'center',
                                width: '80%',
                                borderRadius: '3px'
                            }}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ paddingTop: '15px', paddingLeft: '300px' }}>
                    <button
                        type="button"
                        className="btn"
                        style={{
                            backgroundColor: 'teal',
                            color: 'white',
                            marginRight: '5px'
                        }}
                        onClick={handleDownloadAsPDF}
                    >
                        Exportar como PDF
                    </button>
                    <button
                        type="button"
                        className="btn"
                        style={{
                            backgroundColor: 'darkorange',
                            color: 'white',
                            marginRight: '20px'
                        }}
                        onClick={handleSendAsPDFToEmail}
                    >
                        Enviar por Email
                    </button>
                    <button
                        type="button"
                        className="btn"
                        style={{
                            backgroundColor: '#494a4d',
                            color: 'white'
                        }}
                        onClick={handleClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default ExportReportModal;