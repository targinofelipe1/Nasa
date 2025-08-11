# SEDH - Sistema de Monitoramento e Indicadores Sociais

Este projeto tem como objetivo fornecer uma plataforma para monitoramento e análise de indicadores sociais da Secretaria de Estado do Desenvolvimento Humano (SEDH). A aplicação permite visualizar dados estatísticos de municípios, regionais e programas sociais, além de apresentar mapas interativos e filtros para facilitar a análise.

## Sugestões de Nomes

#### 1. Paraíba Social – Plataforma integrada para análise de indicadores sociais no estado;
#### 2. Desenvolve PB – Monitoramento social para um futuro melhor;
#### 3. Paraíba Cidadã – Sistema de inteligência social voltado para o bem-estar da população;
#### 4. PB Social – Monitoramento de políticas e indicadores sociais no estado;
#### 5. Paraíba em Desenvolvimento – Sistema de análise do avanço social no estado;
#### 6. Paraíba Mais – Plataforma para uma Paraíba mais desenvolvida;
#### 7. AvançaPB – Monitoramento do progresso social da Paraíba;
#### 8. SocialPB – Indicadores sociais para políticas públicas;
#### 9. Desenvolvimento em Foco – Monitoramento social para um futuro sustentável;
#### 10. Paraíba em Foco – Dados e estratégias para transformar realidades;
#### 11. Paraíba em Movimento – Desenvolvimento humano e social em evolução;
#### 12. Mapeando o Futuro – Informação para políticas mais eficientes;
#### 13. Monitor Social – Acompanhamento estratégico de indicadores;
#### 14. PB em Ação – Dados estratégicos para políticas públicas eficazes;
#### 15. Paraíba + Humana – Tecnologia a serviço da cidadania;

## 📌 Tecnologias Utilizadas

Next.js - Framework para React

TypeScript - Tipagem estática para melhor manutenção do código

Tailwind CSS - Estilização da interface

React Leaflet - Mapa interativo

ShadCN UI - Componentes estilizados

API Google Sheets - Fonte de dados dinâmica

GitHub Actions - Automatização de deploy

## 🔗 Rotas e Funcionalidades

### 🌍 /

#### Página inicial com uma visão geral do sistema e principais funcionalidades.

### 🗺️ /map-rga

#### Mapa interativo da Paraíba com divisão por regionais administrativas (RGA). Permite:

###### Identificar regionais.

###### Selecionar municípios.

###### Destacar a quantidade município por regional. 

### 📊 /dashboard-estadual

#### Painel de indicadores estaduais com gráficos e estatísticas sobre:

###### População

###### Programas sociais

###### Infraestrutura

###### Educação

### 📊 /dashboard-municipal

#### Painel de indicadores municipais, permitindo:

###### Filtrar dados por município

###### Comparação entre municípios

###### Exibição detalhada de indicadores

### 🗺️ /maps

#### Mapa interativo da Paraíba com divisão por programas sociais. Permite:

###### Selecionar municípios.

###### Destacar a quantidade programas sociais por município.

### 📑 /relatorio-municipal

#### Relatórios detalhados sobre cada município, incluindo:

###### Dados populacionais

###### Indicadores sociais e econômicos

###### Infraestrutura disponível

### 📑 /relatorios-estadual

#### Relatórios consolidados a nível estadual, permitindo análise macro dos dados coletados.

## 📥 Como Executar o Projeto

#### Clone o repositório:

##### git clone git@github.com:targinofelipe1/SEDH.git

#### Instale as dependências:

##### cd SEDH
##### npm install

#### Inicie o servidor de desenvolvimento:

##### npm run dev

##### Acesse a aplicação em http://localhost:3000/
