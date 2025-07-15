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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

const GraficoLinhaComparativo: React.FC<GraficoLinhaComparativoProps> = ({
  titulo,
  label2018,
  label2022,
  valor2018,
  valor2022,
  isLoading,
  unidade = '',
  height = '350px',
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-100 rounded-lg shadow-sm" style={{ minHeight: height }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-blue-900">Carregando gráfico...</p>
      </div>
    );
  }

  const isValid = (value: any): value is number => typeof value === 'number' && !isNaN(value);

  const safe2018 = isValid(valor2018) ? valor2018 : 0;
  const safe2022 = isValid(valor2022) ? valor2022 : 0;

  const color2018Point = 'rgb(80, 162, 235)';
  const color2022Point = 'rgb(255, 99, 132)';
  const colorLine = 'rgb(128, 0, 128)';

  const formatValue = (value: number, unit: string, fractionDigits: number = 0) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: fractionDigits,
    });
    return formatter.format(value) + unit;
  };

  const data: ChartData<'line'> = {
    labels: ['2018', '2022'],
    datasets: [
      {
        label: label2018,
        data: [safe2018, null], // corrigido
        borderColor: colorLine,
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: color2018Point,
        pointBorderColor: color2018Point,
        pointBorderWidth: 0,
        pointHoverRadius: 8,
        pointHitRadius: 15,
      },
      {
        label: label2022,
        data: [null, safe2022], // corrigido
        borderColor: colorLine,
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: color2022Point,
        pointBorderColor: color2022Point,
        pointBorderWidth: 0,
        pointHoverRadius: 8,
        pointHitRadius: 15,
      },
      {
        label: 'Variação',
        data: [safe2018, safe2022],
        borderColor: colorLine,
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderDash: [5, 5],
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { left: 20, right: 20, top: 20, bottom: 20 }
    },
    plugins: {
      title: {
        display: true,
        text: titulo,
        font: { size: 16, weight: 'normal' },
        color: '#333',
        padding: { top: 0, bottom: 10 },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label !== 'Variação' && context.parsed.y !== null && !isNaN(context.parsed.y)) {
              const digits = unidade === '%' ? 2 : 0;
              label += `: ${formatValue(context.parsed.y, unidade, digits)}`;
            }
            return label;
          },
          title: function (context) {
            return context?.[0]?.label;
          },
        },
        filter: function (tooltipItem) {
          return tooltipItem.dataset.label !== 'Variação';
        },
      },
      legend: { display: false },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12, weight: 'normal' },
          color: '#333',
        },
        border: { display: true, color: '#e0e0e0', width: 1 },
      },
      y: {
        beginAtZero: false,
        grid: { color: '#f0f0f0' },
        ticks: {
          callback: function (value: string | number) {
            return formatValue(Number(value), unidade, 0);
          },
          font: { size: 12 },
          color: '#333',
          padding: 5,
        },
        border: { display: false },
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
