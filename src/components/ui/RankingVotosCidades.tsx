'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Interfaces de dados para votos de apoio
interface VotoApoioPorCidade {
  municipio: string;
  totalVotosEsperados: number;
}

const RankingVotosCidades: React.FC = () => {
  const [dadosApoio, setDadosApoio] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [ordenacaoColuna, setOrdenacaoColuna] = useState<'municipio' | 'totalVotosEsperados'>('totalVotosEsperados');
  const [ordenacaoDirecao, setOrdenacaoDirecao] = useState<'asc' | 'desc'>('desc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Busca os dados da planilha de apoio
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets/eleicao/apoio');
        const json = await res.json();

        if (!json.success || !json.data) {
          setErro('Falha ao carregar os dados da planilha de apoio.');
          return;
        }

        const linhas: string[][] = json.data?.slice(1) || [];
        const dadosProcessados = linhas.map(linha => ({
          'Município': linha?.[0]?.trim() || '',
          'Total de Votos Esperado': parseInt(linha?.[2]?.trim() || '0', 10),
        }));

        setDadosApoio(dadosProcessados);
      } catch (e: any) {
        setErro(`Erro ao buscar dados: ${e.message}`);
      } finally {
        setCarregando(false);
      }
    };
    fetchData();
  }, []);

  // Agrupa e ordena os votos esperados por município
  const dadosAgrupadosOriginais = useMemo(() => {
    const votosPorMunicipio: { [municipio: string]: number } = {};
    dadosApoio.forEach(item => {
      const municipio = item['Município']?.trim();
      if (municipio) {
        votosPorMunicipio[municipio] = (votosPorMunicipio[municipio] || 0) + item['Total de Votos Esperado'];
      }
    });

    const resultados: VotoApoioPorCidade[] = Object.keys(votosPorMunicipio).map(municipio => ({
      municipio,
      totalVotosEsperados: votosPorMunicipio[municipio] || 0,
    }));

    // Mantém a ordenação original por votos para o ranking fixo
    return resultados.sort((a, b) => b.totalVotosEsperados - a.totalVotosEsperados);
  }, [dadosApoio]);

  // Filtra os dados com base na seleção, mas mantém a ordem original
  const dadosFiltradosOrdenados = useMemo(() => {
    let dados = [...dadosAgrupadosOriginais];

    // O filtro mantém a ordenação original
    if (municipioSelecionado !== 'Todos os Municípios') {
      dados = dados.filter(item => item.municipio === municipioSelecionado);
    }
    
    // A ordenação manual agora só é aplicada quando o filtro não está ativo
    if (municipioSelecionado === 'Todos os Municípios' && ordenacaoColuna === 'municipio') {
        dados.sort((a, b) => ordenacaoDirecao === 'asc' ? a.municipio.localeCompare(b.municipio, 'pt-BR') : b.municipio.localeCompare(a.municipio, 'pt-BR'));
    }

    return dados;
  }, [dadosAgrupadosOriginais, municipioSelecionado, ordenacaoColuna, ordenacaoDirecao]);

  // Lógica de Paginação
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const resultadosPaginaAtual = dadosFiltradosOrdenados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(dadosFiltradosOrdenados.length / itensPorPagina);

  const irParaPagina = (page: number) => setPaginaAtual(page);
  const irParaProximaPagina = () => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  const irParaPaginaAnterior = () => setPaginaAtual(prev => Math.max(prev - 1, 1));

  const getPaginationNumbers = useCallback((currentPage: number, totalPages: number, siblingCount = 1) => {
    const totalPageNumbers = siblingCount * 2 + 3;
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
    let pages: (number | string)[] = [];
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    if (totalPages > 1) {
        pages.push(totalPages);
    }
    return pages.filter((page, index, array) => {
      if (page === '...' && (array?.[index - 1] === '...' || index === 0 || index === array.length - 1)) {
        return false;
      }
      return true;
    });
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
        Ranking de Votos Esperados por Cidade
      </h3>

      {/* Filtros e Ordenação */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="municipio-select" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar Município:
          </label>
          <div className="relative">
            <select
              id="municipio-select"
              className={carregando ? disabledSelectClasses : selectClasses}
              value={municipioSelecionado}
              onChange={(e) => {
                setMunicipioSelecionado(e.target.value);
                setPaginaAtual(1);
              }}
              disabled={carregando}
            >
              <option value="Todos os Municípios">Todos os Municípios</option>
              {useMemo(() => dadosAgrupadosOriginais.map(item => item.municipio).sort((a,b) => a.localeCompare(b)).map((municipio) => (
                <option key={municipio} value={municipio}>
                  {municipio}
                </option>
              )), [dadosAgrupadosOriginais])}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <label htmlFor="ordenacao-coluna" className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por:
          </label>
          <div className="relative">
            <select
              id="ordenacao-coluna"
              className={carregando ? disabledSelectClasses : selectClasses}
              value={ordenacaoColuna}
              onChange={(e) => {
                setOrdenacaoColuna(e.target.value as typeof ordenacaoColuna);
                setPaginaAtual(1);
              }}
              disabled={carregando}
            >
              <option value="totalVotosEsperados">Total de Votos</option>
              <option value="municipio">Município (Nome)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-end">
          <button
            onClick={() => {
              setOrdenacaoDirecao(ordenacaoDirecao === 'desc' ? 'asc' : 'desc');
              setPaginaAtual(1);
            }}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 h-[42px]"
            disabled={carregando || ordenacaoColuna === 'municipio'}
          >
            {ordenacaoDirecao === 'desc' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>
            )}
            {ordenacaoDirecao === 'desc' ? 'Decrescente' : 'Crescente'}
          </button>
        </div>
      </div>

      {/* Tabela de Resultados */}
      {carregando ? (
        <p className="text-center text-gray-500">Carregando dados...</p>
      ) : erro ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 w-full">
          {erro}
        </div>
      ) : dadosFiltradosOrdenados.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Município
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total de Votos Esperados
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultadosPaginaAtual.map((item, index) => {
                // CORRIGIDO: Agora a posição é encontrada no array de dados originais, ordenado por votos.
                const posicaoOriginal = dadosAgrupadosOriginais.findIndex(dado => dado.municipio === item.municipio) + 1;
                const isTop3 = posicaoOriginal <= 3 && municipioSelecionado === 'Todos os Municípios';

                return (
                  <tr key={item.municipio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {isTop3 && (
                          <span className="mr-2">
                            {posicaoOriginal === 1 ? '🥇' : posicaoOriginal === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                        {posicaoOriginal}º
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.municipio}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {typeof window !== 'undefined'
                        ? item.totalVotosEsperados.toLocaleString('pt-BR')
                        : item.totalVotosEsperados}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Nenhum resultado encontrado para os filtros aplicados.
        </div>
      )}

      {/* Paginação */}
      {dadosFiltradosOrdenados.length > 0 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
          aria-label="Pagination"
        >
          <div className="flex flex-1 justify-between sm:hidden">
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
                <span className="font-medium">{Math.min(indiceUltimoItem, dadosFiltradosOrdenados.length)}</span> de{' '}
                <span className="font-medium">{dadosFiltradosOrdenados.length}</span> resultados
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
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
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
                {getPaginationNumbers(paginaAtual, totalPaginas).map((pageNumber, idx) =>
                  pageNumber === '...' ? (
                    <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${pageNumber}`}
                      onClick={() => irParaPagina(Number(pageNumber))}
                      aria-current={Number(pageNumber) === paginaAtual ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        Number(pageNumber) === paginaAtual
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
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
      )}
    </div>
  );
};

export default RankingVotosCidades;