'use client';

import React, { useState, useMemo, useCallback } from 'react';

interface MapMunicipioMetrics {
  totalEleitores: number;
  percMulheres: number;
  percJovens: number;
  percAdultos: number;
  percIdosos: number;
  percMasculino: number;
  percFeminino: number;
  percAnalfabetos: number;
  totalJovens: number;
  totalAdultos: number;
  totalIdosos: number;
  totalMulheres: number;
  totalHomens: number;
  totalAnalfabetos: number;
}

interface RankingEleitoradoProps {
  mapMunicipioMetrics: Record<string, MapMunicipioMetrics>;
  carregando: boolean;
}

const RankingEleitorado: React.FC<RankingEleitoradoProps> = ({
  mapMunicipioMetrics,
  carregando,
}) => {
  const [ordenacaoColuna, setOrdenacaoColuna] = useState<keyof MapMunicipioMetrics | 'municipio'>('totalEleitores');
  const [ordenacaoDirecao, setOrdenacaoDirecao] = useState<'asc' | 'desc'>('desc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [filtroMunicipio, setFiltroMunicipio] = useState('');

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');
  const formatPercentage = (num: number) => `${num.toFixed(2)}%`;

  const dadosParaExibir = useMemo(() => {
    let dados = Object.entries(mapMunicipioMetrics).map(([municipio, metrics]) => ({
      municipio,
      ...metrics,
    }));

    if (filtroMunicipio) {
      const termoNormalizado = filtroMunicipio.trim().toUpperCase();
      dados = dados.filter(d => d.municipio.includes(termoNormalizado));
    }

    dados.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (ordenacaoColuna === 'municipio') {
        valA = a.municipio;
        valB = b.municipio;
      } else {
        valA = a[ordenacaoColuna] as number;
        valB = b[ordenacaoColuna] as number;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return ordenacaoDirecao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return ordenacaoDirecao === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
    });

    return dados;
  }, [mapMunicipioMetrics, ordenacaoColuna, ordenacaoDirecao, filtroMunicipio]);

  const totalPaginas = Math.ceil(dadosParaExibir.length / itensPorPagina);
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const dadosPaginados = dadosParaExibir.slice(indicePrimeiroItem, indiceUltimoItem);

  const irParaProximaPagina = () => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  const irParaPaginaAnterior = () => setPaginaAtual(prev => Math.max(prev - 1, 1));

  // Removido handleSort pois a ordenação será controlada pelos selects

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
        <svg className="animate-spin h-8 w-8 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold mt-4">Calculando ranking...</p>
      </div>
    );
  }

  if (dadosParaExibir.length === 0) {
    return (
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
        Nenhum dado encontrado para exibir o ranking.
      </div>
    );
  }

  // Removido renderSortArrow

  return (
    <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking de Municípios do Eleitorado</h3>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="filtro-municipio-ranking" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar Município:
          </label>
          <input
            type="text"
            id="filtro-municipio-ranking"
            className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por município..."
            value={filtroMunicipio}
            onChange={(e) => { setFiltroMunicipio(e.target.value.toUpperCase()); setPaginaAtual(1); }}
          />
        </div>

        {/* NOVO: Dropdown para selecionar a coluna de ordenação */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="ordenar-por-coluna" className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por:
          </label>
          <div className="relative">
            <select
              id="ordenar-por-coluna"
              className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={ordenacaoColuna}
              onChange={(e) => {
                setOrdenacaoColuna(e.target.value as keyof MapMunicipioMetrics | 'municipio');
                setPaginaAtual(1); // Resetar para a primeira página ao mudar a ordenação
              }}
            >
              <option value="totalEleitores">Total Eleitores</option>
              <option value="percMulheres">% Mulheres</option>
              <option value="percMasculino">% Homens</option>
              <option value="percJovens">% Jovens (16-24)</option>
              <option value="percAdultos">% Adultos (25-59)</option>
              <option value="percIdosos">% Idosos (60+)</option>
              <option value="percAnalfabetos">% Analfabetos</option>
              <option value="municipio">Nome do Município</option>
            </select>
          </div>
        </div>

        {/* NOVO: Dropdown para selecionar a direção da ordenação */}
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="ordenar-direcao" className="block text-sm font-medium text-gray-700 mb-1">
            Direção:
          </label>
          <div className="relative">
            <select
              id="ordenar-direcao"
              className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={ordenacaoDirecao}
              onChange={(e) => {
                setOrdenacaoDirecao(e.target.value as 'asc' | 'desc');
                setPaginaAtual(1); // Resetar para a primeira página ao mudar a direção
              }}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {/* Cabeçalhos da tabela agora sem onClick para ordenação, que será feita pelos dropdowns */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Município
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Eleitores
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Mulheres
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Homens
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Jovens (16-24)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Adultos (25-59)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Idosos (60+)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Analfabetos
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dadosPaginados.map((item, index) => (
              <tr key={item.municipio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.municipio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatNumber(item.totalEleitores)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percFeminino)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percMasculino)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percJovens)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percAdultos)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percIdosos)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercentage(item.percAnalfabetos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação */}
      <nav
        className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
        aria-label="Pagination"
      >
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={irParaPaginaAnterior}
            disabled={paginaAtual === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            onClick={irParaProximaPagina}
            disabled={paginaAtual === totalPaginas}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Próximo
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{indicePrimeiroItem + 1}</span> a{' '}
              <span className="font-medium">{Math.min(indiceUltimoItem, dadosParaExibir.length)}</span> de{' '}
              <span className="font-medium">{dadosParaExibir.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <label htmlFor="itens-por-pagina-ranking" className="sr-only">Itens por página</label>
              <select
                id="itens-por-pagina-ranking"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                value={itensPorPagina}
                onChange={(e) => {
                  setItensPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
              </div>
            </div>

            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                <button
                  key={pagina}
                  onClick={() => setPaginaAtual(pagina)}
                  aria-current={pagina === paginaAtual ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    pagina === paginaAtual
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {pagina}
                </button>
              ))}
              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
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
    </div>
  );
};

export default RankingEleitorado;
