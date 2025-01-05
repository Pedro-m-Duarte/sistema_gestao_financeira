// src/components/extras/PanelGauge.tsx
import React from 'react';
import GaugeChart from 'react-gauge-chart';

interface PanelGaugeGaugeProps {
    value: number;
    arcsLength: number[];
    colors: string[];
    textColor: string
}

const PanelGauge: React.FC<PanelGaugeGaugeProps> = ({ value, arcsLength, colors, textColor }) => {
    const data = [
        {
            value: value / 100, // Converta o valor para um intervalo de 0 a 1
            color: '#3498db'
        }
    ];

    return (
        <div className="gauge-container">
            <GaugeChart id="gauge-chart"
                cornerRadius={3}
                nrOfLevels={3}
                arcsLength={arcsLength}
                colors={colors}
                arcPadding={0.01}
                hideText={false}
                percent={value / 100}
                textColor={textColor}
                style={{ width: '90%', height: '90%' }}
                animate={false} // Mudar?
                animateDuration={0}
                animDelay={0}
            />
        </div>
    );
};

export default PanelGauge;