import React from 'react';
import Logo from '../images/rpgLogo.png';

export default function Header() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#013024' }}>
      <img src={Logo} alt="Logo" style={{ width: '200px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '30px'}}>
        <a href="/dashboard" style={{ fontSize: '20px', marginRight: '10px', color: 'white' }}>DASHBOARD</a>
        <a href="/painel-control" style={{ fontSize: '20px', color: 'white' }}>PAINEL CONTROL</a>
      </div>
    </div>
  );
}