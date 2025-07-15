'use client';

import React, { useState, useEffect, useCallback, useMemo, ReactElement } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface ChartDataRecharts {
  LocalCodigo: string;
  name: string;
  [candidateName: string]: number | string;
}

interface CandidatoDropdownOption {
  nome: string;
  siglaPartido: string;
  numeroCandidato?: string;
}

interface CandidatoPerformanceVizProps {
  data: any[];
  municipiosDisponiveis: string[];
  zonasDisponiveis: string[];
  candidatosDisponiveis: CandidatoDropdownOption[];
}

const colors = [
  'rgba(75, 192, 192, 0.8)', // Cor para o primeiro candidato (Fernando Haddad na imagem)
  'rgba(255, 99, 132, 0.8)', // Cor para o segundo candidato (Jair Bolsonaro na imagem)
];

const borderColors = [
  'rgba(75, 192, 192, 1)',
  'rgba(255, 99, 132, 1)',
];

const CandidatoPerformanceViz: React.FC<CandidatoPerformanceVizProps> = ({ data, municipiosDisponiveis, zonasDisponiveis, candidatosDisponiveis }) => {
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedBairro, setSelectedBairro] = useState<string>('');
  const [selectedCandidate1, setSelectedCandidate1] = useState<string>('');
  const [selectedCandidate2, setSelectedCandidate2] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [chartDataRecharts, setChartDataRecharts] = useState<ChartDataRecharts[]>([]);
  const [hiddenDataKeys, setHiddenDataKeys] = useState<string[]>([]);

  const [totalValidVotesByLocalVotacaoState, setTotalValidVotesByLocalVotacaoState] = useState<{ [localCodigo: string]: number }>({});
  const [localCodeToNameMap, setLocalCodeToNameMap] = useState<{ [localCodigo: string]: string }>({});

  const candidatosDisponiveisInterno = useMemo(() => {
    if (!selectedMunicipio) {
      return candidatosDisponiveis;
    }

    const filteredDataByMunicipio = data.filter(item => item['Município'] === selectedMunicipio);

    const uniqueCandidatos = new Map<string, CandidatoDropdownOption>();

    filteredDataByMunicipio.forEach(item => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      if (nomeCandidato && siglaPartido &&
        nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
        siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatos.has(key)) {
          uniqueCandidatos.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    return Array.from(uniqueCandidatos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [data, selectedMunicipio, candidatosDisponiveis]);


  const bairrosFiltrados = useCallback(() => {
    if (!selectedMunicipio || selectedMunicipio === 'Todos os Municípios') {
      return [];
    }
    const bairrosDoMunicipio = new Set<string>();
    data.forEach(item => {
      if (item['Município'] === selectedMunicipio && item['Bairro do Local']) {
        bairrosDoMunicipio.add(item['Bairro do Local']);
      }
    });
    return Array.from(bairrosDoMunicipio).sort();
  }, [data, selectedMunicipio]);

  useEffect(() => {
    setSelectedMunicipio('');
    setSelectedBairro('');
    setSelectedCandidate1('');
    setSelectedCandidate2('');
    setChartType('line');
    setChartDataRecharts([]);
    setHiddenDataKeys([]);
    setTotalValidVotesByLocalVotacaoState({});
    setLocalCodeToNameMap({});
  }, [data]);

  const aggregateDataForChart = useCallback(() => {
    const selectedCandidatesArray = [selectedCandidate1, selectedCandidate2].filter(Boolean);

    if (!selectedMunicipio || selectedCandidatesArray.length === 0) {
      setChartDataRecharts([]);
      setTotalValidVotesByLocalVotacaoState({});
      setLocalCodeToNameMap({});
      return;
    }

    let filteredDataByLocation = data.filter(item => item['Município'] === selectedMunicipio);

    if (selectedBairro && selectedBairro !== 'Todos os Bairros') {
      filteredDataByLocation = filteredDataByLocation.filter(item => item['Bairro do Local'] === selectedBairro);
    }

    const aggregated: { [localVotacaoCodigo: string]: ChartDataRecharts } = {};
    const currentTotalValidVotesByLocalVotacao: { [localCodigo: string]: number } = {};
    const currentLocalCodeToNameMap: { [localCodigo: string]: string } = {};

    filteredDataByLocation.forEach(item => {
      const localVotacaoCodigo = item['Local de Votação']?.trim();
      const localVotacaoNome = item['Nome do Local']?.trim() || `Local ${localVotacaoCodigo}`;
      const candidateName = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.toLowerCase();
      const votos = item['Quantidade de Votos'] || 0;

      if (localVotacaoCodigo) {
        currentLocalCodeToNameMap[localVotacaoCodigo] = localVotacaoNome;

        const isLegenda = candidateName === siglaPartido?.toUpperCase();
        const isBrancoOuNulo = candidateName === 'BRANCO' || candidateName === 'NULO' || siglaPartido === '#nulo#';
        if (!isBrancoOuNulo && !isLegenda) {
          currentTotalValidVotesByLocalVotacao[localVotacaoCodigo] = (currentTotalValidVotesByLocalVotacao[localVotacaoCodigo] || 0) + votos;
        }

        if (!aggregated[localVotacaoCodigo]) {
          aggregated[localVotacaoCodigo] = { LocalCodigo: localVotacaoCodigo, name: localVotacaoNome };
          selectedCandidatesArray.forEach(cand => {
            aggregated[localVotacaoCodigo][cand] = 0;
          });
        }

        if (selectedCandidatesArray.includes(candidateName)) {
            aggregated[localVotacaoCodigo][candidateName] = (aggregated[localVotacaoCodigo][candidateName] as number || 0) + votos;
        }
      }
    });

    const sortedLocaisData = Object.keys(aggregated)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(key => aggregated[key]);

    setTotalValidVotesByLocalVotacaoState(currentTotalValidVotesByLocalVotacao);
    setLocalCodeToNameMap(currentLocalCodeToNameMap);
    setChartDataRecharts(sortedLocaisData);

  }, [selectedMunicipio, selectedBairro, selectedCandidate1, selectedCandidate2, data]);

  useEffect(() => {
    aggregateDataForChart();
  }, [selectedMunicipio, selectedBairro, selectedCandidate1, selectedCandidate2, chartType, aggregateDataForChart]);


  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  const CustomDot = (dataKey: string): ((props: any) => React.ReactElement<SVGElement>) => {
    return (props: any) => {
      const { cx, cy, stroke, index } = props;

      if (cx == null || cy == null) {
        return <g key={`${dataKey}-empty-${index}`} />;
      }

      return (
        <circle
          key={`${dataKey}-${index}`} 
          cx={cx}
          cy={cy}
          r={5}
          stroke={stroke}
          strokeWidth={2}
          fill="#fff"
          onMouseOver={() => setHoveredDataKey(dataKey)}
        />
      );
    };
  };


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0 || !hoveredDataKey) return null;

  const entry = payload.find((p: any) => p.dataKey === hoveredDataKey);
  if (!entry) return null;

  const localCodigo = label;
  const localName = localCodeToNameMap[localCodigo] || localCodigo;
  const totalValid = totalValidVotesByLocalVotacaoState[localCodigo] || 0;
  const candidateVotes = entry.value;
  const percentage = totalValid > 0 ? (candidateVotes / totalValid) * 100 : 0;
  const candidateInfo = candidatosDisponiveisInterno.find(c => entry.dataKey === c.nome);
  const labelText = candidateInfo ? `${candidateInfo.nome} (${candidateInfo.siglaPartido})` : entry.dataKey;

  return (
    <div className="custom-tooltip bg-white p-3 border border-gray-300 rounded shadow-lg text-sm">
      <p className="label font-semibold mb-1">
        {`Local de Votação: ${localName}`}
      </p>
      <p style={{ color: entry.color }}>
        {`${labelText}: ${candidateVotes.toLocaleString('pt-BR')} votos (${percentage.toFixed(2)}%)`}
      </p>
    </div>
  );
};

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0];
    const localCodigo = label;
    const localName = localCodeToNameMap[localCodigo] || localCodigo;
    const totalValid = totalValidVotesByLocalVotacaoState[localCodigo] || 0;
    const candidateVotes = entry.value;
    const percentage = totalValid > 0 ? (candidateVotes / totalValid) * 100 : 0;
    const candidateInfo = candidatosDisponiveisInterno.find(c => entry.dataKey === c.nome);
    const labelText = candidateInfo ? `${candidateInfo.nome} (${candidateInfo.siglaPartido})` : entry.dataKey;

    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-300 rounded shadow-lg text-sm">
        <p className="label font-semibold mb-1">{`Local de Votação: ${localName}`}</p>
        <p style={{ color: entry.color }}>
          {`${labelText}: ${candidateVotes.toLocaleString('pt-BR')} votos (${percentage.toFixed(2)}%)`}
        </p>
      </div>
    );
  };



  const handleLegendClick = (data: any) => {
    const dataKey = data.dataKey;
    setHiddenDataKeys(prevKeys =>
      prevKeys.includes(dataKey)
        ? prevKeys.filter(key => key !== dataKey)
        : [...prevKeys, dataKey]
    );
  };

  const selectClasses = `
    appearance-none block w-full bg-white border border-gray-300 rounded-full
    py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    shadow-sm transition duration-150 ease-in-out
    cursor-pointer
  `;

  const disabledSelectClasses = `
    ${selectClasses}
    bg-gray-100 text-gray-500 cursor-not-allowed
  `;

  const renderLegend = useCallback((props: any) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px' }}>
        {payload.map((entry: any) => {
          const isHidden = hiddenDataKeys.includes(entry.dataKey);
          const candidateInfo = candidatosDisponiveisInterno.find(c => entry.dataKey === c.nome);
          const label = candidateInfo ? `${candidateInfo.nome} (${candidateInfo.siglaPartido})` : entry.value;

          return (
            <li
              key={entry.value}
              onClick={() => handleLegendClick(entry)}
              style={{
                color: isHidden ? '#ccc' : entry.color,
                cursor: 'pointer',
                textDecoration: isHidden ? 'line-through' : 'none',
                opacity: isHidden ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isHidden ? '#ccc' : entry.color,
                  marginRight: '5px',
                }}
              ></div>
              {label}
            </li>
          );
        })}
      </ul>
    );
  }, [hiddenDataKeys, candidatosDisponiveisInterno, handleLegendClick]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-5">
        Visualização de Desempenho de Candidatos
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div>
          <label htmlFor="municipio-select" className="block text-sm font-medium text-gray-700 mb-1">
            Município:
          </label>
          <div className="relative">
            <select
              id="municipio-select"
              className={data.length === 0 ? disabledSelectClasses : selectClasses}
              value={selectedMunicipio}
              onChange={(e) => {
                setSelectedMunicipio(e.target.value);
                setSelectedBairro('');
                setSelectedCandidate1('');
                setSelectedCandidate2('');
                setChartType('line');
                setHiddenDataKeys([]); // Resetar hidden keys ao mudar o município
              }}
              disabled={data.length === 0}
            >
              <option value="">Todos os Municípios</option>
              {municipiosDisponiveis.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="candidate-select-1" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Candidato 1:
          </label>
          <div className="relative">
            <select
              id="candidate-select-1"
              className={!selectedMunicipio ? disabledSelectClasses : selectClasses}
              value={selectedCandidate1}
              onChange={(e) => {
                setSelectedCandidate1(e.target.value);
                setHiddenDataKeys([]); // Resetar hidden keys ao mudar o candidato
              }}
              disabled={!selectedMunicipio}
            >
              <option value="">Selecione um Candidato</option>
              {candidatosDisponiveisInterno.map((candidato) => (
                <option
                  key={`cand1-${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`}
                  value={candidato.nome}
                  disabled={candidato.nome === selectedCandidate2}
                >
                  {candidato.nome} ({candidato.siglaPartido})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="candidate-select-2" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Candidato 2:
          </label>
          <div className="relative">
            <select
              id="candidate-select-2"
              className={!selectedCandidate1 ? disabledSelectClasses : selectClasses}
              value={selectedCandidate2}
              onChange={(e) => {
                setSelectedCandidate2(e.target.value);
                setHiddenDataKeys([]); // Resetar hidden keys ao mudar o candidato
              }}
              disabled={!selectedCandidate1}
            >
              <option value="">Selecione um Candidato</option>
              {candidatosDisponiveisInterno.map((candidato) => (
                <option
                  key={`cand2-${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`}
                  value={candidato.nome}
                  disabled={candidato.nome === selectedCandidate1}
                >
                  {candidato.nome} ({candidato.siglaPartido})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="chart-type-select" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Gráfico:
          </label>
          <div className="relative">
            <select
              id="chart-type-select"
              className={!selectedMunicipio || (!selectedCandidate1 && !selectedCandidate2) ? disabledSelectClasses : selectClasses}
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
              disabled={!selectedMunicipio || (!selectedCandidate1 && !selectedCandidate2)}
            >
              <option value="line">Linha</option>
              <option value="bar">Barras</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="bairro-select" className="block text-sm font-medium text-gray-700 mb-1">
            Bairro:
          </label>
          <div className="relative">
            <select
              id="bairro-select"
              className={!selectedMunicipio || selectedMunicipio === 'Todos os Municípios' ? disabledSelectClasses : selectClasses}
              value={selectedBairro}
              onChange={(e) => {
                setSelectedBairro(e.target.value);
              }}
              disabled={!selectedMunicipio || selectedMunicipio === 'Todos os Municípios'}
            >
              <option value="">Todos os Bairros</option>
              {bairrosFiltrados().map((bairro) => (
                <option key={bairro} value={bairro}>
                  {bairro}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {selectedMunicipio && (selectedCandidate1 || selectedCandidate2) && chartDataRecharts.length > 0 ? (
        <div className="relative h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartDataRecharts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="LocalCodigo"
                  angle={0}
                  textAnchor="middle"
                  height={50}
                  interval="preserveStartEnd"
                  padding={{ left: 20, right: 20 }}
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'sans-serif'
                  }}
                />
                <YAxis
                  label={{ value: 'Total de Votos', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                />
              <Tooltip content={<CustomTooltipBar />} shared={false} cursor={false} />
                <Legend verticalAlign="top" height={36} content={renderLegend} />
                {selectedCandidate1 && (
                  <Bar
                    dataKey={selectedCandidate1}
                    name={`${candidatosDisponiveisInterno.find(c => c.nome === selectedCandidate1)?.nome} (${candidatosDisponiveisInterno.find(c => c.nome === selectedCandidate1)?.siglaPartido})`}
                    fill={hiddenDataKeys.includes(selectedCandidate1) ? 'transparent' : colors[0]}
                    stroke={hiddenDataKeys.includes(selectedCandidate1) ? 'transparent' : borderColors[0]}
                    opacity={hiddenDataKeys.includes(selectedCandidate1) ? 0.3 : 1}
                    isAnimationActive={false}
                  />
                )}
                {selectedCandidate2 && (
                  <Bar
                    dataKey={selectedCandidate2}
                    name={`${candidatosDisponiveisInterno.find(c => c.nome === selectedCandidate2)?.nome} (${candidatosDisponiveisInterno.find(c => c.nome === selectedCandidate2)?.siglaPartido})`}
                    fill={hiddenDataKeys.includes(selectedCandidate2) ? 'transparent' : colors[1]}
                    stroke={hiddenDataKeys.includes(selectedCandidate2) ? 'transparent' : borderColors[1]}
                    opacity={hiddenDataKeys.includes(selectedCandidate2) ? 0.3 : 1}
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            ) : (
              <LineChart
                  data={chartDataRecharts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="LocalCodigo"
                    angle={0}
                    textAnchor="middle"
                    height={50}
                    interval="preserveStartEnd"
                    padding={{ left: 20, right: 20 }}
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'sans-serif'
                    }}
                  />
                  <YAxis
                    label={{ value: 'Total de Votos', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                  />
                  <Tooltip content={<CustomTooltip />} shared={true} cursor={false} />
                  <Legend verticalAlign="top" height={36} content={renderLegend} />
                  {selectedCandidate1 && (
                    <Line
                      type="monotone"
                      dataKey={selectedCandidate1}
                      stroke={hiddenDataKeys.includes(selectedCandidate1) ? '#ccc' : borderColors[0]}
                      strokeWidth={hiddenDataKeys.includes(selectedCandidate1) ? 1 : 2}
                      opacity={hiddenDataKeys.includes(selectedCandidate1) ? 0.3 : 1}
                      dot={CustomDot(selectedCandidate1)}
                      activeDot={hoveredDataKey === selectedCandidate1 ? { r: 8 } : false}
                      isAnimationActive={false}
                    />
                  )}
                  {selectedCandidate2 && (
                    <Line
                      type="monotone"
                      dataKey={selectedCandidate2}
                      stroke={hiddenDataKeys.includes(selectedCandidate2) ? '#ccc' : borderColors[1]}
                      strokeWidth={hiddenDataKeys.includes(selectedCandidate2) ? 1 : 2}
                      opacity={hiddenDataKeys.includes(selectedCandidate2) ? 0.3 : 1}
                      dot={CustomDot(selectedCandidate2)}
                      activeDot={hoveredDataKey === selectedCandidate2 ? { r: 8 } : false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p>Selecione um município e pelo menos um candidato para visualizar o desempenho por Local de Votação.</p>
        </div>
      )}
    </div>
  );
};

export default CandidatoPerformanceViz;