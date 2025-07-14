'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface ChartData<T extends 'bar' | 'line'> {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
    type?: T;
    yAxisID?: string;
    pointStyle?: string;
    pointRadius?: number;
    pointHoverRadius?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

interface CandidatoDropdownOption {
  nome: string;
  siglaPartido: string;
  numeroCandidato?: string;
}

interface CandidatoPerformanceVizProps {
  data: any[]; // Dados brutos, sem filtro de município aplicado aqui
  municipiosDisponiveis: string[]; // Lista completa de municípios para o dropdown da viz
  zonasDisponiveis: string[]; // Manter como prop, mas não será usada diretamente no filtro de zona
  candidatosDisponiveis: CandidatoDropdownOption[]; // Lista completa de candidatos para o cargo (sem filtro de município)
}

const colors = [
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 99, 132, 0.8)',
];

const borderColors = [
  'rgba(75, 192, 192, 1)',
  'rgba(255, 99, 132, 1)',
];

const CandidatoPerformanceViz: React.FC<CandidatoPerformanceVizProps> = ({ data, municipiosDisponiveis, zonasDisponiveis, candidatosDisponiveis }) => {
  // Estados para os filtros internos da visualização
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>(''); // Inicializa como vazio ("Todos os Municípios")
  const [selectedBairro, setSelectedBairro] = useState<string>('');
  const [selectedCandidate1, setSelectedCandidate1] = useState<string>('');
  const [selectedCandidate2, setSelectedCandidate2] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [chartData, setChartData] = useState<ChartData<'bar' | 'line'>>({ labels: [], datasets: [] });

  const [totalValidVotesByLocalVotacaoState, setTotalValidVotesByLocalVotacaoState] = useState<{ [localCodigo: string]: number }>({});
  const [localCodeToNameMap, setLocalCodeToNameMap] = useState<{ [localCodigo: string]: string }>({});

  // Memoização da lista de candidatos disponíveis para os dropdowns de Candidato 1 e 2
  // Esta lista é filtrada pelo 'selectedMunicipio' INTERNO do componente.
  const candidatosDisponiveisInterno = useMemo(() => {
    // Se nenhum município foi selecionado (selectedMunicipio é vazio), retorna a lista completa recebida via prop.
    // Presume-se que 'candidatosDisponiveis' já está filtrada pelo cargo correto (Prefeito/Vereador).
    if (!selectedMunicipio) {
      return candidatosDisponiveis;
    }

    // Filtra os dados brutos recebidos (prop 'data') pelo 'selectedMunicipio' interno
    const filteredDataByMunicipio = data.filter(item => item['Município'] === selectedMunicipio);
    
    const uniqueCandidatos = new Map<string, CandidatoDropdownOption>();
    
    filteredDataByMunicipio.forEach(item => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      // Adiciona apenas candidatos válidos (não brancos, nulos ou votos de legenda para partido)
      if (nomeCandidato && siglaPartido &&
          nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
          siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatos.has(key)) {
          uniqueCandidatos.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    // Retorna a lista de candidatos únicos, ordenada por nome.
    return Array.from(uniqueCandidatos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [data, selectedMunicipio, candidatosDisponiveis]); // Re-calcula se 'data', 'selectedMunicipio' ou 'candidatosDisponiveis' mudarem


  // Bairros disponíveis, filtrados pelo município selecionado *neste componente*.
  const bairrosFiltrados = useCallback(() => {
    if (!selectedMunicipio || selectedMunicipio === 'Todos os Municípios') {
      return [];
    }
    const bairrosDoMunicipio = new Set<string>();
    // Percorre os dados brutos para encontrar os bairros do município selecionado
    data.forEach(item => {
      if (item['Município'] === selectedMunicipio && item['Bairro do Local']) {
        bairrosDoMunicipio.add(item['Bairro do Local']);
      }
    });
    return Array.from(bairrosDoMunicipio).sort();
  }, [data, selectedMunicipio]);

  // Efeito para resetar os filtros internos *apenas* quando os dados brutos (`data`) mudam.
  // Isso acontece, por exemplo, ao trocar de aba de cargo no PainelVotacao.
  // Ele NÃO reage a filtros de município externos.
  useEffect(() => {
    setSelectedMunicipio(''); // Volta para "Todos os Municípios"
    setSelectedBairro(''); // Reseta o bairro
    setSelectedCandidate1('');
    setSelectedCandidate2('');
    setChartType('line');
    setChartData({ labels: [], datasets: [] });
    setTotalValidVotesByLocalVotacaoState({});
    setLocalCodeToNameMap({});
  }, [data]); // Dependência: Apenas 'data'

  // Função para agregar e preparar os dados para o gráfico.
  const aggregateDataForChart = useCallback(() => {
    const selectedCandidatesArray = [selectedCandidate1, selectedCandidate2].filter(Boolean);

    // Se nenhum município foi selecionado *nesta visualização*, ou nenhum candidato, não há dados para o gráfico.
    if (!selectedMunicipio || selectedCandidatesArray.length === 0) {
      setChartData({ labels: [], datasets: [] });
      setTotalValidVotesByLocalVotacaoState({});
      setLocalCodeToNameMap({});
      return;
    }

    // Filtra os dados baseados no município atualmente selecionado *nesta visualização*.
    let filteredDataByLocation = data.filter(item => item['Município'] === selectedMunicipio);

    // Filtra também por Bairro, se selecionado *nesta visualização*.
    if (selectedBairro && selectedBairro !== 'Todos os Bairros') {
      filteredDataByLocation = filteredDataByLocation.filter(item => item['Bairro do Local'] === selectedBairro);
    }

    const aggregated: { [localVotacaoCodigo: string]: { [candidateName: string]: number } } = {};
    const uniqueLocaisVotacaoCodigos = new Set<string>();
    const currentTotalValidVotesByLocalVotacao: { [localCodigo: string]: number } = {};
    const currentLocalCodeToNameMap: { [localCodigo: string]: string } = {};

    filteredDataByLocation.forEach(item => {
      const localVotacaoCodigo = item['Local de Votação']?.trim();
      const localVotacaoNome = item['Nome do Local']?.trim() || localVotacaoCodigo;

      const candidateName = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.toLowerCase();
      const votos = item['Quantidade de Votos'] || 0;

      if (localVotacaoCodigo) {
        uniqueLocaisVotacaoCodigos.add(localVotacaoCodigo);
        currentLocalCodeToNameMap[localVotacaoCodigo] = localVotacaoNome;

        const isLegenda = candidateName === siglaPartido?.toUpperCase();
        const isBrancoOuNulo = candidateName === 'BRANCO' || candidateName === 'NULO' || siglaPartido === '#nulo#';
        if (!isBrancoOuNulo && !isLegenda) {
          currentTotalValidVotesByLocalVotacao[localVotacaoCodigo] = (currentTotalValidVotesByLocalVotacao[localVotacaoCodigo] || 0) + votos;
        }
      }
    });

    setTotalValidVotesByLocalVotacaoState(currentTotalValidVotesByLocalVotacao);
    setLocalCodeToNameMap(currentLocalCodeToNameMap);

    selectedCandidatesArray.forEach(candName => {
      filteredDataByLocation.forEach(item => {
        const localVotacaoCodigo = item['Local de Votação']?.trim();
        const candidateDataName = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const votos = item['Quantidade de Votos'] || 0;

        if (localVotacaoCodigo && candidateDataName === candName) {
          if (!aggregated[localVotacaoCodigo]) {
            aggregated[localVotacaoCodigo] = {};
          }
          if (!aggregated[localVotacaoCodigo][candName]) {
            aggregated[localVotacaoCodigo][candName] = 0;
          }
          aggregated[localVotacaoCodigo][candName] += votos;
        }
      });
    });

    const sortedLocaisVotacaoCodigos = Array.from(uniqueLocaisVotacaoCodigos).sort();

    const newDatasets = selectedCandidatesArray.map((cand, index) => {
      const candidateInfo = candidatosDisponiveisInterno.find(c => c.nome === cand); // Use candidatosDisponiveisInterno aqui
      const label = candidateInfo ? `${candidateInfo.nome} (${candidateInfo.siglaPartido})` : cand;

      const totalVotesData = sortedLocaisVotacaoCodigos.map(locCodigo => aggregated[locCodigo]?.[cand] || 0);

      return {
        label: `${label} (Votos)`,
        data: totalVotesData,
        backgroundColor: chartType === 'bar' ? colors[index % colors.length] : 'transparent',
        borderColor: borderColors[index % borderColors.length],
        borderWidth: chartType === 'line' ? 2 : 1,
        type: chartType as 'bar' | 'line',
        yAxisID: 'y',
        fill: chartType === 'line' ? false : undefined,
        tension: chartType === 'line' ? 0.3 : undefined,
        pointStyle: chartType === 'line' ? 'circle' : undefined,
        pointRadius: chartType === 'line' ? 5 : undefined,
        pointHoverRadius: chartType === 'line' ? 7 : undefined,
      };
    });

    setChartData({
      labels: sortedLocaisVotacaoCodigos,
      datasets: newDatasets,
    });
  }, [selectedMunicipio, selectedBairro, selectedCandidate1, selectedCandidate2, chartType, data, candidatosDisponiveisInterno]); // Adicionado candidatosDisponiveisInterno como dependência

  useEffect(() => {
    aggregateDataForChart();
  }, [selectedMunicipio, selectedBairro, selectedCandidate1, selectedCandidate2, chartType, aggregateDataForChart]); // Removido 'data' daqui para evitar loops desnecessários.

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Desempenho dos Candidatos em ${selectedMunicipio || 'Município Selecionado'}${selectedBairro ? ` (${selectedBairro})` : ''} por Local de Votação`,
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            const localCodigo = context[0]?.label || '';
            return localCodeToNameMap[localCodigo] || localCodigo;
          },
          label: function (context: any) {
            let label = context.dataset.label || '';
            const candidateVotes = context.parsed.y;
            const localCodigo = context.label;
            const totalValid = totalValidVotesByLocalVotacaoState[localCodigo] || 0;

            let percentage = 0;
            if (totalValid > 0) {
              percentage = (candidateVotes / totalValid) * 100;
            }
            
            return `${label.replace(' (Votos)', '')}: ${candidateVotes.toLocaleString('pt-BR')} votos (${percentage.toFixed(2)}%)`;
          },
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Local de Votação'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Total de Votos'
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString('pt-BR');
          }
        }
      },
    },
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

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-5">
            Visualização de Desempenho de Candidatos
        </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Seleção de Município - Controlado internamente */}
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
                setSelectedBairro(''); // Resetar Bairro ao mudar Município
                setSelectedCandidate1(''); // Resetar Candidato 1
                setSelectedCandidate2(''); // Resetar Candidato 2
                setChartType('line');
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
        
        {/* Seleção de Candidato 1 - AGORA USA candidatosDisponiveisInterno */}
        <div>
          <label htmlFor="candidate-select-1" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Candidato 1:
          </label>
          <div className="relative">
            <select
              id="candidate-select-1"
              className={!selectedMunicipio ? disabledSelectClasses : selectClasses}
              value={selectedCandidate1}
              onChange={(e) => setSelectedCandidate1(e.target.value)}
              disabled={!selectedMunicipio} // Desabilita se nenhum município estiver selecionado
            >
              <option value="">Selecione um Candidato</option>
              {candidatosDisponiveisInterno.map((candidato) => ( // <<-- MUDANÇA AQUI
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

        {/* Seleção de Candidato 2 - AGORA USA candidatosDisponiveisInterno */}
        <div>
          <label htmlFor="candidate-select-2" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Candidato 2:
          </label>
          <div className="relative">
            <select
              id="candidate-select-2"
              className={!selectedCandidate1 ? disabledSelectClasses : selectClasses}
              value={selectedCandidate2}
              onChange={(e) => setSelectedCandidate2(e.target.value)}
              disabled={!selectedCandidate1} // Desabilita se nenhum candidato 1 for selecionado
            >
              <option value="">Selecione um Candidato</option>
              {candidatosDisponiveisInterno.map((candidato) => ( // <<-- MUDANÇA AQUI
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

        {/* Tipo de Gráfico - Permanece como está */}
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

        {/* Seleção de Bairro - Controlado internamente */}
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
                // Não resetar candidatos, apenas refiltrar
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

      {/* Condicional de exibição do gráfico */}
      {selectedMunicipio && (selectedCandidate1 || selectedCandidate2) && chartData.labels.length > 0 ? (
        <div className="relative h-96">
          {chartType === 'bar' ? (
            <Bar data={chartData as ChartData<'bar'>} options={options} />
          ) : (
            <Line data={chartData as ChartData<'line'>} options={options} />
          )}
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