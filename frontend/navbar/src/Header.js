import React from 'react';

export default function Header() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', backgroundColor: '#f8f9fa' }}>
      <h1 style={{ marginBottom: '20px' }}>PAINEL DE CONTROLE FINANCEIRO</h1>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a href="/dashboard" style={{ marginRight: '10px' }}>DASHBOARD</a>
        <a href="/painel-control">PAINEL CONTROL</a>
      </div>
    </div>
  );
}