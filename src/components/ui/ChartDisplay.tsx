"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import { useRef, useMemo } from "react";
import { columnDisplayNames } from '@/lib/column-display-names';

interface ChartDisplayProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  columnDisplayNames?: Record<string, string>;
  programTitle: string;
  selectedRegional?: string; // valor vindo do select ("", "4ª Regional", etc.)
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6F61", "#8A2BE2", "#5D9B9B", "#F5B041"];

const currencyColumns = [
  "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe (valor investido em 2024/2025)",
  "Proteção Social Básica - Residenciais Cidade Madura (valor investido em 2025)",
  "Proteção Social Básica - Centros Sociais Urbanos - CSUs (valor investido em 2025)",
  "Proteção Social Especial - Projeto Acolher (valor investido em 2025)",
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual',
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual',
  'Segurança Alimentar - Cartão Alimentação - valor por município',
  'Segurança Alimentar - PAA LEITE (investimento)',
  'Segurança Alimentar - PAA CDS (investimento anual)',
  'Segurança Alimentar - Cisternas (valor investido em 2025',
];

const binaryColumns = [
  "Proteção Social Básica - Primeira Infância no SUAS",
  "Proteção Social Básica - Acessuas Trabalho",
  "Proteção Social Especial - Unidades de Acolhimento (Estadual )",
  "Proteção Social Especial - Projeto Acolher (municípios)",
  'Segurança Alimentar - Programa "Tá na mesa" (municípios)',
  "Segurança Alimentar - Cartão Alimentação (municípios)",
  "Segurança Alimentar - PAA LEITE (municípios)",
  "Segurança Alimentar - PAA CDS (municípios)",
];

const formatValue = (value: number, name: string) => {
  if (currencyColumns.includes(name)) {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString("pt-BR");
};

const CustomLegend = ({ payload, isRegionalSelected, yAxisDisplayName, regionalName, programTitle }: any) => {
  const legendLabel = isRegionalSelected
    ? `Dados da ${regionalName}`
    : `Top 10 Municípios`;

  return (
    <div style={{ textAlign: 'center', marginTop: '0px' }}>
      {programTitle && (
        <h2 style={{ color: '#000', fontSize: '1.2em', marginBottom: '5px' }}>{programTitle}</h2>
      )}
      <span style={{ color: payload[0]?.color }}>
        {legendLabel} - {yAxisDisplayName}
      </span>
    </div>
  );
};

const parseNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const parsedValue = parseFloat(value.replace(/R\$/g, '').trim().replace(/\./g, '').replace(',', '.') || '0');
  return isNaN(parsedValue) ? 0 : parsedValue;
};

const parseBinary = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const lowerCaseValue = value.trim().toLowerCase();
  return (lowerCaseValue === 'sim' || lowerCaseValue === 'x' || lowerCaseValue === '1') ? 1 : 0;
};

export default function ChartDisplay({
  data,
  xAxis,
  yAxis,
  chartType,
  columnDisplayNames = {},
  programTitle,
  selectedRegional = "",
}: ChartDisplayProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // converte os dados
  const chartData = useMemo(() => {
    return data.map(item => {
      let value;
      if (binaryColumns.includes(yAxis)) {
        value = parseBinary(item[yAxis]);
      } else {
        value = parseNumber(item[yAxis]);
      }
      return { ...item, [yAxis]: value };
    });
  }, [data, yAxis]);

  // aplica filtro de regional (se houver)
  const filteredDataByRegional = useMemo(() => {
    if (!selectedRegional || selectedRegional === "Todas as Regionais") {
      return chartData;
    }
    return chartData.filter(item => item.RGA === selectedRegional);
  }, [chartData, selectedRegional]);

  const isRegionalSelected = !!selectedRegional && selectedRegional !== "Todas as Regionais";

  const renderChart = () => {
    if (!xAxis || !yAxis) {
      return <p className="text-center text-gray-500 mt-20">Selecione as variáveis para os eixos X e Y para visualizar o gráfico.</p>;
    }

    const sortedData = filteredDataByRegional.sort((a, b) => b[yAxis] - a[yAxis]);
    const finalData = isRegionalSelected ? sortedData : sortedData.slice(0, 10);

    const chartFormattedData = finalData.map(item => ({
      name: item[xAxis],
      value: item[yAxis],
    }));

    const regionalName = selectedRegional;
    const yAxisDisplayName = columnDisplayNames[yAxis] || yAxis;

    const formatTooltipValue = (value: number) => {
      if (currencyColumns.includes(yAxis)) {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      }
      return value.toLocaleString("pt-BR");
    };

    switch (chartType) {
      case "bar-vertical":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartFormattedData} margin={{ top: 40, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={(value: number) => formatValue(value, yAxis)} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center"
                content={<CustomLegend payload={[{ color: '#8884d8' }]} isRegionalSelected={isRegionalSelected} yAxisDisplayName={yAxisDisplayName} regionalName={regionalName} programTitle={programTitle} />}
              />
              <Bar dataKey="value" fill="#8884d8" name={yAxisDisplayName}>
                <LabelList dataKey="value" position="top" formatter={(value: number) => formatValue(value, yAxis)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "bar-horizontal":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart layout="vertical" data={chartFormattedData} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value: number) => formatValue(value, yAxis)} />
              <YAxis type="category" dataKey="name" width={150} interval={0} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center"
                content={<CustomLegend payload={[{ color: '#8884d8' }]} isRegionalSelected={isRegionalSelected} yAxisDisplayName={yAxisDisplayName} regionalName={regionalName} programTitle={programTitle} />}
              />
              <Bar dataKey="value" fill="#8884d8" name={yAxisDisplayName}>
                <LabelList dataKey="value" position="right" offset={5} formatter={(value: number) => formatValue(value, yAxis)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartFormattedData} margin={{ top: 40, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={(value: number) => formatValue(value, yAxis)} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center"
                content={<CustomLegend payload={[{ color: '#82ca9d' }]} isRegionalSelected={isRegionalSelected} yAxisDisplayName={yAxisDisplayName} regionalName={regionalName} programTitle={programTitle} />}
              />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" name={yAxisDisplayName}>
                <LabelList dataKey="value" position="top" formatter={(value: number) => formatValue(value, yAxis)} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
              <Pie dataKey="value" data={chartFormattedData} cx="50%" cy="50%" outerRadius="80%" fill="#8884d8"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {chartFormattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center"
                content={<CustomLegend payload={[{ color: '#8884d8' }]} isRegionalSelected={isRegionalSelected} yAxisDisplayName={yAxisDisplayName} regionalName={regionalName} programTitle={programTitle} />}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return <div ref={chartRef}>{renderChart()}</div>;
}
