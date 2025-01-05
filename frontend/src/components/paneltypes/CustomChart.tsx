// src/components/paneltypes/CustomChart.tsx
import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import Chart, { ChartOptions } from 'chart.js/auto'; // Importe 'chart.js/auto' para evitar problemas com versões mais recentes do Chart.js

export interface CustomChartData {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
  options?: {
    scales?: {
      y?: {
        max?: number;
      };
    };
    showGridLines?: boolean;
  };
}

interface CustomChartProps {
  data: CustomChartData;
}

const CustomChart: React.FC<CustomChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CustomChart,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    // Destrói o gráfico anterior se existir
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (chartRef.current && chartContainerRef.current && data) {
      const containerWidth = chartContainerRef.current.clientWidth;

      // Configure a altura do gráfico com base na largura do contêiner
      if (chartRef.current) {
        chartRef.current.style.height = containerWidth * 0.6 + 'px'; // Por exemplo, 60% da largura
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Defina as opções personalizadas do gráfico aqui
        const chartOptions: ChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'category',
              title: {
                display: false,
                text: 'Hora',
              },
              grid: {
                display: data.options?.showGridLines, // Mostrar/ocultar linhas quadriculadas com base na propriedade showGridLines
              },
            },
            y: {
              title: {
                display: false,
                text: 'Valor',
              },
              max: data.options?.scales?.y?.max || undefined,
              grid: {
                display: data.options?.showGridLines, // Mostrar/ocultar linhas quadriculadas com base na propriedade showGridLines
              },
            },
          },
          animation: false, // Mudar?
          plugins: {
            title: {
              display: true,
              text: data.title,
            },
          },
        };

        // Crie um novo gráfico com as opções personalizadas
        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data,
          options: chartOptions,
        });
      }
    }
  }, [data]);

  return (
    <div ref={drag}>
      {/* Use uma div para envolver o gráfico e definir a altura relativa */}
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          paddingTop: '60%', // Defina o valor desejado para a altura em relação à largura
          position: 'relative',
        }}
      >
        <canvas ref={chartRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default CustomChart;