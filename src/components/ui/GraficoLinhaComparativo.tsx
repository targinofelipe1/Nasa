'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define as propriedades (props) que o componente aceitará
interface GraficoLinhaComparativoProps {
  titulo: string;
  label2018: string;
  label2022: string;
  valor2018: number;
  valor2022: number;
  isLoading: boolean;
  unidade?: string;
  height?: string;
}

// Componente funcional React para o gráfico de linha comparativo
const GraficoLinhaComparativo: React.FC<GraficoLinhaComparativoProps> = ({
  titulo,
  label2018,
  label2022,
  valor2018,
  valor2022,
  isLoading,
  unidade = '', // Valor padrão para 'unidade'
  height = '350px', // Valor padrão para 'height'
}) => {
  // Exibe um spinner de carregamento se isLoading for true
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-100 rounded-lg shadow-sm" style={{ minHeight: height }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-blue-900">Carregando gráfico...</p>
      </div>
    );
  }

  // Função auxiliar para verificar se um valor é um número válido
  const isValid = (value: any): value is number => typeof value === 'number' && !isNaN(value);

  // Garante que os valores sejam números válidos ou 0 para evitar erros no Chart.js
  const safe2018 = isValid(valor2018) ? valor2018 : 0;
  const safe2022 = isValid(valor2022) ? valor2022 : 0;

  // Define as cores para os pontos e a linha
  const color2018Point = 'rgb(80, 162, 235)'; // Azul para 2018
  const color2022Point = 'rgb(255, 99, 132)'; // Vermelho para 2022
  const colorLine = 'rgb(128, 0, 128)'; // Roxo para a linha de variação

  // Função para formatar os valores para exibição (ex: com unidade e casas decimais)
  const formatValue = (value: number, unit: string, fractionDigits: number = 0) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: fractionDigits,
    });
    return formatter.format(value) + unit;
  };

  // Definição dos dados para o gráfico
  const data: ChartData<'line'> = {
    labels: ['2018', '2022'], // Rótulos do eixo X (anos)
    datasets: [
      {
        label: label2018,
        data: [safe2018, safe2022], // Dados para 2018 e 2022
        borderColor: 'transparent', // Linha transparente para este dataset
        backgroundColor: 'transparent',
        tension: 0.1, // Suavidade da linha
        fill: false,
        pointRadius: 6, // Tamanho do ponto
        pointBackgroundColor: [color2018Point, 'transparent'], // Ponto 2018 visível, 2022 transparente
        pointBorderColor: [color2018Point, 'transparent'],
        pointBorderWidth: 0,
        pointHoverRadius: 8, // Aumento do ponto ao passar o mouse
        pointHitRadius: 15,
      },
      {
        label: label2022,
        data: [safe2018, safe2022], // Dados para 2018 e 2022
        borderColor: 'transparent', // Linha transparente para este dataset
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: ['transparent', color2022Point], // Ponto 2018 transparente, 2022 visível
        pointBorderColor: ['transparent', color2022Point],
        pointBorderWidth: 0,
        pointHoverRadius: 8,
        pointHitRadius: 15,
      },
      {
        label: 'Variação', // Dataset para a linha tracejada de variação
        data: [safe2018, safe2022],
        borderColor: colorLine,
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 0, // Não exibe pontos para este dataset
        pointHoverRadius: 0,
        borderDash: [5, 5], // Linha tracejada
        borderWidth: 2,
      },
    ],
  };

  // Definição das opções do gráfico
  const options: ChartOptions<'line'> = {
    responsive: true, // O gráfico será responsivo
    maintainAspectRatio: false, // Não mantém a proporção original, permitindo controle total da altura
    layout: {
      padding: { left: 20, right: 20, top: 20, bottom: 20 } // Preenchimento interno do gráfico
    },
    plugins: {
      title: {
        display: true,
        text: titulo, // Título do gráfico
        font: { size: 16, weight: 'normal' },
        color: '#333',
        padding: { top: 0, bottom: 10 },
      },
      tooltip: {
        enabled: true, // Habilita tooltips
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            // Formata o valor no tooltip apenas para os pontos visíveis de 2018 e 2022
            if (context.parsed.x === 0 && context.dataset.label === label2018 && context.parsed.y !== null && !isNaN(context.parsed.y)) {
              const digits = unidade === '%' ? 2 : 0;
              label += `: ${formatValue(context.parsed.y, unidade, digits)}`;
            } else if (context.parsed.x === 1 && context.dataset.label === label2022 && context.parsed.y !== null && !isNaN(context.parsed.y)) {
              const digits = unidade === '%' ? 2 : 0;
              label += `: ${formatValue(context.parsed.y, unidade, digits)}`;
            } else {
              return ''; // Não exibe o tooltip para os pontos transparentes ou o dataset de 'Variação'
            }
            return label;
          },
          title: function (context) {
            return context?.[0]?.label; // Título do tooltip (o ano)
          },
        },
        filter: function (tooltipItem) {
            // Filtra o tooltip para que apareça apenas para os pontos de 2018 e 2022
            const is2018Point = tooltipItem.datasetIndex === 0 && tooltipItem.dataIndex === 0;
            const is2022Point = tooltipItem.datasetIndex === 1 && tooltipItem.dataIndex === 1;
            return is2018Point || is2022Point;
        },
      },
      legend: { display: false }, // Oculta a legenda padrão
    },
    interaction: {
      mode: 'index', // Modo de interação do tooltip
      intersect: false, // Permite que o tooltip apareça mesmo se o mouse não estiver diretamente sobre o ponto
    },
    scales: {
      x: {
        grid: { display: false }, // Oculta as linhas de grade do eixo X
        ticks: {
          font: { size: 12, weight: 'normal' },
          color: '#333',
        },
        border: { display: true, color: '#e0e0e0', width: 1 }, // Borda do eixo X
      },
      y: {
        beginAtZero: false, // O eixo Y não necessariamente começa em zero
        grid: { color: '#f0f0f0' }, // Cor das linhas de grade do eixo Y
        ticks: {
          callback: function (value: string | number) {
            return formatValue(Number(value), unidade, 0); // Formata os ticks do eixo Y
          },
          font: { size: 12 },
          color: '#333',
          padding: 5,
        },
        border: { display: false }, // Oculta a borda do eixo Y
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 transition-all duration-300 hover:shadow-xl" style={{ minHeight: height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default GraficoLinhaComparativo;