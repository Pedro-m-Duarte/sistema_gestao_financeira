// src/components/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/NotFound.css'; // CSS da página de 404
import PanelFooterComponent from './extras/PanelFooterComponent';

const NotFound: React.FC = () => {
  // Define o título da página
  document.title = "Painel Titan | 404";

  return (
    <div>
      <div id="notfound">
        <div className="notfound">
          <div className="notfound-bg">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <h1>Ops...</h1>
          <h2>Esta página não existe, você parece estar perdido.</h2>
          <Link to="/">Voltar</Link>
        </div>
      </div>
      <PanelFooterComponent />
    </div>
  );
};

export default NotFound;