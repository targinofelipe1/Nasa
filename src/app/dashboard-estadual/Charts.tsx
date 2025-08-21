"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { FaPlus, FaMinus } from "react-icons/fa";

// Componente para padronizar o Tooltip de Gráficos de Barra
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm outline-none">
        <p className="font-bold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => {
          const displayName = (entry.dataKey === 'value' || entry.name === 'value') ? 'Total' : (entry.name || entry.dataKey);
          return (
            <p key={`item-${index}`} className="mt-1 text-sm" style={{ color: entry.color }}>
              {`${displayName}: ${entry.value.toLocaleString('pt-BR')}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// Componente para padronizar o Tooltip de Gráficos de Pizza
const CustomPieTooltip = ({ active, payload, fullData }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const totalGeral = fullData.reduce((sum: number, item: any) => sum + item.value, 0);
    const percent = totalGeral > 0 ? ((entry.value / totalGeral) * 100).toFixed(0) : '0';

    return (
      <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm outline-none">
        <p className="font-bold text-gray-800">{entry.name}</p>
        <p className="mt-1 text-sm" style={{ color: entry.color }}>{`Total: ${entry.value.toLocaleString('pt-BR')}`}</p>
        <p className="mt-1 text-sm" style={{ color: entry.color }}>{`${percent}%`}</p>
      </div>
    );
  }
  return null;
};

const ChartCard = ({ title, children, height }: { title: string; children: React.ReactElement; height?: number }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md transition-all hover:shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">{title}</h3>
      <div style={{ height: `${height || 280}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente Principal de Gráficos
export default function Charts({ data = [] }: { data?: any[] }) {
  const [chartsData, setChartsData] = useState<any>({});
  const [percentChange, setPercentChange] = useState<{ total: number; urbana: number; rural: number }>({ total: 0, urbana: 0, rural: 0 });
  const [hiddenLegendItems, setHiddenLegendItems] = useState<string[]>([]);

  const findKey = (columnName: string) => {
    if (!data || data.length === 0 || !data[0]) return "";
    return (
      Object.keys(data[0]).find(
        (key) => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.trim().toLowerCase()
      ) || ""
    );
  };

  const parseNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "number") return value;
    return parseFloat(value.toString().replace(/\./g, "").replace(",", ".").replace("%", "").trim()) || 0;
  };

  const calcPercentChange = (oldValue: number, newValue: number) => {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const renderLineLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    const { total, urbana, rural } = percentChange;

    const legendItems = [
      { name: 'Total', value: total },
      { name: 'Urbana', value: urbana },
      { name: 'Rural', value: rural },
    ];

    return (
      <ul className="recharts-default-legend flex flex-wrap justify-center pt-2">
        {legendItems.map((item, index) => (
          <li key={index} className="mr-4 cursor-pointer" onClick={() => handleLegendClick(item.name)}>
            <div className="flex items-center">
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                marginRight: '8px',
                backgroundColor: lineColors[item.name as keyof typeof lineColors]
              }}></span>
              <span className="text-sm opacity-90">{item.name}:</span>
              <span className={`ml-1 text-sm ${item.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.value >= 0 ? <FaPlus className="inline-block" /> : <FaMinus className="inline-block" />}
                {Math.abs(item.value).toFixed(2)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center pt-2">
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenLegendItems.includes(entry.value || entry.dataKey || entry.name);
          const color = isHidden ? '#ccc' : entry.color;
          return (
            <li
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.value || entry.dataKey || entry.name)}
              style={{ display: 'flex', alignItems: 'center', marginRight: '15px', cursor: 'pointer', color: color }}
              className="text-sm transition-all"
            >
              <div style={{ backgroundColor: entry.color, width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px', opacity: isHidden ? 0.5 : 1 }}></div>
              <span className="opacity-90">{entry.value || entry.dataKey || entry.name}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const handleLegendClick = (dataKey: string) => {
    setHiddenLegendItems(prev =>
      prev.includes(dataKey)
        ? prev.filter(key => key !== dataKey)
        : [...prev, dataKey]
    );
  };

  const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#888" fill="none" />
      <circle cx={ex} cy={ey} r={2} fill="#888" stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm font-semibold">
        {value.toLocaleString('pt-BR')}
      </text>
    </g>
  );
};

  useEffect(() => {
    if (!data || data.length === 0) return;

    const total2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");
    const total2022Key = findKey("População CENSO - IBGE/2022 - Total 2022");
    const urbana2010Key = findKey("População - CENSO - IBGE/2010 - Urbana");
    const rural2010Key = findKey("População - CENSO - IBGE/2010 - Rural");
    const urbana2022PercentKey = findKey("População CENSO - IBGE/2022 - % Urbana ref 2010");
    const rural2022PercentKey = findKey("População CENSO - IBGE/2022 - % Rural ref 2010");

    const total2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[total2010Key]), 0);
    const total2022 = data.reduce((sum: number, row: any) => sum + parseNumber(row[total2022Key]), 0);
    const urbana2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[urbana2010Key]), 0);
    const rural2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[rural2010Key]), 0);
    const percUrbana2022 = data.reduce((sum: number, row: any) => sum + parseNumber(row[urbana2022PercentKey]), 0) / data.length;
    const percRural2022 = data.reduce((sum: number, row: any) => sum + parseNumber(row[rural2022PercentKey]), 0) / data.length;

    const urbana2022 = total2022 > 0 ? Math.round(total2022 * (percUrbana2022 / 100)) : 0;
    const rural2022 = total2022 > 0 ? Math.round(total2022 * (percRural2022 / 100)) : 0;


    setPercentChange({
      total: calcPercentChange(total2010, total2022),
      urbana: calcPercentChange(urbana2010, urbana2022),
      rural: calcPercentChange(rural2010, rural2022),
    });

    const populacaoLineData = [
      { year: "2010", Total: total2010, Urbana: urbana2010, Rural: rural2010 },
      { year: "2022", Total: total2022, Urbana: urbana2022, Rural: rural2022 },
    ];

    const microrregiaoData = data.reduce((acc: Record<string, number>, row: any) => {
      const microrregiao = row[findKey("Microrregião")]?.toString().trim() || "Desconhecido";
      acc[microrregiao] = (acc[microrregiao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const numMicrorregioes = Object.keys(microrregiaoData).length;
    const microrregioesChartHeight = (numMicrorregioes * 25) + 100;

    const beneficiariosData = data.map(row => ({
      name: row[findKey("Município")],
      value: parseNumber(row[findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024")]) +
        parseNumber(row[findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024")])
    })).sort((a, b) => b.value - a.value).slice(0, 15);

    const arrecadacaoData = data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Arrecadação Municipal - ano 2023 (5)")]), 0);

    const pibData = [
      { name: "PIB Per Capita", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("PIB Per Capita em R$ 1.000 - ano de 2021) (6)")]), 0) / data.length }
    ];

    const arrecadacaoPorMunicipioData = data.map(row => ({
      name: row[findKey("Município")],
      value: parseNumber(row[findKey("Arrecadação Municipal - ano 2023 (5)")])
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const pibPerCapitaPorMunicipioData = data.map(row => ({
      name: row[findKey("Município")],
      value: parseNumber(row[findKey("PIB Per Capita em R$ 1.000 - ano de 2021) (6)")])
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const porteKey = findKey("Porte (CENSO, 2022)");
    const porteData = porteKey ? data.reduce((acc: Record<string, number>, row: any) => {
      const porte = row[porteKey]?.toString().trim() || "Desconhecido";
      acc[porte] = (acc[porte] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) : {};

    const rendaData = [
      { name: "Pobreza (R$ 0 - R$ 218)", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00")]), 0) },
      { name: "Baixa Renda (R$ 218,01 - 1/2 SM)", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de 218,01 até 1/2 S.M.")]), 0) },
      { name: "Acima de 1/2 SM", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo")]), 0) },
    ];

    const instrucaoData = [
      { name: "Ensino Fundamental", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)")]), 0) },
      { name: "Ensino Médio", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)")]), 0) },
      { name: "Ensino Superior", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)")]), 0) },
    ];

    const trabalhoKeys = {
      "Conta Própria": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador por conta própria",
      "Temp. Rural": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural",
      "Sem Carteira": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada",
      "Com Carteira": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada",
      "Doméstico (c/ carteira)": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada",
      "Não-remunerado": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado",
      "Militar/Servidor": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público",
      "Empregador": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador",
      "Estagiário/Aprendiz": "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz",
    };

    const trabalhoData = Object.entries(trabalhoKeys).map(([label, key]) => ({
      name: label,
      value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey(key)]), 0),
    }));

    const bolsaFamiliaData = [
      { name: "Renda até R$218,00", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024")]), 0) },
      { name: "Baixa Renda", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024")]), 0) },
    ];

    const totalMunicipios = data.length;
    const totalTaxaAlfabetizacao = data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)")]), 0);
    const totalTaxaEscolarizacao = data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey("Educação - Taxa de Escolarização 6 a 14 anos - % (2010)")]), 0);

    const mediaAlfabetizacao = totalMunicipios > 0 ? totalTaxaAlfabetizacao / totalMunicipios : 0;
    const mediaEscolarizacao = totalMunicipios > 0 ? totalTaxaEscolarizacao / totalMunicipios : 0;

    const alfabetizacaoEscolarizacaoData = [
      { name: "Média Alfabetização (2022)", value: mediaAlfabetizacao },
      { name: "Média Escolarização (2010)", value: mediaEscolarizacao },
    ];

    setChartsData({
      populacaoLineData,
      porteData,
      rendaData,
      instrucaoData,
      trabalhoData,
      bolsaFamiliaData,
      alfabetizacaoEscolarizacaoData,
      microrregioesChartHeight,
      microrregiaoData,
      beneficiariosData, // Adicione esta linha
      arrecadacaoPorMunicipioData,
      pibPerCapitaPorMunicipioData,
    });
  }, [data]);

  const porteColors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
  const rendaColors = ["#ff6b6b", "#f39c12", "#50c878"];
  const instrucaoColors = ["#3498db", "#2ecc71", "#f39c12"];
  const trabalhoColors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#8e44ad", "#e67e22", "#95a5a6"];
  const bolsaFamiliaColors = ["#4A90E2", "#FF6B6B"];
  const alfabetizacaoEscolarizacaoColors = ["#4A90E2", "#50C878"];
  const arrecadacaoPibColors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
  const lineColors = {
    'Total': '#4A90E2',
    'Urbana': '#50C878',
    'Rural': '#FF6B6B',
  };

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold mb-6">Gráficos</h2>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10">
        <ChartCard title="Evolução Populacional">
          {chartsData.populacaoLineData && chartsData.populacaoLineData.length > 0 && (
            <LineChart
              data={chartsData.populacaoLineData}
              margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 14 }} tickLine={false} axisLine={false} padding={{ left: 30, right: 30 }} />
              <YAxis
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                tick={{ fontSize: 14 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR')}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', boxShadow: 'none' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend verticalAlign="top" height={36} content={renderLineLegend} />
              <Line type="monotone" dataKey="Total" name="Total" stroke={lineColors.Total} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} hide={hiddenLegendItems.includes("Total")} />
              <Line type="monotone" dataKey="Urbana" name="Urbana" stroke={lineColors.Urbana} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} hide={hiddenLegendItems.includes("Urbana")} />
              <Line type="monotone" dataKey="Rural" name="Rural" stroke={lineColors.Rural} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} hide={hiddenLegendItems.includes("Rural")} />
            </LineChart>
          )}
        </ChartCard>
      </div>
      
      {chartsData.microrregiaoData && (
        <div className="grid grid-cols-1 gap-6 mb-10">
          <ChartCard title="Municípios por Microrregião" height={280}>
            <BarChart
              layout="horizontal"
              data={Object.entries(chartsData.microrregiaoData).map(
                ([name, value]) => ({ name, value })
              )}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-60} // Aumente o ângulo para evitar sobreposição
                textAnchor="end"
                height={80} // Aumente a altura para acomodar o texto inclinado
                tick={{ fontSize: 10 }} // Diminua a fonte para caber mais texto
              />
              <YAxis
                tickFormatter={(value: number) => value.toLocaleString("pt-BR")}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" fill="#4A90E2" name="Municípios" />
            </BarChart>
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {chartsData.instrucaoData && (
          <ChartCard title="Grau de Instrução (CadÚnico)">
            <PieChart>
              <Pie
                data={chartsData.instrucaoData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={renderCustomLabel} // AQUI ESTÁ A MUDANÇA
              >
                {chartsData.instrucaoData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={instrucaoColors[index % instrucaoColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip fullData={chartsData.instrucaoData} />} />
              <Legend />
            </PieChart>
          </ChartCard>
        )}

        {chartsData.rendaData && (
          <ChartCard title="Distribuição de Famílias por Renda (CadÚnico)">
            <PieChart>
              <Pie
                data={chartsData.rendaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={renderCustomLabel} // AQUI ESTÁ A MUDANÇA
              >
                {chartsData.rendaData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={rendaColors[index % rendaColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip fullData={chartsData.rendaData} />} />
              <Legend />
            </PieChart>
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
       {chartsData.trabalhoData && (
        <ChartCard title="Função Principal no Trabalho (CadÚnico)" height={350}>
          <BarChart
            layout="vertical"
            data={chartsData.trabalhoData.sort((a: any, b: any) => a.value - b.value)}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              type="number"
              tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '14px', // Aumenta o tamanho da fonte da legenda
                paddingTop: '10px'
              }}
              content={(props) => {
                const { payload } = props;
                return (
                  <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {payload?.map((entry, index) => (
                      <li key={`item-${index}`} style={{ margin: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ backgroundColor: entry.color, width: '12px', height: '12px', borderRadius: '50%', marginRight: '5px' }}></div>
                        <span>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
            <Bar dataKey="value" name="Total">
              {chartsData.trabalhoData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={trabalhoColors[index % trabalhoColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      )}

        {chartsData.bolsaFamiliaData && (
          <ChartCard title="Famílias no Bolsa Família por Renda">
            <PieChart>
              <Pie
                data={chartsData.bolsaFamiliaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={renderCustomLabel}
              >
                {chartsData.bolsaFamiliaData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={bolsaFamiliaColors[index % bolsaFamiliaColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip fullData={chartsData.bolsaFamiliaData} />} />
              <Legend />
            </PieChart>
          </ChartCard>
        )}
      </div>
    </div>
  );
}