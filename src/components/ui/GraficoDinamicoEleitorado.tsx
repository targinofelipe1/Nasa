'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList, Cell
} from 'recharts';

interface EleitoradoAgregado {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Gênero': string;
  'Estado Civil': string;
  'Faixa Etária': string;
  'Escolaridade': string;
  'Raça/Cor': string;
  'Identidade de Gênero': string;
  'Quilombola': string;
  'Intérprete de Libras': string;
  'Qtd. Eleitores': number;
  'Qtd. com Biometria': number;
  'Qtd. com Deficiência': number;
  'Qtd. com Nome Social': number;
  'Tipo de Escolaridade Detalhado': string;
}

interface GraficoDinamicoProps {
  dadosFiltrados: EleitoradoAgregado[];
  abaAtiva: string;
  carregando: boolean;
}

const NAO_INFORMADO = 'NÃO INFORMADO';
const MASCULINO = 'MASCULINO';
const FEMININO = 'FEMININO';

const JOVENS = 'JOVENS (16-24)';
const ADULTOS = 'ADULTOS (25-59)';
const IDOSOS = 'IDOSOS (60+)';

const VARIAVEIS_DISPONIVEIS: { value: keyof EleitoradoAgregado | 'Faixa Etária Agrupada'; label: string }[] = [
  { value: 'Gênero', label: 'Gênero' },
  { value: 'Estado Civil', label: 'Estado Civil' },
  { value: 'Faixa Etária Agrupada', label: 'Faixa Etária' },
  { value: 'Escolaridade', label: 'Escolaridade' },
  { value: 'Raça/Cor', label: 'Raça/Cor' },
  { value: 'Identidade de Gênero', label: 'Identidade de Gênero' },
];

const FAIXAS_ETARIAS_AGRUPADAS_ORDEM = [
  JOVENS,
  ADULTOS,
  IDOSOS,
  NAO_INFORMADO
];

const getColorForValue = (categoryKey: string): string => {
  switch (categoryKey) {
    case 'FEMININO':
      return '#AD1457';
    case 'MASCULINO':
      return '#1C4B95';

    case JOVENS:
      return '#1976D2';
    case ADULTOS:
      return '#2E7D32';
    case IDOSOS:
      return '#FFBF00';
    case NAO_INFORMADO:
      return '#424242';

    case 'ANALFABETO':
      return '#5D4037';
    case 'LÊ E ESCREVE':
      return '#8BC34A';
    case 'FUNDAMENTAL INCOMPLETO':
      return '#F44336';
    case 'FUNDAMENTAL COMPLETO':
      return '#E65100';
    case 'ENSINO MÉDIO INCOMPLETO':
      return '#6A1B9A';
    case 'ENSINO MÉDIO COMPLETO':
      return '#AD1457';
    case 'SUPERIOR INCOMPLETO':
      return '#00695C';
    case 'SUPERIOR COMPLETO':
      return '#2E7D32';
    
    case 'BRANCA':
      return '#FFEB3B';
    case 'PRETA':
      return '#212121';
    case 'PARDA':
      return '#795548';
    case 'AMARELA':
      return '#FFB300';
    case 'INDÍGENA':
      return '#689F38';
    
    case 'TRANSGÊNERO':
      return '#9C27B0';
    case 'CISGÊNERO':
      return '#4CAF50';

    case 'SOLTEIRO':
      return '#283593';
    case 'CASADO':
      return '#1976D2';
    case 'DIVORCIADO':
      return '#C2185B';
    case 'VIÚVO':
      return '#6A1B9A';
    case 'SEPARADO JUDICIALMENTE':
      return '#311B92';

    default:
      return '#8884d8'; 
  }
};


