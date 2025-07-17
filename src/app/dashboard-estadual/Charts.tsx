"use client";

import { useEffect, useState } from "react";
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
} from "recharts";

export default function Charts({ data = [] }: { data?: any[] }) {
  const [populacaoTotal, setPopulacaoTotal] = useState<{ year: string; value: number }[]>([]);
  const [populacaoUrbana, setPopulacaoUrbana] = useState<{ year: string; value: number }[]>([]);
  const [populacaoRural, setPopulacaoRural] = useState<{ year: string; value: number }[]>([]);
  const [porteDataFormatted, setPorteDataFormatted] = useState<{ name: string; value: number }[]>([]);
  const [rendaDataFormatted, setRendaDataFormatted] = useState<{ name: string; value: number }[]>([]);
  const [instrucaoDataFormatted, setInstrucaoDataFormatted] = useState<{ name: string; value: number }[]>([]);
  const [trabalhoDataFormatted, setTrabalhoDataFormatted] = useState<{ name: string; value: number }[]>([]);
  const [bolsaFamiliaDataFormatted, setBolsaFamiliaDataFormatted] = useState<{ name: string; value: number }[]>([]);
  const [alfabetizacaoEscolarizacaoDataFormatted, setAlfabetizacaoEscolarizacaoDataFormatted] = useState<{ name: string; value: number }[]>([]);

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
    return (
      parseFloat(value.toString().replace(/\./g, "").replace(",", ".").replace("%", "").trim()) || 0
    );
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    // --- População Total, Urbana, Rural ---
    const total2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");
    const total2022Key = findKey("População CENSO - IBGE/2022 - Total 2022");

    const urbana2010Key = findKey("População - CENSO - IBGE/2010 - Urbana");
    const urbana2022PercentKey = findKey("População CENSO - IBGE/2022 - % Urbana ref 2010");

    const rural2010Key = findKey("População - CENSO - IBGE/2010 - Rural");
    const rural2022PercentKey = findKey("População CENSO - IBGE/2022 - % Rural ref 2010");

    const total2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[total2010Key]), 0);
    const total2022 = data.reduce((sum: number, row: any) => sum + parseNumber(row[total2022Key]), 0);

    const calcPercentChange = (oldValue: number, newValue: number) => {
      if (oldValue === 0) return 0;
      return ((newValue - oldValue) / oldValue) * 100;
    };

    const urbana2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[urbana2010Key]), 0);
    const rural2010 = data.reduce((sum: number, row: any) => sum + parseNumber(row[rural2010Key]), 0);

    const percUrbana2022 = parseNumber(data[0][urbana2022PercentKey]);
    const percRural2022 = parseNumber(data[0][rural2022PercentKey]);

    const urbana2022 = total2022 > 0 ? Math.round(total2022 * (percUrbana2022 / 100)) : 0;
    const rural2022 = total2022 > 0 ? Math.round(total2022 * (percRural2022 / 100)) : 0;


    setPercentChange({
      total: calcPercentChange(total2010, total2022),
      urbana: calcPercentChange(urbana2010, urbana2022),
      rural: calcPercentChange(rural2010, rural2022),
    });

    setPopulacaoTotal([
      { year: "2010", value: total2010 },
      { year: "2022", value: total2022 },
    ]);
    setPopulacaoUrbana([
      { year: "2010", value: urbana2010 },
      { year: "2022", value: urbana2022 },
    ]);
    setPopulacaoRural([
      { year: "2010", value: rural2010 },
      { year: "2022", value: rural2022 },
    ]);

    // --- Distribuição de Municípios por Porte ---
    const porteKey = findKey("Porte (CENSO, 2022)");
    if (porteKey) {
      const porteCounts = data.reduce((acc: Record<string, number>, row: any) => {
        const porte = row[porteKey]?.toString().trim() || "Desconhecido";
        acc[porte] = (acc[porte] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setPorteDataFormatted(
        Object.entries(porteCounts).map(([name, value]) => ({ name, value: value as number }))
      );
    }

    // --- Distribuição das Famílias por Faixa de Renda ---
    const pobrezaKey = findKey("CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00");
    const baixaRendaKey = findKey("CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de 218,01 até 1/2 S.M.");
    const acimaMeioSMKey = findKey("CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo");

    setRendaDataFormatted([
      { name: "Pobreza (R$ 0,00 - R$ 218,00)", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[pobrezaKey]), 0) },
      { name: "Baixa Renda (R$ 218,01 - 1/2 SM)", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[baixaRendaKey]), 0) },
      { name: "Acima de 1/2 SM", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[acimaMeioSMKey]), 0) },
    ]);

    // --- Distribuição da População por Grau de Instrução ---
    const fundamentalKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)");
    const medioKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)");
    const superiorKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)");

    setInstrucaoDataFormatted([
      { name: "Ensino Fundamental", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[fundamentalKey]), 0) },
      { name: "Ensino Médio", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[medioKey]), 0) },
      { name: "Ensino Superior", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[superiorKey]), 0) },
    ]);

    // --- Distribuição por Setor de Trabalho ---
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

    setTrabalhoDataFormatted(
      Object.entries(trabalhoKeys).map(([label, key]) => ({
        name: label,
        value: data.reduce((sum: number, row: any) => sum + parseNumber(row[findKey(key)]), 0),
      }))
    );

    // --- Comparação de Famílias no Bolsa Família ---
    const bolsaFamiliaRendaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024");
    const bolsaFamiliaBaixaRendaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024");

    setBolsaFamiliaDataFormatted([
      { name: "Renda per capita até R$218,00", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[bolsaFamiliaRendaKey]), 0) },
      { name: "Baixa Renda", value: data.reduce((sum: number, row: any) => sum + parseNumber(row[bolsaFamiliaBaixaRendaKey]), 0) },
    ]);

    // --- Taxa de Alfabetização e Escolarização ---
    const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
    const taxaEscolarizacaoKey = findKey("Educação - Taxa de Escolarização 6 a 14 anos - % (2010)");
    const populacao2022Key = findKey("População CENSO - IBGE/2022 - Total 2022");
    const populacao2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");

    const taxaAlfabetizacao = taxaAlfabetizacaoKey ? parseNumber(data[0][taxaAlfabetizacaoKey]) : 0;
    const taxaEscolarizacao = taxaEscolarizacaoKey ? parseNumber(data[0][taxaEscolarizacaoKey]) : 0;
    const populacaoCenso2022 = populacao2022Key ? parseNumber(data[0][populacao2022Key]) : 0;
    const populacaoCenso2010 = populacao2010Key ? parseNumber(data[0][populacao2010Key]) : 0;

    const alfabetizados = Math.round((taxaAlfabetizacao / 100) * populacaoCenso2022);
    const escolarizados = Math.round((taxaEscolarizacao / 100) * populacaoCenso2010);

    const alfabetizadosCorrigido = Math.min(alfabetizados, populacaoCenso2022);
    const escolarizadosCorrigido = Math.min(escolarizados, populacaoCenso2010);

    setAlfabetizacaoEscolarizacaoDataFormatted([
      { name: "Alfabetizados (2022)", value: alfabetizadosCorrigido },
      { name: "Escolarizados (2010)", value: escolarizadosCorrigido },
    ]);

  }, [data]);

  const formatPercent = (value: number) => {
    if (value === 0) return "0%";
    const sinal = value > 0 ? "+" : "";
    return `${sinal} ${value.toFixed(2)}%`;
  };

  const porteColors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
  const rendaColors = ["#ff6b6b", "#f39c12", "#50c878"];
  const instrucaoColors = ["#3498db", "#2ecc71", "#f39c12"];
  const trabalhoColors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#8e44ad", "#e67e22", "#95a5a6"];
  const bolsaFamiliaColors = ["#4A90E2", "#FF6B6B"];
  const alfabetizacaoEscolarizacaoColors = ["#4A90E2", "#50C878"];

  const handleLegendClick = (dataKey: string) => {
    setHiddenLegendItems(prev =>
      prev.includes(dataKey)
        ? prev.filter(key => key !== dataKey)
        : [...prev, dataKey]
    );
  };

  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="recharts-default-legend" style={{ textAlign: 'center', paddingTop: '10px' }}>
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenLegendItems.includes(entry.value || entry.dataKey || entry.name);
          const textDecoration = isHidden ? 'line-through' : 'none';
          const color = isHidden ? '#ccc' : entry.color;
          const opacity = isHidden ? 0.5 : 1;

          return (
            <li
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.value || entry.dataKey || entry.name)}
              style={{ display: 'inline-block', marginRight: '10px', cursor: 'pointer', color: color, textDecoration: textDecoration, opacity: opacity }}
            >
              <span className="recharts-legend-icon" style={{ backgroundColor: entry.color, display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '5px' }}></span>
              <span style={{ fontSize: '16px' }}>{entry.value || entry.dataKey || entry.name}</span> {/* Aumentado para 16px */}
            </li>
          );
        })}
      </ul>
    );
  };

  // Componente Customizado para o Tooltip dos BarCharts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          boxShadow: 'none',
          outline: 'none'
        }}>
          <p className="label" style={{ fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            const displayName = (entry.dataKey === 'value' || entry.name === 'value') ? 'Total' : (entry.name || entry.dataKey);
            return (
              <p key={`item-${index}`} style={{ color: entry.color, marginTop: '5px' }}>
                {`${displayName}: ${entry.value.toLocaleString('pt-BR')}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Componente Customizado para o Tooltip dos PieCharts (mostra nome, porcentagem e valor)
  // Recebe 'fullData' para calcular o total correto
  const CustomPieTooltip = ({ active, payload, label, fullData }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0]; // Para PieChart, payload geralmente tem 1 item para a fatia sobrevoada
      
      // Calcule o total real do gráfico a partir do fullData
      const totalGeral = fullData.reduce((sum: number, item: any) => sum + item.value, 0);
      
      // Calcule a porcentagem da fatia atual em relação ao total geral
      const percent = totalGeral > 0 ? ((entry.value / totalGeral) * 100).toFixed(0) : '0';

      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          boxShadow: 'none',
          outline: 'none'
        }}>
          <p className="label" style={{ fontWeight: 'bold' }}>{entry.name}</p> {/* Mostra o nome da categoria */}
          <p style={{ color: entry.color }}>{`Total: ${entry.value.toLocaleString('pt-BR')}`}</p> {/* Mostra o valor total da fatia */}
          <p style={{ color: entry.color }}>{`${percent}%`}</p> {/* Mostra a porcentagem */}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold">Gráficos</h2>
      <p>Visualização Gráfica.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* População Total (Line Chart) */}
        <div className="h-[350px] bg-white">
          <h2 className="text-lg font-bold text-center">População Total</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={populacaoTotal} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="value"
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR')}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', boxShadow: 'none' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend verticalAlign="top" height={36} formatter={() => <span style={{ fontSize: '16px' }}>{formatPercent(percentChange.total)}</span>} /> {/* Aumentado para 16px */}
              <Line type="monotone" dataKey="value" stroke="#4A90E2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* População Urbana (Line Chart) */}
        <div className="h-[350px] bg-white">
          <h2 className="text-lg font-bold text-center">População Urbana</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={populacaoUrbana} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="value"
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR')}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', boxShadow: 'none' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend verticalAlign="top" height={36} formatter={() => <span style={{ fontSize: '16px' }}>{formatPercent(percentChange.urbana)}</span>} /> {/* Aumentado para 16px */}
              <Line type="monotone" dataKey="value" stroke="#50C878" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* População Rural (Line Chart) */}
        <div className="h-[350px] bg-white">
          <h2 className="text-lg font-bold text-center">População Rural</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={populacaoRural} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="value"
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR')}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', boxShadow: 'none' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend verticalAlign="top" height={36} formatter={() => <span style={{ fontSize: '16px' }}>{formatPercent(percentChange.rural)}</span>} /> {/* Aumentado para 16px */}
              <Line type="monotone" dataKey="value" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Municípios por Porte (Doughnut Chart) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Distribuição de Municípios por Porte (CENSO, 2022)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={porteDataFormatted}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                // Removidas as propriedades 'labelLine' e 'label' para tirar as labels fixas
              >
                {porteDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={porteColors[index % porteColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Pie>
              {/* Passando porteDataFormatted para o CustomPieTooltip para o cálculo correto da porcentagem */}
              <Tooltip content={<CustomPieTooltip fullData={porteDataFormatted} />} />
              <Legend verticalAlign="top" height={36} content={renderCustomizedLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição das Famílias por Faixa de Renda (Doughnut Chart) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Distribuição das Famílias por Faixa de Renda</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={rendaDataFormatted}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                // Removidas as propriedades 'labelLine' e 'label' para tirar as labels fixas
              >
                {rendaDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={rendaColors[index % rendaColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Pie>
              {/* Passando rendaDataFormatted para o CustomPieTooltip para o cálculo correto da porcentagem */}
              <Tooltip content={<CustomPieTooltip fullData={rendaDataFormatted} />} />
              <Legend verticalAlign="top" height={36} content={renderCustomizedLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição da População por Grau de Instrução (Doughnut Chart) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Distribuição da População por Grau de Instrução</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={instrucaoDataFormatted}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                // Removidas as propriedades 'labelLine' e 'label' para tirar as labels fixas
              >
                {instrucaoDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={instrucaoColors[index % instrucaoColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Pie>
              {/* Passando instrucaoDataFormatted para o CustomPieTooltip para o cálculo correto da porcentagem */}
              <Tooltip content={<CustomPieTooltip fullData={instrucaoDataFormatted} />} />
              <Legend verticalAlign="top" height={36} content={renderCustomizedLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Setor de Trabalho (Bar Chart horizontal) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Distribuição por Setor de Trabalho</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trabalhoDataFormatted}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                type="number"
                scale="log"
                domain={['dataMin', 'auto']}
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 16 }} 
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140} // Aumentado a largura para acomodar nomes maiores
                tick={{ fontSize: 16 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" barSize={15}>
                {trabalhoDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={trabalhoColors[index % trabalhoColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparação de Famílias no Bolsa Família (Bar Chart vertical) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Comparação de Famílias no Bolsa Família</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bolsaFamiliaDataFormatted}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 16 }} tickLine={false} axisLine={false} /> {/* Aumentado para 16px */}
              <YAxis
                dataKey="value"
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tick={{ fontSize: 16 }} 
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" barSize={30}>
                {bolsaFamiliaDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={bolsaFamiliaColors[index % bolsaFamiliaColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taxa de Alfabetização e Escolarização (Bar Chart vertical) */}
        <div className="h-[350px] mt-10 bg-white">
          <h2 className="text-lg font-bold text-center">Taxa de Alfabetização e Escolarização</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={alfabetizacaoEscolarizacaoDataFormatted}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 16 }} tickLine={false} axisLine={false} /> {/* Aumentado para 16px */}
              <YAxis
                dataKey="value"
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tick={{ fontSize: 16 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" barSize={30}>
                {alfabetizacaoEscolarizacaoDataFormatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={alfabetizacaoEscolarizacaoColors[index % alfabetizacaoEscolarizacaoColors.length]}
                    opacity={hiddenLegendItems.includes(entry.name) ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}