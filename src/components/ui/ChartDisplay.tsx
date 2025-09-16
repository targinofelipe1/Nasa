"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import { useMemo } from "react";
import { columnDisplayNames } from "@/lib/column-display-names";

// 🔹 Funções utilitárias
const parseNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = parseFloat(
    value.toString().replace(/\s+/g, "").replace(/\./g, "").replace(",", ".")
  );
  return isNaN(parsed) ? 0 : parsed;
};

const parseBinary = (value: any): number => {
  if (!value) return 0;
  const v = value.toString().trim().toLowerCase();
  return v === "sim" || v === "x" || v === "1" ? 1 : 0;
};

const parseCurrency = (value: any): number => {
  if (!value) return 0;

  const str = value.toString().trim();

  const normalized = str.replace(/\s+/g, " ");

  if (
    normalized === "-" ||
    normalized === "–" ||
    normalized === "R$ -" ||
    normalized === "R$ -"
  ) {
    return 0;
  }

  return (
    parseFloat(
      normalized
        .replace("R$", "")
        .replace(/\s+/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
};


// 🔹 Mapear colunas
const columnParsers: Record<string, (val: any) => number> = {
  "Segurança Alimentar - Cartão Alimentação  (municípios)": parseBinary,
  "Proteção Social Básica - Primeira Infância no SUAS": parseBinary,
  "Segurança Alimentar - PAA LEITE (municípios)": parseBinary,
  "Segurança Alimentar - PAA CDS (municípios)": parseBinary,
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual': parseCurrency,
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual': parseCurrency,
  "Segurança Alimentar - Cartão Alimentação - valor por município": parseCurrency,
  "Segurança Alimentar - PAA LEITE (investimento)": parseBinary,
  'Segurança Alimentar - PAA CDS (investimento anual)': parseCurrency,
  "Segurança Alimentar - Cisternas (valor investido em 2025": parseCurrency,
  default: parseNumber,
};

interface ChartDisplayProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  programTitle: string;
  selectedRegional?: string;
  columnDisplayNames?: Record<string, string>;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#FF6F61",
  "#8A2BE2",
  "#5D9B9B",
  "#F5B041",
];

const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
};

export default function ChartDisplay({
  data,
  xAxis,
  yAxis,
  chartType,
  programTitle,
  selectedRegional = "",
}: ChartDisplayProps) {
  const chartData = useMemo(() => {
    const parser = columnParsers[yAxis] || columnParsers.default;
    return data.map((item) => ({
      ...item,
      [yAxis]: parser(item[yAxis]),
    }));
  }, [data, yAxis]);

  const filteredData = useMemo(() => {
    if (!selectedRegional || selectedRegional === "Todas as Regionais") {
      return chartData;
    }
    const normalize = (val: any) => (val || "").toString().trim().toUpperCase();
    return chartData.filter((item) => normalize(item.RGA) === normalize(selectedRegional));
  }, [chartData, selectedRegional]);

  const sortedData = [...filteredData].sort((a, b) => b[yAxis] - a[yAxis]);
  const finalData =
    selectedRegional && selectedRegional !== "Todas as Regionais"
      ? sortedData
      : sortedData.slice(0, 10);

  const chartFormatted = finalData.map((item) => ({
    name: item[xAxis],
    value: item[yAxis],
  }));

  const yAxisLabel = columnDisplayNames[yAxis] || yAxis;
  const formatTooltipValue = (val: number) => val.toLocaleString("pt-BR");

 const renderTitle = () => (
  <h4 className="mb-2 text-center">
    <span className="block font-bold text-base text-purple-700">
      {programTitle} | {yAxisLabel}
    </span>
    <span className="block text-sm text-emerald-600">
      {selectedRegional && selectedRegional !== "Todas as Regionais"
        ? `Dados da ${selectedRegional} Regional`
        : "Ranking 10"}
    </span>
  </h4>
);


  switch (chartType) {
    case "bar-vertical":
      return (
        <div className="w-full h-[440px] flex flex-col items-center">
          {renderTitle()}
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
                <LabelList dataKey="value" position="top" offset={8} formatter={formatValue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-700 font-medium">{yAxisLabel}</div>
        </div>
      );

    case "bar-horizontal":
      // 🔹 calcular altura dinâmica
      const rowHeight = 35;
      const chartHeight = chartFormatted.length * rowHeight;

      return (
        <div className="w-full flex flex-col items-center">
          {renderTitle()}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={chartFormatted}
              margin={{ top: 20, right: 60, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                interval={0} // força todos
              />
              <Tooltip formatter={formatTooltipValue} />
              <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={6}
                  formatter={formatValue}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-700 font-medium">{yAxisLabel}</div>
        </div>
      );

    case "line":
      return (
        <div className="w-full h-[440px] flex flex-col items-center">
          {renderTitle()}
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" name={yAxisLabel}>
                <LabelList dataKey="value" position="top" offset={10} formatter={formatValue} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-gray-700 font-medium">{yAxisLabel}</div>
        </div>
      );

    case "pie":
      // 🔹 Agrupar fatias pequenas em "Outros"
      const threshold = 0.02; // 2%
      const total = chartFormatted.reduce((sum, item) => sum + item.value, 0);
      const bigSlices = chartFormatted.filter((item) => total > 0 && item.value / total >= threshold);
      const smallSlices = chartFormatted.filter((item) => total > 0 && item.value / total < threshold);
      let pieData = [...bigSlices];
      if (smallSlices.length > 0) {
        const outrosTotal = smallSlices.reduce((sum, item) => sum + item.value, 0);
        pieData.push({ name: "Outros", value: outrosTotal });
      }

      return (
        <div className="w-full h-[440px] flex flex-col items-center">
          {renderTitle()}
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                dataKey="value"
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={true}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return null;
  }
}
