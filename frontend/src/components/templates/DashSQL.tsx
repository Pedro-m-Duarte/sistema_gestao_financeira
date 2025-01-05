// src/components/templates/DashSQL.tsx
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactGridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import '../../css/Templates.css'; // CSS usado em todas as páginas de template
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DiskSquare from '../paneltypes/DiskSquare';
import Swal from 'sweetalert2';
import axios from 'axios';
import { zabbixApiUrl } from '../../App';
import { isEqual } from 'lodash';
import CustomChart, { CustomChartData } from '../paneltypes/CustomChart';
import { DashboardPageProps } from './DashDefault';
import { generatePastelColor } from '../../FrontendUtils';
import GraphicDesign from '../builderTemplates/GraphicDesign';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Template renderizado para servidores do tipo 'SQLSERVER'.
 */
const DashSQL: React.FC<DashboardPageProps> = ({
    FetchServersFromZabbix,
    selectedServer,
    selectedServerName,
    isFullScreen,
    toggleFullScreen,
    selectedLayout
}) => {
    // Define o título da página
    document.title = "Painel Titan | Monitoramento (SQLServer)";

    const initialLayouts: any = selectedLayout ? selectedLayout.layout : [
        { i: '1', x: 0, y: 0, w: 2, h: 2 }
    ]

    // Define o estado para os layouts
    const [layouts, setLayouts] = useState<ReactGridLayout.Layout[]>(initialLayouts);

    // useEffect(() => {
    //     const savedLayout = sessionStorage.getItem('userLayout_' + selectedServer);
    //     if (savedLayout) {
    //         try {
    //             const parsedLayouts = JSON.parse(savedLayout);
    //             setLayouts(parsedLayouts);
    //         } catch (error) {
    //             console.error('Erro ao analisar os layouts salvos:', error);
    //         }

    //         const disksContainer = disksContainerRef.current;
    //         if (disksContainer) {
    //             const containerHeight = disksContainer.getBoundingClientRect().height;
    //             const numDisks = diskItems.length;
    //             const calculatedGaugeHeight = containerHeight / numDisks;

    //             // Atualiza o estado com a altura calculada da gauge
    //             setGaugeHeight(calculatedGaugeHeight);
    //         }
    //     }
    // }, [diskItems, selectedServer]);

    useEffect(() => {
        if (!selectedLayout) return;
        // }
    }, [selectedLayout]);

    const containerWidth = 1500;
    const columnWidth = 500; // Largura desejada para cada item
    const cols = Math.floor(containerWidth / columnWidth);
    
    return (
        <DndProvider backend={HTML5Backend}>
            <div id="sql-panel-template">
                {isFullScreen && (
                    <div id='full-screen-header-div'>
                        <button
                            className="btn btn-link btn-sm text-white"
                            onClick={toggleFullScreen}
                            title='Exibir painel em Modo Informativo'
                        >
                            <i className='fas fa-compress' color='gray'></i>
                        </button>

                        <div key="selected-server-title" className="selected-server-title">
                            Monitorando → {selectedServerName}
                        </div>
                    </div>
                )}
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layouts }}
                    autoSize={true}
                    cols={{ lg: cols, md: cols, sm: cols, xs: cols, xxs: cols }}
                    rowHeight={300}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                >
                    {selectedLayout?.graphics?.map((graphic, index) => (
                        // <div key={`${selectedServer}-${index}`}>
                            <GraphicDesign key={`${selectedServer}-${index}`} graphic={graphic} templateOrServerId={selectedServer}/>
                        // </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        </DndProvider>
    );
};

export default DashSQL;