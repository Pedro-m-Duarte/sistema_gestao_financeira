Sistema de Gestão Financeira

Requisitos

Antes de iniciar a instalação e execução do projeto, certifique-se de que sua máquina atende aos seguintes requisitos:

Docker

Visual Studio Code

Github

Portas disponíveis na máquina: 5000, 3001, 3002, 3003 e 3004

Como realizar a implementação?

Clone o repositório do projeto:

git clone https://github.com/Pedro-m-Duarte/sistema_gestao_financeira.git

Instale o Docker e o Visual Studio Code caso ainda não tenha instalado.

No Visual Studio Code, instale a extensão Dev Containers, que permite utilizar tecnologias dentro de um container de forma automatizada.

Inicialização do Back-end

Abra a pasta backend no Visual Studio Code.

Pressione Ctrl + Shift + P e digite:

Dev Containers: Rebuild and Reopen in Container

Um novo Visual Studio Code será aberto com o ambiente configurado para execução do projeto.

No terminal, instale as dependências:

pip install -r requirements.txt

Para iniciar o back-end, execute:

flask run

O back-end será iniciado na porta 5000 e estará acessível via Swagger:

http://localhost:5000/swagger

Inicialização do Front-end

Abra a pasta frontend no Visual Studio Code.

Pressione Ctrl + Shift + P e digite:

Dev Containers: Rebuild and Reopen in Container

Um novo Visual Studio Code será aberto.

No terminal, execute os seguintes comandos em diferentes terminais:

Orquestrador:

cd orchestrator
npm start

Navbar:

cd navbar
npm start

Dashboard:

cd dashboard
npm start

Painel de Controle:

cd painelControl
npm start

O front-end será inicializado nas seguintes portas:

Orquestrador: 3004

Navbar: 3001

Dashboard: 3002

Painel de Controle: 3003

Para visualizar a interface do sistema, acesse:

http://localhost:3004/

Contribuição

Caso queira contribuir para o projeto, siga as etapas:

Faça um fork do repositório.

Crie um branch para suas alterações:

git checkout -b minha-feature

Faça commit das alterações:

git commit -m "Minha nova feature"

Envie para o repositório remoto:

git push origin minha-feature

Abra um Pull Request no GitHub.
