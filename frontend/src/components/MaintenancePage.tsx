// src/components/MaintenancePage.tsx
import React from 'react';
import '../css/NotFound.css'; // Utiliza o mesmo CSS da página de 404
import PanelFooterComponent from './extras/PanelFooterComponent';

const MaintenancePage: React.FC = () => {
  // Define o título da página
  document.title = "Painel Titan | Manutenção";

  return (
    <div>
      <div id="notfound">
        <div className="notfound">
          <div className="notfound-bg">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <h1>Manutenção</h1>
          <h2>O Painel Titan está atualmente indisponível.</h2>
        </div>
      </div>
      <PanelFooterComponent />
    </div>
  );
};

export default MaintenancePage;