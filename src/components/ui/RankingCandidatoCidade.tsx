'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface CandidatoDropdownOption {
  nome: string;
  siglaPartido: string;
  numeroCandidato?: string;
}

interface VotoAgregadoPorCidade {
  municipio: string;
  totalVotosCandidato: number;
  porcentagemNoMunicipio: number;
  posicaoRankingNoMunicipio: number;
  totalVotosValidosMunicipio: number;
}

interface RankingCandidatoCidadeProps {
  data: any[];
  candidatosDisponiveisGlobal: CandidatoDropdownOption[];
}

const RankingCandidatoCidade: React.FC<RankingCandidatoCidadeProps> = ({
  data,
  candidatosDisponiveisGlobal,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('Todos os Municípios');
  const [ordenacaoColunaRanking, setOrdenacaoColunaRanking] = useState<'totalVotosCandidato' | 'porcentagemNoMunicipio' | 'municipio' | 'posicaoRankingNoMunicipio'>('totalVotosCandidato');
  const [ordenacaoDirecaoRanking, setOrdenacaoDirecaoRanking] = useState<'asc' | 'desc'>('desc');
  const [paginaAtualRanking, setPaginaAtualRanking] = useState(1);
  const [itensPorPaginaRanking, setItensPorPaginaRanking] = useState(10);
  const [carregando, setCarregando] = useState(false);

  const safeParseVotes = useCallback((value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

  const candidatosParaRankingDropdown = useMemo(() => {
    const uniqueCandidatos = new Map<string, CandidatoDropdownOption>();
    data.forEach(item => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      if (
        nomeCandidato && siglaPartido &&
        nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
        siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()
      ) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatos.has(key)) {
          uniqueCandidatos.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    return Array.from(uniqueCandidatos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [data]);

  const municipiosDisponiveisRanking = useMemo(() => {
    const uniqueMunicipios = new Set<string>();
    if (data && data.length > 0) {
      data.forEach(item => {
        const municipio = item['Município']?.trim();
        if (municipio) {
          uniqueMunicipios.add(municipio);
        }
      });
    }
    return Array.from(uniqueMunicipios).sort((a, b) => {
      if (a === 'JOÃO PESSOA') return -1;
      if (b === 'JOÃO PESSOA') return 1;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [data]);

  const rankingData = useMemo(() => {
    if (!selectedCandidate || data.length === 0) {
      return [];
    }

    const votosPorMunicipioParaCandidato: { [municipio: string]: number } = {};
    const totalVotosValidosPorMunicipio: { [municipio: string]: number } = {};
    const candidatosPorMunicipioParaRanking: { [municipio: string]: { nome: string; totalVotos: number; siglaPartido: string; }[] } = {};

    data.forEach(item => {
      const municipio = item['Município']?.trim();
      const nomeVoto = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaVoto = item['Sigla do Partido']?.toLowerCase();
      const votos = safeParseVotes(item['Quantidade de Votos']);

      if (!municipio) return;

      const isLegenda = nomeVoto === siglaVoto?.toUpperCase();
      const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

      if (!isBrancoOuNulo && !isLegenda) {
        totalVotosValidosPorMunicipio[municipio] = (totalVotosValidosPorMunicipio[municipio] || 0) + votos;
      }

      if (!isBrancoOuNulo && !isLegenda) {
        if (!candidatosPorMunicipioParaRanking[municipio]) {
          candidatosPorMunicipioParaRanking[municipio] = [];
        }
        const existingCandidate = candidatosPorMunicipioParaRanking[municipio].find(c => c.nome === nomeVoto);
        if (existingCandidate) {
          existingCandidate.totalVotos += votos;
        } else {
          candidatosPorMunicipioParaRanking[municipio].push({ nome: nomeVoto, totalVotos: votos, siglaPartido: item['Sigla do Partido']?.trim() });
        }
      }

      if (nomeVoto === selectedCandidate.toUpperCase()) {
        votosPorMunicipioParaCandidato[municipio] = (votosPorMunicipioParaCandidato[municipio] || 0) + votos;
      }
    });

    const results: VotoAgregadoPorCidade[] = Object.keys(votosPorMunicipioParaCandidato).map(municipio => {
      const totalVotosCandidato = votosPorMunicipioParaCandidato[municipio];
      const totalValidos = totalVotosValidosPorMunicipio[municipio] || 0;
      const porcentagemNoMunicipio = totalValidos > 0 ? (totalVotosCandidato / totalValidos) * 100 : 0;

      let posicaoRankingNoMunicipio = 0;
      if (candidatosPorMunicipioParaRanking[municipio]) {
        const sortedCandidatesInMunicipio = [...candidatosPorMunicipioParaRanking[municipio]].sort((a, b) => b.totalVotos - a.totalVotos);
        let currentRank = 1;
        for (let i = 0; i < sortedCandidatesInMunicipio.length; i++) {
          if (i > 0 && sortedCandidatesInMunicipio[i].totalVotos < sortedCandidatesInMunicipio[i - 1].totalVotos) {
            currentRank = i + 1;
          }
          if (sortedCandidatesInMunicipio[i].nome === selectedCandidate.toUpperCase()) {
            posicaoRankingNoMunicipio = currentRank;
            break;
          }
        }
      }

      return {
        municipio,
        totalVotosCandidato,
        porcentagemNoMunicipio,
        posicaoRankingNoMunicipio,
        totalVotosValidosMunicipio: totalValidos,
      };
    });

    return results.sort((a, b) => {
      if (ordenacaoColunaRanking === 'totalVotosCandidato') {
        return ordenacaoDirecaoRanking === 'desc' ? b.totalVotosCandidato - a.totalVotosCandidato : a.totalVotosCandidato - b.totalVotosCandidato;
      } else if (ordenacaoColunaRanking === 'porcentagemNoMunicipio') {
        return ordenacaoDirecaoRanking === 'desc' ? b.porcentagemNoMunicipio - a.porcentagemNoMunicipio : a.porcentagemNoMunicipio - b.porcentagemNoMunicipio;
      } else if (ordenacaoColunaRanking === 'municipio') {
        return ordenacaoDirecaoRanking === 'asc' ? a.municipio.localeCompare(b.municipio, 'pt-BR') : b.municipio.localeCompare(a.municipio, 'pt-BR');
      } else if (ordenacaoColunaRanking === 'posicaoRankingNoMunicipio') {
        return ordenacaoDirecaoRanking === 'asc' ? a.posicaoRankingNoMunicipio - b.posicaoRankingNoMunicipio : b.posicaoRankingNoMunicipio - a.posicaoRankingNoMunicipio;
      }
      return 0;
    });
  }, [data, selectedCandidate, ordenacaoColunaRanking, ordenacaoDirecaoRanking, safeParseVotes]);

  const filteredRankingDataForDisplay = useMemo(() => {
    if (selectedMunicipio === 'Todos os Municípios') {
      return rankingData;
    }
    return rankingData.filter(item => item.municipio === selectedMunicipio);
  }, [rankingData, selectedMunicipio]);

  const indiceUltimoItemRanking = paginaAtualRanking * itensPorPaginaRanking;
  const indicePrimeiroItemRanking = indiceUltimoItemRanking - itensPorPaginaRanking;
  const resultadosPaginaAtualRanking = filteredRankingDataForDisplay.slice(indicePrimeiroItemRanking, indiceUltimoItemRanking);
  const totalPaginasRanking = Math.ceil(filteredRankingDataForDisplay.length / itensPorPaginaRanking);

  const irParaPaginaRanking = (page: number) => setPaginaAtualRanking(page);
  const irParaProximaPaginaRanking = () => setPaginaAtualRanking(prev => Math.min(prev + 1, totalPaginasRanking));
  const irParaPaginaAnteriorRanking = () => setPaginaAtualRanking(prev => Math.max(prev - 1, 1));

  const getPaginationNumbers = useCallback((currentPage: number, totalPages: number, siblingCount = 1) => {
    const totalPageNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalPageNumbers + 2;

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

      let pagesToProcess: (number | string)[] = [];

      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;

      pagesToProcess.push(1);

      if (hasLeftSpill) {
        pagesToProcess.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pagesToProcess.push(i);
      }

      if (hasRightSpill) {
        pagesToProcess.push('...');
      }

      if (totalPages > 1 && !pagesToProcess.includes(totalPages)) {
        pagesToProcess.push(totalPages);
      }

      const uniqueAndSortedPages: (number | string)[] = [];
      const seenNumbers = new Set<number>();
      
      if (totalPages >= 1 && !pagesToProcess.includes(1)) {
          uniqueAndSortedPages.push(1);
          seenNumbers.add(1);
      }

      pagesToProcess.forEach(page => {
          if (typeof page === 'number') {
              if (!seenNumbers.has(page)) {
                  uniqueAndSortedPages.push(page);
                  seenNumbers.add(page);
              }
          } else if (page === '...') {
              uniqueAndSortedPages.push('...');
          }
      });

      const finalCleanedPages: (number | string)[] = [];
      for (let i = 0; i < uniqueAndSortedPages.length; i++) {
          if (uniqueAndSortedPages[i] === '...') {
              if (typeof uniqueAndSortedPages[i-1] === 'number' && typeof uniqueAndSortedPages[i+1] === 'number' &&
                  (uniqueAndSortedPages[i+1] as number) - (uniqueAndSortedPages[i-1] as number) <= (siblingCount * 2 + 2) + 1 ) { 
              } else {
                  finalCleanedPages.push('...');
              }
          } else {
              finalCleanedPages.push(uniqueAndSortedPages[i]);
          }
      }
      
      const finalFilteredAndOrdered: (number | string)[] = [];
      let lastPushed: number | string | null = null;

      finalCleanedPages.forEach((item, index) => {
          if (item === '...') {
              if (lastPushed !== '...') {
                  const prevNum = typeof lastPushed === 'number' ? (lastPushed as number) : null;
                  const nextNum = typeof finalCleanedPages[index+1] === 'number' ? (finalCleanedPages[index+1] as number) : null;

                  if (prevNum !== null && nextNum !== null && nextNum - prevNum === 2) {
                      finalFilteredAndOrdered.push(prevNum + 1);
                  } else {
                      finalFilteredAndOrdered.push('...');
                  }
              }
          } else {
              finalFilteredAndOrdered.push(item);
          }
          lastPushed = item;
      });

      if (finalFilteredAndOrdered.length > 1 && finalFilteredAndOrdered[0] === '...' && finalFilteredAndOrdered[1] === 1) {
          finalFilteredAndOrdered.shift();
      }
      if (finalFilteredAndOrdered.length > 1 && finalFilteredAndOrdered[finalFilteredAndOrdered.length - 1] === '...' && finalFilteredAndOrdered[finalFilteredAndOrdered.length - 2] === totalPages) {
          finalFilteredAndOrdered.pop();
      }
      const noConsecutiveEllipses = finalFilteredAndOrdered.filter((item, index, arr) => !(item === '...' && arr[index - 1] === '...'));

      return noConsecutiveEllipses;

    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, []);

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
        Ranking de Candidato por Município
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Seleção de Candidato */}
        <div>
          <label htmlFor="candidate-select" className="block text-sm font-medium text-gray-700 mb-1">
            Selecione o Candidato:
          </label>
          <div className="relative">
            <select
              id="candidate-select"
              className={data.length === 0 ? disabledSelectClasses : selectClasses}
              value={selectedCandidate}
              onChange={(e) => {
                setSelectedCandidate(e.target.value);
                setSelectedMunicipio('Todos os Municípios');
                setPaginaAtualRanking(1);
              }}
              disabled={data.length === 0}
            >
              <option value="">Selecione um Candidato</option>
              {candidatosParaRankingDropdown.map((candidato) => (
                <option
                  key={`${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`}
                  value={candidato.nome}
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
          <label htmlFor="municipio-display-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar Município na Tabela:
          </label>
          <div className="relative">
            <select
              id="municipio-display-filter"
              className={!selectedCandidate ? disabledSelectClasses : selectClasses}
              value={selectedMunicipio}
              onChange={(e) => {
                setSelectedMunicipio(e.target.value);
                setPaginaAtualRanking(1); 
              }}
              disabled={!selectedCandidate}
            >
              <option value="Todos os Municípios">Todos os Municípios</option>
              {municipiosDisponiveisRanking.map((mun) => (
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

        <div className="col-span-1 md:col-span-2 lg:col-span-1 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="ordenacao-coluna" className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por:
            </label>
            <div className="relative">
              <select
                id="ordenacao-coluna"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                value={ordenacaoColunaRanking}
                onChange={(e) => {
                  setOrdenacaoColunaRanking(e.target.value as typeof ordenacaoColunaRanking);
                  setPaginaAtualRanking(1);
                }}
                disabled={carregando}
              >
                <option value="totalVotosCandidato">Total de Votos</option>
                <option value="porcentagemNoMunicipio">% no Município</option>
                <option value="municipio">Município (Nome)</option>
                <option value="posicaoRankingNoMunicipio">Posição no Município</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setOrdenacaoDirecaoRanking(ordenacaoDirecaoRanking === 'desc' ? 'asc' : 'desc');
              setPaginaAtualRanking(1);
            }}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 h-[42px]"
            disabled={carregando}
          >
            {ordenacaoDirecaoRanking === 'desc' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
              </svg>
            )}
            {ordenacaoDirecaoRanking === 'desc' ? 'Decrescente' : 'Crescente'}
          </button>
        </div>
        
      </div>

      {selectedCandidate && filteredRankingDataForDisplay.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Município
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Votos ({selectedCandidate})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % no Município
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posição no Município
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultadosPaginaAtualRanking.map((item, index) => (
                <tr key={item.municipio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.municipio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.totalVotosCandidato.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.porcentagemNoMunicipio.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.posicaoRankingNoMunicipio}º
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p>Selecione um candidato para visualizar o desempenho por município.</p>
        </div>
      )}

      {selectedCandidate && filteredRankingDataForDisplay.length > 0 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
          aria-label="Pagination"
        >
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={irParaPaginaAnteriorRanking}
              disabled={paginaAtualRanking === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={irParaProximaPaginaRanking}
              disabled={paginaAtualRanking === totalPaginasRanking}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indicePrimeiroItemRanking + 1}</span> a{' '}
                <span className="font-medium">{Math.min(indiceUltimoItemRanking, filteredRankingDataForDisplay.length)}</span> de{' '}
                <span className="font-medium">{filteredRankingDataForDisplay.length}</span> resultados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <label htmlFor="itens-por-pagina-ranking" className="sr-only">Itens por página</label>
                <select
                  id="itens-por-pagina-ranking"
                  className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                  value={itensPorPaginaRanking}
                  onChange={(e) => {
                    setItensPorPaginaRanking(Number(e.target.value));
                    setPaginaAtualRanking(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
                </div>
              </div>

              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={irParaPaginaAnteriorRanking}
                  disabled={paginaAtualRanking === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {getPaginationNumbers(paginaAtualRanking, totalPaginasRanking).map((pageNumber, idx) =>
                  pageNumber === '...' ? (
                    <span key={`ellipsis-ranking-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-ranking-${pageNumber}`}
                      onClick={() => irParaPaginaRanking(Number(pageNumber))}
                      aria-current={Number(pageNumber) === paginaAtualRanking ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        Number(pageNumber) === paginaAtualRanking
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
                <button
                  onClick={irParaProximaPaginaRanking}
                  disabled={paginaAtualRanking === totalPaginasRanking}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próximo</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10l-3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default RankingCandidatoCidade;