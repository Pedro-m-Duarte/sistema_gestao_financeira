// src/components/paneltypes/DiskSquare.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes'; // Defina os tipos de itens
import PanelGauge from '../extras/PanelGauge';

interface DiskSquareProps {
    name: string;
    value: number;
    arcsLength: number[];
    colors: string[];
    textColor: string
}

const DiskSquare: React.FC<DiskSquareProps> = ({ name, value, arcsLength, colors, textColor }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.DiskSquare,
        item: { name, value },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
            }}
            className='disk-square'
        >
            <p className="label">{name}</p>
            <div className="gauge-container">
                <PanelGauge value={value} arcsLength={arcsLength} colors={colors} textColor={textColor} />
            </div>
            <div className="divider"></div>
        </div>
    );
};

export default DiskSquare;