const getFaixaEtariaAgrupada = (faixaEtaria: string): string => {
  const faixa = faixaEtaria.trim().toUpperCase();
  if (faixa === '16 ANOS' || faixa === '17 ANOS' || faixa === '18 ANOS' || faixa === '19 ANOS' || faixa === '20 ANOS' || faixa === '21 A 24 ANOS') {
    return JOVENS;
  }
  if (faixa === '25 A 29 ANOS' || faixa === '30 A 34 ANOS' || faixa === '35 A 39 ANOS' || faixa === '40 A 44 ANOS' || faixa === '45 A 49 ANOS' || faixa === '50 A 54 ANOS' || faixa === '55 A 59 ANOS') {
    return ADULTOS;
  }
  if (faixa === '60 A 64 ANOS' || faixa === '65 A 69 ANOS' || faixa === '70 A 74 ANOS' || faixa === '75 A 79 ANOS' || faixa === '80 A 84 ANOS' || faixa === '85 A 89 ANOS' || faixa === '90 A 94 ANOS' || faixa === '95 A 99 ANOS' || faixa === 'SUPERIOR A 100 ANOS') {
    return IDOSOS;
  }
  return NAO_INFORMADO;
};

const sortFaixaEtariaAgrupada = (a: string, b: string): number => {
  const indexA = FAIXAS_ETARIAS_AGRUPADAS_ORDEM.indexOf(a);
  const indexB = FAIXAS_ETARIAS_AGRUPADAS_ORDEM.indexOf(b);

  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
};

