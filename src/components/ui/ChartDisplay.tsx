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
import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { columnDisplayNames } from '@/lib/column-display-names';

interface ChartDisplayProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  columnDisplayNames?: Record<string, string>;
  isRegionalSelected?: boolean;
  programTitle: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6F61", "#8A2BE2", "#5D9B9B", "#F5B041"];

const formatValue = (value: number) => {
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
    ? `Dados da ${regionalName} Regional`
    : `Top 10 Municípios`;

  return (
    <div style={{ textAlign: 'center', marginTop: '10px' }}>
      {programTitle && (
        <h2 style={{ color: '#000', fontSize: '1.2em', marginBottom: '5px' }}>{programTitle}</h2>
      )}
      <span style={{ color: payload[0]?.color }}>
        {legendLabel} - {yAxisDisplayName}
      </span>
    </div>
  );
};

export default function ChartDisplay({ data, xAxis, yAxis, chartType, columnDisplayNames = {}, isRegionalSelected = false, programTitle }: ChartDisplayProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = data.map(item => ({
    ...item,
    [yAxis]: parseFloat(String(item[yAxis]).replace(/\./g, '').replace(',', '.') || '0')
  }));

  const renderChart = () => {
    if (!xAxis || !yAxis) {
      return (
        <p className="text-center text-gray-500 mt-20">
          Selecione as variáveis para os eixos X e Y para visualizar o gráfico.
        </p>
      );
    }
    
    const sortedData = chartData.sort((a, b) => b[yAxis] - a[yAxis]);
    
    const finalData = isRegionalSelected ? sortedData : sortedData.slice(0, 10);
    
    const filteredAndFormattedData = finalData.map(item => ({
      name: item[xAxis],
      value: item[yAxis],
    }));

    const regionalName = isRegionalSelected && finalData.length > 0 ? finalData[0].RGA : '';
    const yAxisDisplayName = columnDisplayNames[yAxis] || yAxis;

    switch (chartType) {
      case "bar-vertical":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredAndFormattedData} margin={{ top: 50, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR")} />
              <Legend 
                verticalAlign="top"
                align="center"
                content={<CustomLegend
                  payload={[{ color: '#8884d8' }]}
                  isRegionalSelected={isRegionalSelected} 
                  yAxisDisplayName={yAxisDisplayName} 
                  regionalName={regionalName}
                  programTitle={programTitle}
                />} 
              />
              <Bar dataKey="value" fill="#8884d8" name={yAxisDisplayName}>
                <LabelList dataKey="value" position="top" formatter={formatValue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "bar-horizontal":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart layout="vertical" data={filteredAndFormattedData} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis type="category" dataKey="name" width={150} interval={0} />
              <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR")} />
              <Legend 
                verticalAlign="top"
                align="center"
                content={<CustomLegend
                  payload={[{ color: '#8884d8' }]}
                  isRegionalSelected={isRegionalSelected} 
                  yAxisDisplayName={yAxisDisplayName} 
                  regionalName={regionalName}
                  programTitle={programTitle}
                />} 
              />
              <Bar dataKey="value" fill="#8884d8" name={yAxisDisplayName}>
                <LabelList dataKey="value" position="right" offset={5} formatter={formatValue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filteredAndFormattedData} margin={{ top: 50, right: 30, left: 20, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR")} />
              <Legend 
                verticalAlign="top"
                align="center"
                content={<CustomLegend
                  payload={[{ color: '#82ca9d' }]}
                  isRegionalSelected={isRegionalSelected} 
                  yAxisDisplayName={yAxisDisplayName} 
                  regionalName={regionalName}
                  programTitle={programTitle}
                />} 
              />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" name={yAxisDisplayName} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        const totalValue = filteredAndFormattedData.reduce((sum, entry) => sum + entry.value, 0);
        const groupedData = filteredAndFormattedData.reduce<{ name: string; value: number; }[]>((acc, entry) => {
          if (entry.value / totalValue < 0.05) {
            const outrosIndex = acc.findIndex(d => d.name === "Outros");
            if (outrosIndex > -1) {
              acc[outrosIndex].value += entry.value;
            } else {
              acc.push({ name: "Outros", value: entry.value });
            }
          } else {
            acc.push(entry);
          }
          return acc;
        }, []);

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                dataKey="value"
                data={groupedData}
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {groupedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="top"
                align="center"
                wrapperStyle={{ 
                  paddingBottom: '20px', 
                  marginBottom: '20px', 
                }}
                content={<CustomLegend
                  payload={[{ color: '#8884d8' }]}
                  isRegionalSelected={isRegionalSelected} 
                  yAxisDisplayName={yAxisDisplayName} 
                  regionalName={regionalName}
                  programTitle={programTitle}
                />} 
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={chartRef}>
      {renderChart()}
    </div>
  );
}