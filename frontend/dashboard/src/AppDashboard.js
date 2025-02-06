import React from 'react';
import GraphicPieDesign from './GraphicPieDesign';
import GraphicBarDesign from './GraphicBarDesign';

export default function AppDashboard() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <GraphicPieDesign />
      <GraphicBarDesign />
    </div>
  );
}