const GraficoDinamicoEleitorado: React.FC<GraficoDinamicoProps> = ({ dadosFiltrados, abaAtiva, carregando }) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedSecondaryVariable, setSelectedSecondaryVariable] = useState<keyof EleitoradoAgregado | 'Faixa Etária Agrupada' | ''>('');
  const [chartType, setChartType] = useState<'BarChart' | 'LineChart'>('BarChart');

  const primaryKeyFromAba = useMemo(() => {
    return VARIAVEIS_DISPONIVEIS.find(item => item.label === abaAtiva)?.value || '';
  }, [abaAtiva]);

  const canUseLineChart = useMemo(() => {
    return false; // Manter BarChart forçado para estas variáveis
  }, [primaryKeyFromAba, selectedSecondaryVariable]);

  const getUniqueSubCategories = useCallback(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0 || !primaryKeyFromAba) {
      return [];
    }

    const categories = new Set<string>();
    dadosFiltrados.forEach(item => {
      let value: string;
      if (primaryKeyFromAba === 'Faixa Etária Agrupada') {
        value = getFaixaEtariaAgrupada(String(item['Faixa Etária']));
      } else {
        value = (String(item[primaryKeyFromAba as keyof EleitoradoAgregado]) || NAO_INFORMADO).trim().toUpperCase();
      }
      categories.add(value);
    });

    const sortedCategories = Array.from(categories).sort((a, b) => {
      if (primaryKeyFromAba === 'Faixa Etária Agrupada') {
        return sortFaixaEtariaAgrupada(a, b);
      }
      if (primaryKeyFromAba === 'Gênero') {
        if (a === MASCULINO && b === FEMININO) return -1;
        if (a === FEMININO && b === MASCULINO) return 1;
      }
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });
    return sortedCategories;
  }, [dadosFiltrados, primaryKeyFromAba]);

  const subCategoryOptions = useMemo(() => getUniqueSubCategories(), [getUniqueSubCategories]);

  useEffect(() => {
    const defaultSubCategory = subCategoryOptions.length > 0 ? subCategoryOptions[0] : '';
    setSelectedSubCategory(defaultSubCategory);

    const optionsForSecondary = VARIAVEIS_DISPONIVEIS.filter(v => v.value !== primaryKeyFromAba && v.label !== 'Visão Geral');
    if (optionsForSecondary.length > 0) {
      setSelectedSecondaryVariable(optionsForSecondary[0].value);
    } else {
      setSelectedSecondaryVariable('');
    }
  }, [abaAtiva, primaryKeyFromAba, subCategoryOptions]);

  useEffect(() => {
      if (!canUseLineChart && chartType === 'LineChart') {
          setChartType('BarChart');
      }
  }, [canUseLineChart, chartType]);

  const aggregatedData = useMemo(() => {
    if (carregando || !dadosFiltrados || dadosFiltrados.length === 0 || !primaryKeyFromAba || !selectedSecondaryVariable) {
      return [];
    }

    let filteredBySubCategory = dadosFiltrados;
    if (selectedSubCategory) {
      filteredBySubCategory = dadosFiltrados.filter(item => {
        let itemPrimaryValue: string;
        if (primaryKeyFromAba === 'Faixa Etária Agrupada') {
          itemPrimaryValue = getFaixaEtariaAgrupada(String(item['Faixa Etária']));
        } else {
          itemPrimaryValue = (String(item[primaryKeyFromAba as keyof EleitoradoAgregado]) || NAO_INFORMADO).trim().toUpperCase();
        }
        return itemPrimaryValue === selectedSubCategory;
      });
    }

    const finalData: { name: string; value: number }[] = []; 
    
    const tempAggregation: { [secondaryVal: string]: number } = {};

    filteredBySubCategory.forEach(item => {
      let secondaryValueForXAxis: string;

      if (selectedSecondaryVariable === 'Faixa Etária Agrupada') {
        secondaryValueForXAxis = getFaixaEtariaAgrupada(String(item['Faixa Etária']));
      } else {
        secondaryValueForXAxis = (String(item[selectedSecondaryVariable as keyof EleitoradoAgregado]) || NAO_INFORMADO).trim().toUpperCase();
      }
      
      const qtdEleitores = item['Qtd. Eleitores'] || 0;

      if (!tempAggregation[secondaryValueForXAxis]) {
        tempAggregation[secondaryValueForXAxis] = 0;
      }
      tempAggregation[secondaryValueForXAxis] += qtdEleitores;
    });

    const sortedCategories = Array.from(Object.keys(tempAggregation)).sort((a,b) => {
        if (selectedSecondaryVariable === 'Faixa Etária Agrupada') {
            return sortFaixaEtariaAgrupada(a, b);
        }
        if (selectedSecondaryVariable === 'Gênero') {
            if (a === MASCULINO && b === FEMININO) return -1;
            if (a === FEMININO && b === MASCULINO) return 1;
        }
        return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    sortedCategories.forEach(category => {
        finalData.push({
            name: category,
            value: tempAggregation[category] || 0
        });
    });

    return finalData;

  }, [dadosFiltrados, selectedSubCategory, primaryKeyFromAba, selectedSecondaryVariable, carregando]);

  const barKeys = useMemo(() => {
    return aggregatedData.length > 0 ? ['value'] : []; 
  }, [aggregatedData]);

  const getChartTitle = useCallback(() => {
    const primaryLabel = VARIAVEIS_DISPONIVEIS.find(item => item.value === primaryKeyFromAba)?.label || '';
    const secondaryLabel = VARIAVEIS_DISPONIVEIS.find(v => v.value === selectedSecondaryVariable)?.label || '';
    
     let title = `Distribuição do Eleitorado por ${secondaryLabel}`;
        if (selectedSubCategory) {
            const formattedSubCategory = selectedSubCategory.charAt(0).toUpperCase() + selectedSubCategory.slice(1).toLowerCase();
            title += ` para ${primaryLabel}: ${formattedSubCategory}`;
        }
        return title;
        }, [primaryKeyFromAba, selectedSecondaryVariable, selectedSubCategory]);

  const renderTooltipContent = useCallback((props: any) => {
    const { payload, active } = props;

    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="custom-tooltip p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ color: entry.color }}>
            {`${entry.payload.name}: ${entry.value.toLocaleString('pt-BR')}`}
          </p>
        </div>
      );
    }
    return null;
  }, []);

  const renderLegendContent = useCallback((props: any) => {
    if (aggregatedData && aggregatedData.length > 0) {
      return (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mt-4">
          {aggregatedData.map((entry, index) => {
            const categoryName = entry.name;
            const color = getColorForValue(categoryName);
            return (
              <li key={`legend-item-${index}`} className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                {categoryName}
              </li>
            );
          })}
        </ul>
      );
    }
    return null;
  }, [aggregatedData, getColorForValue]);


  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full mt-4">
        <svg className="animate-spin h-6 w-6 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-md font-semibold mt-2">Preparando o gráfico...</p>
      </div>
    );
  }

  if (!dadosFiltrados || dadosFiltrados.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
        Nenhum dado disponível para exibir nesta aba ou com os filtros selecionados.
      </div>
    );
  }

  const hasSubCategoryOptions = subCategoryOptions.length > 0;
  const secondaryOptions = VARIAVEIS_DISPONIVEIS.filter(v => v.value !== primaryKeyFromAba && v.label !== 'Visão Geral');

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{getChartTitle()}</h2>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Variável Principal: <span className="font-semibold text-gray-900">{abaAtiva}</span>
        </p>

        {hasSubCategoryOptions && (
          <>
            <label htmlFor="sub-category-select" className="text-sm font-medium text-gray-700 whitespace-nowrap ml-4">
              Filtrar {abaAtiva}:
            </label>
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <select
                id="sub-category-select"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 px-4 pr-8 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={carregando}
                aria-label={`Filtrar sub-categoria de ${abaAtiva}`}
              >
                <option value="">-- Selecione --</option>
                {subCategoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"></path></svg>
              </div>
            </div>
          </>
        )}

        {secondaryOptions.length > 0 && (
          <>
            <label htmlFor="secondary-variable-select" className="text-sm font-medium text-gray-700 whitespace-nowrap ml-4">
              Detalhar por:
            </label>
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <select
                id="secondary-variable-select"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 px-4 pr-8 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={selectedSecondaryVariable}
                onChange={(e) => setSelectedSecondaryVariable(e.target.value as keyof EleitoradoAgregado | 'Faixa Etária Agrupada')}
                disabled={carregando}
                aria-label={`Selecionar detalhamento do gráfico por ${abaAtiva}`}
              >
                {secondaryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"></path></svg>
              </div>
            </div>
          </>
        )}

        {canUseLineChart && (
            <div className="flex items-center gap-3 ml-auto">
              <label htmlFor="chart-type-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Tipo de Gráfico:
              </label>
              <div className="relative">
                <select
                  id="chart-type-select"
                  className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 px-4 pr-8 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'BarChart' | 'LineChart')}
                  disabled={carregando}
                >
                  <option value="BarChart">Barras</option>
                  <option value="LineChart">Linhas</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"></path></svg>
                </div>
              </div>
            </div>
        )}
      </div>

      {aggregatedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'BarChart' ? (
            <BarChart
              data={aggregatedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              aria-label={`Gráfico de barras mostrando ${getChartTitle()}`}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tick={false}
                width={0}
                height={0}
              />
              <YAxis
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
              />
              <Tooltip
                content={renderTooltipContent}
                cursor={false}
                wrapperStyle={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} content={renderLegendContent} />
              
              <Bar dataKey="value">
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForValue(entry.name)} />
                ))}
                <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(value: number) => value.toLocaleString('pt-BR')} 
                    style={{ fill: '#333', fontSize: '12px' }}
                />
              </Bar>
            </BarChart>
          ) : (
            <LineChart
              data={aggregatedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              aria-label={`Gráfico de linhas mostrando ${getChartTitle()}`}
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
                tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
              />
              <Tooltip
                content={renderTooltipContent}
                cursor={{ strokeDasharray: '3 3' }}
                wrapperStyle={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} content={renderLegendContent} />
              
              <Line
                type="monotone"
                dataKey="value"
                // Aqui a cor será baseada na primeira categoria do aggregatedData.
                // Para ter múltiplas linhas coloridas em LineChart, seria necessário
                // reestruturar 'aggregatedData' para ter uma coluna por linha (ex: {date: 'Jan', FEM: 10, MASC: 12})
                stroke={aggregatedData.length > 0 ? getColorForValue(aggregatedData[0].name) : '#8884d8'}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500 py-10">
          Nenhum dado disponível para este cruzamento com os filtros atuais.
          {!selectedSecondaryVariable && <p>Selecione uma variável secundária para detalhar.</p>}
          {aggregatedData.length === 0 && selectedSubCategory && <p>Nenhum dado encontrado para a sub-categoria selecionada. Verifique os filtros aplicados.</p>}
          {aggregatedData.length === 0 && !selectedSubCategory && <p>Nenhum dado encontrado para as variáveis selecionadas. Verifique os filtros aplicados.</p>}
        </div>
      )}
    </div>
  );
};

export default GraficoDinamicoEleitorado;