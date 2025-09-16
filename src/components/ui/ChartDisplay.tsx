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
import { useMemo } from "react";
import { columnDisplayNames } from "@/lib/column-display-names";

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
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
  "#82ca9d", "#FF6F61", "#8A2BE2", "#5D9B9B", "#F5B041",
];

const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
};

const parseNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = parseFloat(value.toString().replace(/\./g, "").replace(",", "."));
  return isNaN(parsed) ? 0 : parsed;
};

export default function ChartDisplay({
  data,
  xAxis,
  yAxis,
  chartType,
  programTitle,
  selectedRegional = "",
}: ChartDisplayProps) {
  // 🔹 Garantir que os valores numéricos estão corretos
  const chartData = useMemo(
    () => data.map((item) => ({ ...item, [yAxis]: parseNumber(item[yAxis]) })),
    [data, yAxis]
  );

  // 🔹 Filtrar por Regional (se selecionada)
  const filteredData = useMemo(() => {
    if (!selectedRegional || selectedRegional === "Todas as Regionais") {
      return chartData;
    }

    const normalize = (val: any) =>
      (val || "").toString().trim().toUpperCase();

    return chartData.filter(
      (item) => normalize(item.RGA) === normalize(selectedRegional)
    );
  }, [chartData, selectedRegional]);

  // 🔹 Ordenar e limitar para Top 10 (quando não tiver filtro)
  const sortedData = [...filteredData].sort((a, b) => b[yAxis] - a[yAxis]);
  const finalData =
    selectedRegional && selectedRegional !== "Todas as Regionais"
      ? sortedData
      : sortedData.slice(0, 10);

  // 🔹 Formatar para o gráfico
  const chartFormatted = finalData.map((item) => ({
    name: item[xAxis],
    value: item[yAxis],
  }));

  const yAxisLabel = columnDisplayNames[yAxis] || yAxis;
  const formatTooltipValue = (val: number) => val.toLocaleString("pt-BR");

  const extraTitle =
    selectedRegional && selectedRegional !== "Todas as Regionais"
      ? `${programTitle} - Dados da ${selectedRegional} Regional`
      : `${programTitle} - Raking 10`;

  // 🔹 Renderizar diferentes tipos de gráfico
  switch (chartType) {
    case "bar-vertical":
      return (
        <div className="w-full h-[420px] flex flex-col items-center">
          <h4 className="font-bold text-sm mb-2 text-center">{extraTitle}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center" />
              <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
                <LabelList dataKey="value" position="top" formatter={formatValue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "bar-horizontal":
      return (
        <div className="w-full h-[420px] flex flex-col items-center">
          <h4 className="font-bold text-sm mb-2 text-center">{extraTitle}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartFormatted} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center" />
              <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
                <LabelList dataKey="value" position="right" formatter={formatValue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "line":
      return (
        <div className="w-full h-[420px] flex flex-col items-center">
          <h4 className="font-bold text-sm mb-2 text-center">{extraTitle}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" align="center" />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" name={yAxisLabel}>
                <LabelList dataKey="value" position="top" formatter={formatValue} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case "pie":
      return (
        <div className="w-full h-[420px] flex flex-col items-center">
          <h4 className="font-bold text-sm mb-2 text-center">{extraTitle}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                data={chartFormatted}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
              >
                {chartFormatted.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return null;
  }
}
