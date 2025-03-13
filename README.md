# SEDH - Sistema de Monitoramento e Indicadores Sociais

Este projeto tem como objetivo fornecer uma plataforma para monitoramento e análise de indicadores sociais da Secretaria de Estado do Desenvolvimento Humano (SEDH). A aplicação permite visualizar dados estatísticos de municípios, regionais e programas sociais, além de apresentar mapas interativos e filtros para facilitar a análise.

---

## 📌 Tecnologias Utilizadas

---


Next.js - Framework para React

TypeScript - Tipagem estática para melhor manutenção do código

Tailwind CSS - Estilização da interface

React Leaflet - Mapa interativo

ShadCN UI - Componentes estilizados

API Google Sheets - Fonte de dados dinâmica

GitHub Actions - Automatização de deploy

🔗 Rotas e Funcionalidades

🌍 /

Página inicial com uma visão geral do sistema e principais funcionalidades.

🗺️ /map-rga

Mapa interativo da Paraíba com divisão por regionais administrativas (RGA). Permite:

Selecionar municípios e visualizar seus dados.

Destacar regionais e filtrar informações.

📊 /dashboard-estadual

Painel de indicadores estaduais com gráficos e estatísticas sobre:

População

Programas sociais

Infraestrutura

Educação

📊 /dashboard-municipal

Painel de indicadores municipais, permitindo:

Filtrar dados por município

Comparação entre municípios

Exibição detalhada de indicadores

📑 /relatorio-municipal

Relatórios detalhados sobre cada município, incluindo:

Dados populacionais

Indicadores sociais e econômicos

Infraestrutura disponível

📑 /relatorios-estadual

Relatórios consolidados a nível estadual, permitindo análise macro dos dados coletados.

📥 Como Executar o Projeto

Clone o repositório:

git clone git@github.com:targinofelipe1/SEDH.git

Instale as dependências:

cd SEDH
npm install

Inicie o servidor de desenvolvimento:

npm run dev

Acesse a aplicação em http://localhost:3000
