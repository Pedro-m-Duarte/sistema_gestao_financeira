import { backendCompatibilityVersion, dashVersion } from "../../App";

const PanelFooterComponent: React.FC = () => (
    <footer className="py-3 bg-light mt-auto">
        <div className="container-fluid px-4">
            <div className="align-items-center justify-content-between small">
                <div className="text-muted">Todos os direitos reservados &copy; 2023 <a href="https://migrati.com.br" target="_blank" rel="noopener noreferrer">MigraTI <i className="fas fa-external-link-alt"></i></a>.</div>
            </div>
        </div>
    </footer>
);

export default PanelFooterComponent;