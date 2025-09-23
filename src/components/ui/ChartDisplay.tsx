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
  Legend,
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

const parseNumberpaa = (value: any): number => {
  if (!value) return 0;

  const str = value.toString().trim();

  const normalized = str
    .replace(/\./g, "")   
    .replace(",", ".");  

  const parsed = Number(normalized);

  return isNaN(parsed) ? 0 : parsed;
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
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual':
    parseCurrency,
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual':
    parseCurrency,
  "Segurança Alimentar - Cartão Alimentação - valor por município":
    parseCurrency,
  "Segurança Alimentar - PAA LEITE (investimento)": parseBinary,
  "Segurança Alimentar - PAA CDS (investimento anual)": parseCurrency,
  "Segurança Alimentar - Cisternas (valor investido em 2025": parseCurrency,
  "PAA VALOR TOTAL INVESTIDO (COMPRAS)": parseNumberpaa, 
   "PAA 2023 – Recurso Federal (Quantidade Kg de alimentos)": parseNumberpaa, 
  "PAA 2024 – Recurso Federal (Quantidade Kg de alimentos)": parseNumberpaa, 
  "PAA 2024 – Recurso Estadual (Quantidade Kg de alimentos)": parseNumberpaa, 
  "PAA 2024 – Recurso Estadual e Federal (Quantidade Kg de alimentos)":parseNumberpaa, 
  default: parseNumber,
};

interface ChartDisplayProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  yAxis2?: string;
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  programTitle: string;
  selectedRegional?: string;
  columnDisplayNames?: Record<string, string>;
  showGeneral?: boolean;
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

const extractYear = (str: string) => {
  if (str.toUpperCase().includes("VALOR TOTAL INVESTIDO")) {
    return "Total Investido";
  }
  const match = str.match(/\b(20\d{2})\b/);
  return match ? match[1] : "Sem Ano";
};


