import React from 'react';
// import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8f9fa' }}>
      <h1>Header component</h1>
      <div>
        {/* <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link> */}
        {/* <Link to="/painel">Painel Control</Link> */}
      </div>
    </div>
  );
}