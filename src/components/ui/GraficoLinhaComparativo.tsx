'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

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
  const isValid = (value: any): value is number =>
    typeof value === 'number' && !isNaN(value) && isFinite(value);

  const safe2018 = isValid(valor2018) ? valor2018 : null;
  const safe2022 = isValid(valor2022) ? valor2022 : null;

  const porcentagemVariacao =
    safe2018 && safe2022
      ? ((safe2022 - safe2018) / safe2018) * 100
      : null;

  const data = [
  {
    year: '2018',
    [label2018]: safe2018,
    variacao: null,
    ligacao: safe2018,
  },
  {
    year: '2022',
    [label2022]: safe2022,
    variacao: safe2022,
    ligacao: safe2022,
  },
];

  const formatValue = (value: number | null, unit: string, digits = 0) => {
    if (value === null || value === undefined) return '—';
    return (
      new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: digits,
      }).format(value) + unit
    );
  };

  if (isLoading) {
    return (
      <div
        style={{ minHeight: height, backgroundColor: '#f3f4f6' }}
        className="flex justify-center items-center rounded-lg shadow-sm"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-blue-900">Carregando gráfico...</p>
      </div>
    );
  }

  if (safe2018 === null && safe2022 === null) {
    return (
      <div
        style={{ minHeight: height, backgroundColor: '#fef3c7' }}
        className="flex justify-center items-center text-yellow-800 rounded-lg shadow"
      >
        Sem dados suficientes para gerar o gráfico.
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: height, backgroundColor: 'white' }}
      className="p-6 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 transition-all duration-300 hover:shadow-xl"
    >
      <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">{titulo}</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid stroke="#f0f0f0" />
        <XAxis dataKey="year" tick={{ fontSize: 12, dy: 10 }} />
          <YAxis
              domain={['dataMin - 0.1 * Math.abs(dataMin)', 'dataMax + 0.05 * Math.abs(dataMax)']}
              tickFormatter={(val) =>
                new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(val))
              }
              tick={{ fontSize: 12 }}
            />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0) {
                const item = payload[0];
                const valor = item.value as number;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3">
                    <p className="font-semibold">{label}</p>
                    <p style={{ color: item.color }}>
                      {item.name} : {formatValue(valor, unidade, unidade === '%' ? 2 : 0)}
                    </p>
                    {label === '2022' && porcentagemVariacao !== null && (
                      <p className="text-purple-600">
                        variação: {porcentagemVariacao.toFixed(2)}%
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          {safe2018 !== null && (
            <Line
              type="monotone"
              dataKey={label2018}
              stroke="rgb(80, 162, 235)"
              dot={{ r: 6 }}
              isAnimationActive={false}
            />
          )}
          {safe2022 !== null && (
            <Line
              type="monotone"
              dataKey={label2022}
              stroke="rgb(255, 99, 132)"
              dot={{ r: 6 }}
              isAnimationActive={false}
            />
          )}
          {safe2018 !== null && safe2022 !== null && (
            <Line
              type="linear"
              dataKey="ligacao"
              stroke="rgb(128, 0, 128)"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoLinhaComparativo;