export default function ChartDisplay({
  data,
  xAxis,
  yAxis,
  yAxis2,
  chartType,
  programTitle,
  selectedRegional = "",
  showGeneral = false,
}: ChartDisplayProps) {
  // 🔹 Preparar os dados
  const chartData = useMemo(() => {
    const parser1 = columnParsers[yAxis] || columnParsers.default;
    const parser2 = yAxis2 ? columnParsers[yAxis2] || columnParsers.default : null;

    return data.map((item) => ({
      ...item,
      [yAxis]: parser1(item[yAxis]),
      ...(yAxis2 ? { [yAxis2]: parser2!(item[yAxis2]) } : {}),
    }));
  }, [data, yAxis, yAxis2]);

  // 🔹 Filtro por regional
  const filteredData = useMemo(() => {
    if (!selectedRegional || selectedRegional === "Todas as Regionais") {
      return chartData;
    }
    const normalize = (val: any) => (val || "").toString().trim().toUpperCase();
    return chartData.filter(
      (item) => normalize(item.RGA) === normalize(selectedRegional)
    );
  }, [chartData, selectedRegional]);

  // 🔹 Ordenar e limitar
  const sortedData = [...filteredData].sort((a, b) => b[yAxis] - a[yAxis]);
  const finalData =
  showGeneral && xAxis === "ano"
    ? sortedData // ✅ usa todos
    : (selectedRegional && selectedRegional !== "Todas as Regionais"
        ? sortedData
        : sortedData.slice(0, 10));

  let chartFormatted: any[] = [];

  if (showGeneral && xAxis === "ano") {
    // 🔹 Agora usamos os anos extraídos do yAxis e yAxis2
    const ano1 = extractYear(yAxis);
    const ano2 = yAxis2 ? extractYear(yAxis2) : null;

    chartFormatted = [];

    if (ano1) {
  const total1 = finalData.reduce((s, i) => s + (i[yAxis] || 0), 0);
  chartFormatted.push({ name: ano1, value: total1 });
}
if (yAxis2 && ano2) {
  const total2 = finalData.reduce((s, i) => s + (i[yAxis2] || 0), 0);
  chartFormatted.push({ name: ano2, value: total2 });
}

  } else {
    // 🔹 comportamento padrão (municípios)
    chartFormatted = finalData.map((item) => {
      const municipio =
        item["MUNICÍPIO"] ||
        item["Município"] ||
        item["municipio"] ||
        item[xAxis];

      return {
        name: municipio,
        value: item[yAxis],
        ...(yAxis2 ? { value2: item[yAxis2] } : {}),
      };
    });
  }

  const yAxisLabel = columnDisplayNames[yAxis] || yAxis;
  const yAxis2Label = yAxis2 ? columnDisplayNames[yAxis2] || yAxis2 : "";
  const formatTooltipValue = (val: number) => val.toLocaleString("pt-BR");

  const renderTitle = () => (
    <h4 className="mb-2 text-center">
      <span className="block font-bold text-base text-purple-700">
        {programTitle} | {yAxisLabel}
        {yAxis2 ? ` x ${yAxis2Label}` : ""}
        {showGeneral && xAxis === "ano" ? " | Totais por Ano" : ""}
      </span>
      <span className="block text-sm text-emerald-600">
        {selectedRegional && selectedRegional !== "Todas as Regionais"
          ? `Dados da ${selectedRegional} Regional`
          : showGeneral && xAxis === "ano"
          ? "Totais por Ano"
          : "Ranking 10"}
      </span>
    </h4>
  );

  // -------------------
  // 🔹 Renderização
  // -------------------
  switch (chartType) {
    case "bar-vertical": {
  const isPAA = showGeneral && xAxis === "ano";

  if (isPAA) {
    const ano1 = extractYear(yAxis);
    const ano2 = yAxis2 ? extractYear(yAxis2) : null;

    const total1 = finalData.reduce((s, i) => s + (i[yAxis] || 0), 0);
    const total2 = yAxis2 ? finalData.reduce((s, i) => s + (i[yAxis2] || 0), 0) : 0;

    // dataset com uma única categoria, mas dois valores (anos diferentes)
    const chartAno = [
      {
        name: "Totais",
        ...(ano1 ? { [ano1]: total1 } : {}),
        ...(ano2 ? { [ano2]: total2 } : {}),
      },
    ];

    return (
      <div className="w-full h-[440px] flex flex-col items-center">
        {renderTitle()}
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartAno}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis tickFormatter={formatValue} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend verticalAlign="bottom" align="center" />

            {ano1 && (
              <Bar dataKey={ano1} fill="#8884d8" name={ano1}>
                <LabelList
                  dataKey={ano1}
                  position="top"
                  offset={8}
                  formatter={formatValue}
                />
              </Bar>
            )}

            {ano2 && (
              <Bar dataKey={ano2} fill="#82ca9d" name={ano2}>
                <LabelList
                  dataKey={ano2}
                  position="top"
                  offset={8}
                  formatter={formatValue}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 🔹 Caso normal (municípios)
  return (
    <div className="w-full h-[440px] flex flex-col items-center">
      {renderTitle()}
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartFormatted}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="5%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tickFormatter={(value) => {
              if (!value) return "";
              const str = value.toString();
              return str.length > 12 ? str.substring(0, 12) + "..." : str;
            }}
          />
          <YAxis tickFormatter={formatValue} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend verticalAlign="top" align="center" />

          <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              formatter={formatValue}
            />
          </Bar>

          {yAxis2 && (
            <Bar dataKey="value2" fill="#82ca9d" name={yAxis2Label}>
              <LabelList
                dataKey="value2"
                position="top"
                offset={8}
                formatter={formatValue}
              />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

case "bar-horizontal": {
  // 🔹 Se for totais por ano (showGeneral + eixo ano)
  if (showGeneral && xAxis === "ano") {
    const ano1 = extractYear(yAxis);
    const ano2 = yAxis2 ? extractYear(yAxis2) : null;

    const total1 = finalData.reduce((s, i) => s + (i[yAxis] || 0), 0);
    const total2 = yAxis2 ? finalData.reduce((s, i) => s + (i[yAxis2] || 0), 0) : 0;

    // dataset com uma linha e duas colunas (anos)
    const chartAno = [
      {
        name: "Totais",
        ...(ano1 ? { [ano1]: total1 } : {}),
        ...(ano2 ? { [ano2]: total2 } : {}),
      },
    ];

    return (
      <div className="w-full flex flex-col items-center">
        {renderTitle()}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={chartAno}
            margin={{ top: 20, right: 60, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatValue} />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />

            {/* Barra do ano1 */}
            {ano1 && (
              <Bar dataKey={ano1} fill="#8884d8" name={ano1}>
                <LabelList
                  dataKey={ano1}
                  position="right"
                  offset={6}
                  formatter={formatValue}
                />
              </Bar>
            )}

            {/* Barra do ano2 */}
            {ano2 && (
              <Bar dataKey={ano2} fill="#82ca9d" name={ano2}>
                <LabelList
                  dataKey={ano2}
                  position="right"
                  offset={6}
                  formatter={formatValue}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 🔹 Caso normal (municípios)
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
          <YAxis type="category" dataKey="name" width={150} interval={0} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />

          {/* Barra principal */}
          <Bar dataKey="value" fill="#8884d8" name={yAxisLabel}>
            <LabelList
              dataKey="value"
              position="right"
              offset={6}
              formatter={formatValue}
            />
          </Bar>

          {/* Segunda barra (se existir) */}
          {yAxis2 && (
            <Bar dataKey="value2" fill="#82ca9d" name={yAxis2Label}>
              <LabelList
                dataKey="value2"
                position="right"
                offset={6}
                formatter={formatValue}
              />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
  


    case "line": {
  return (
    <div className="w-full h-[480px] flex flex-col items-center">
      {renderTitle()}
      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={chartFormatted}
          margin={{ top: 30, right: 40, left: 30, bottom: 90 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tickFormatter={formatValue}
            padding={{ top: 40, bottom: 40 }}
            domain={[0, "auto"]}
          />
          <Tooltip formatter={formatTooltipValue} />
          <Legend
            verticalAlign="top"
            align="center"
            wrapperStyle={{ marginBottom: 20 }}
            payload={
              showGeneral && xAxis === "ano"
                ? [
                    {
                      value: "Ano " + chartFormatted[0]?.name,
                      type: "rect" as const,
                      color: "#8884d8",
                    },
                    ...(yAxis2
                      ? [
                          {
                            value: "Ano " + chartFormatted[1]?.name,
                            type: "rect" as const,
                            color: "#82ca9d",
                          },
                        ]
                      : []),
                  ]
                : undefined
            }
          />

          {/* 🔹 Linha principal */}
         <Line
  type="monotone"
  dataKey="value"
  stroke="#8884d8"
  name={yAxisLabel}
  dot={{ r: 4 }}
>
  <LabelList
    dataKey="value"
    content={({ x, y, value }) => {
      if (value == null) return null;
      return (
        <text
          x={Number(x) + 10}  // ✅ garante número
          y={Number(y) - 10}  // ✅ garante número
          fill="#000"
          fontSize={12}
          textAnchor="start"
        >
          {formatValue(Number(value))}
        </text>
      );
    }}
  />
</Line>

{yAxis2 && (
  <Line
    type="monotone"
    dataKey="value2"
    stroke="#82ca9d"
    name={yAxis2Label}
    dot={{ r: 4 }}
  >
    <LabelList
      dataKey="value2"
      content={({ x, y, value }) => {
        if (value == null) return null;
        return (
          <text
            x={Number(x) + 10}  // ✅ garante número
            y={Number(y) + 15}  // ✅ garante número
            fill="#000"
            fontSize={12}
            textAnchor="start"
          >
            {formatValue(Number(value))}
          </text>
        );
      }}
    />
  </Line>
)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


   case "pie": {
  if (showGeneral && xAxis === "ano" && yAxis2) {
    // 🔹 Montar um único dataset com 2023 e 2024
    const ano1 = extractYear(yAxis);
    const ano2 = extractYear(yAxis2);

    const total1 = finalData.reduce((s, i) => s + (i[yAxis] || 0), 0);
    const total2 = finalData.reduce((s, i) => s + (i[yAxis2] || 0), 0);

    const pieData = [
      { name: ano1, value: total1 },
      { name: ano2, value: total2 },
    ];

    const totalGeral = total1 + total2;

    return (
      <div className="w-full h-[440px] flex flex-col items-center">
        {renderTitle()}
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={({ name, value }) => {
                const perc = ((value / totalGeral) * 100).toFixed(1);
                return `${name}: ${formatValue(value)} (${perc}%)`;
              }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => {
                const perc = ((val / totalGeral) * 100).toFixed(1);
                return `${formatValue(val)} (${perc}%)`;
              }}
            />
            <Legend verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 🔹 comportamento normal (dois gráficos: yAxis e yAxis2 separados)
  if (yAxis2) {
    const total1 = chartFormatted.reduce((s, i) => s + i.value, 0);
    const total2 = chartFormatted.reduce((s, i) => s + (i.value2 || 0), 0);

    const pieData1 = chartFormatted.map((i) => ({
      name: i.name,
      value: i.value,
    }));
    const pieData2 = chartFormatted.map((i) => ({
      name: i.name,
      value: i.value2,
    }));

    return (
      <div className="w-full h-[460px] grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <h4 className="font-bold mb-2">{yAxisLabel}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData1}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="75%"
                label={({ name, value }) => {
                  const perc = total1 ? ((value / total1) * 100).toFixed(1) : 0;
                  return `${name}: ${formatValue(value)} (${perc}%)`;
                }}
              >
                {pieData1.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => {
                  const perc = total1 ? ((val / total1) * 100).toFixed(1) : 0;
                  return `${formatValue(val)} (${perc}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col items-center">
          <h4 className="font-bold mb-2">{yAxis2Label}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData2}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="75%"
                label={({ name, value }) => {
                  const perc = total2 ? ((value / total2) * 100).toFixed(1) : 0;
                  return `${name}: ${formatValue(value)} (${perc}%)`;
                }}
              >
                {pieData2.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => {
                  const perc = total2 ? ((val / total2) * 100).toFixed(1) : 0;
                  return `${formatValue(val)} (${perc}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 🔹 comportamento normal (um único gráfico)
  const total = chartFormatted.reduce((s, i) => s + i.value, 0);

  return (
    <div className="w-full h-[440px] flex flex-col items-center">
      {renderTitle()}
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            dataKey="value"
            data={chartFormatted}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            label={({ name, value }) => {
              const perc = total ? ((value / total) * 100).toFixed(1) : 0;
              return `${name}: ${formatValue(value)} (${perc}%)`;
            }}
          >
            {chartFormatted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => {
              const perc = total ? ((val / total) * 100).toFixed(1) : 0;
              return `${formatValue(val)} (${perc}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

    default:
      return null;
  }
}
