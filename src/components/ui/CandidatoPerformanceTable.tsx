'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TabelaComparacaoCandidatos from './TabelaComparacaoCandidatos';


interface CandidatoPerformanceTableProps {
  data: any[];
  municipiosDisponiveis: string[];
  zonasDisponiveis: string[];
  candidatosDisponiveis: { nome: string; siglaPartido: string; numeroCandidato?: string }[];
}

interface CandidatoComparacaoRow {
  local: string;
  [key: string]: string | number;
}

const CandidatoPerformanceTable: React.FC<CandidatoPerformanceTableProps> = ({ data, municipiosDisponiveis, zonasDisponiveis, candidatosDisponiveis }) => {
  const [selectedCandidate1, setSelectedCandidate1] = useState<string>('');
  const [selectedCandidate2, setSelectedCandidate2] = useState<string>('');
  const [selectedLocationType, setSelectedLocationType] = useState<'municipio' | 'zona'>('municipio');
  const [tableData, setTableData] = useState<CandidatoComparacaoRow[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(false);

  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);

  useEffect(() => {
    setSelectedCandidate1('');
    setSelectedCandidate2('');
    setTableData([]);
    setPaginaAtual(1);
  }, [data]);

  const aggregateData = useCallback(() => {
    setCarregandoDados(true);
    const selectedCandidates = [selectedCandidate1, selectedCandidate2].filter(Boolean);

    if (selectedCandidates.length < 1) {
      setTableData([]);
      setCarregandoDados(false);
      return;
    }

    const aggregated: { [location: string]: { [candidateName: string]: { totalVotos: number; totalLocalValido: number } } } = {};
    const uniqueLocations = new Set<string>();
    const totalValidVotesByLocation: { [location: string]: number } = {};

    data.forEach(item => {
      const location = selectedLocationType === 'municipio' ? item['Município'] : `${item['Município']} - ${item['Zona Eleitoral']}`;
      const candidateName = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.toLowerCase();
      const votos = item['Quantidade de Votos'] || 0;

      const isLegenda = candidateName === siglaPartido?.toUpperCase();
      const isBrancoOuNulo = candidateName === 'BRANCO' || candidateName === 'NULO' || siglaPartido === '#nulo#';

      uniqueLocations.add(location);

      if (!isBrancoOuNulo && !isLegenda) {
        totalValidVotesByLocation[location] = (totalValidVotesByLocation[location] || 0) + votos;
      }
    });

    selectedCandidates.forEach(candName => {
      data.forEach(item => {
        const location = selectedLocationType === 'municipio' ? item['Município'] : `${item['Município']} - ${item['Zona Eleitoral']}`;
        const candidateDataName = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const votos = item['Quantidade de Votos'] || 0;

        if (candidateDataName === candName) {
          if (!aggregated[location]) {
            aggregated[location] = {};
          }
          if (!aggregated[location][candName]) {
            aggregated[location][candName] = { totalVotos: 0, totalLocalValido: totalValidVotesByLocation[location] || 0 };
          }
          aggregated[location][candName].totalVotos += votos;
        }
      });
    });

    const sortedLocations = Array.from(uniqueLocations).sort();

    const newTableData: CandidatoComparacaoRow[] = sortedLocations.map(loc => {
      const row: CandidatoComparacaoRow = { local: loc };
      selectedCandidates.forEach(cand => {
        const candidateData = aggregated[loc]?.[cand];
        const totalVotos = candidateData?.totalVotos || 0;
        const totalValid = totalValidVotesByLocation[loc] || 0;
        const percentage = totalValid > 0 ? (totalVotos / totalValid) * 100 : 0;

        row[`${cand} Votos`] = totalVotos;
        row[`${cand} %`] = percentage;
      });
      return row;
    });

    setTableData(newTableData);
    setCarregandoDados(false);
  }, [selectedCandidate1, selectedCandidate2, selectedLocationType, data, candidatosDisponiveis]);

  useEffect(() => {
    aggregateData();
  }, [selectedCandidate1, selectedCandidate2, selectedLocationType, aggregateData]);

  const selectedCandidatosInfo = [selectedCandidate1, selectedCandidate2]
    .filter(Boolean)
    .map(name => candidatosDisponiveis.find(c => c.nome === name))
    .filter(Boolean) as { nome: string; siglaPartido: string }[];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Comparativo de Desempenho de Candidatos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="candidate-select-1" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Candidato 1:
          </label>
          <div className="relative">
            <select
              id="candidate-select-1"
              className="
                appearance-none block w-full bg-white border border-gray-300 rounded-md
                py-2.5 px-3 pr-9 text-base font-medium text-gray-800 leading-tight
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                shadow-sm transition duration-150 ease-in-out
              "
              value={selectedCandidate1}
              onChange={(e) => setSelectedCandidate1(e.target.value)}
              disabled={data.length === 0}
            >
              <option value="">Selecione um candidato</option>
              {candidatosDisponiveis.map((candidato) => (
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
              className="
                appearance-none block w-full bg-white border border-gray-300 rounded-md
                py-2.5 px-3 pr-9 text-base font-medium text-gray-800 leading-tight
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                shadow-sm transition duration-150 ease-in-out
              "
              value={selectedCandidate2}
              onChange={(e) => setSelectedCandidate2(e.target.value)}
              disabled={data.length === 0}
            >
              <option value="">Selecione um candidato</option>
              {candidatosDisponiveis.map((candidato) => (
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
          <label htmlFor="location-type-select" className="block text-sm font-medium text-gray-700 mb-1">
            Agrupar por:
          </label>
          <div className="relative">
            <select
              id="location-type-select"
              className="
                appearance-none block w-full bg-white border border-gray-300 rounded-md
                py-2.5 px-3 pr-9 text-base font-medium text-gray-800 leading-tight
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                shadow-sm transition duration-150 ease-in-out
              "
              value={selectedLocationType}
              onChange={(e) => setSelectedLocationType(e.target.value as 'municipio' | 'zona')}
              disabled={data.length === 0}
            >
              <option value="municipio">Município</option>
              <option value="zona">Zona Eleitoral</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {(selectedCandidate1 || selectedCandidate2) && tableData.length > 0 ? (
        <TabelaComparacaoCandidatos
          dados={tableData}
          paginaAtual={paginaAtual}
          setPaginaAtual={setPaginaAtual}
          itensPorPagina={itensPorPagina}
          setItensPorPagina={setItensPorPagina}
          carregando={carregandoDados}
          candidatosSelecionadosNomes={selectedCandidatosInfo}
          agruparPor={selectedLocationType}
        />
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p>Selecione pelo menos um candidato nos dropdowns para visualizar o comparativo.</p>
        </div>
      )}
    </div>
  );
};

export default CandidatoPerformanceTable;