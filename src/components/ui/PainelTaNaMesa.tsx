'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import { UserGroupIcon, MapPinIcon, ChartBarIcon } from '@heroicons/react/24/solid';

interface DadoTaNaMesa {
    'MUNICÍPIO': string;
    'NOME': string;
    'CARGO': string;
    'INDICAÇÃO': string;
    'OBS': string;
}

export default function PainelTaNaMesa() {
    const [dados, setDados] = useState<DadoTaNaMesa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // ESTADOS PARA FILTRO E PAGINAÇÃO
    // Removido o estado municipioSelecionado
    const [termoPesquisaMunicipio, setTermoPesquisaMunicipio] = useState(''); // NOVO: Estado para a pesquisa por município
    const [termoPesquisaIndicacao, setTermoPesquisaIndicacao] = useState('');
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(10);
    const [ordenacaoColuna, setOrdenacaoColuna] = useState<'NOME' | 'MUNICÍPIO'>('NOME');
    const [ordenacaoDirecao, setOrdenacaoDirecao] = useState<'asc' | 'desc'>('asc');


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/sheets/eleicao/apoio_tanamesa');
                const json = await res.json();
                
                if (!json.success || !json.data) {
                    setErro('Falha ao carregar os dados da planilha "Tá na Mesa".');
                    return;
                }

                const linhas: string[][] = json.data?.slice(1) || [];
                const dadosProcessados: DadoTaNaMesa[] = linhas.map(linha => ({
                    'MUNICÍPIO': linha[0]?.trim() || 'ainda não informado',
                    'NOME': linha[1]?.trim() || 'ainda não informado',
                    'CARGO': linha[2]?.trim() || 'ainda não informado',
                    'INDICAÇÃO': linha[3]?.trim() || 'ainda não informado',
                    'OBS': linha[4]?.trim() || 'ainda não informado',
                }));
                
                setDados(dadosProcessados);
                
            } catch (e: any) {
                setErro(`Erro ao buscar dados: ${e.message}`);
            } finally {
                setCarregando(false);
            }
        };
        fetchData();
    }, []);

    const dadosResumo = useMemo(() => {
      const totalRegistros = dados.length;
      const totalMunicipios = new Set(dados.map(d => d.MUNICÍPIO)).size;
      const totalCargos = new Set(dados.map(d => d.CARGO)).size;
      return {
          totalRegistros,
          totalMunicipios,
          totalCargos,
      };
    }, [dados]);

    const cardData = [
        {
            label: 'Total de Registros',
            value: dadosResumo.totalRegistros,
            icon: UserGroupIcon,
            bgColorClass: 'bg-blue-100',
            iconColorClass: 'text-blue-600',
            valueColorClass: 'text-blue-600'
        },
        {
            label: 'Municípios com Pessoas',
            value: dadosResumo.totalMunicipios,
            icon: MapPinIcon,
            bgColorClass: 'bg-purple-100',
            iconColorClass: 'text-purple-600',
            valueColorClass: 'text-purple-600'
        },
        {
            label: 'Total de Cargos',
            value: dadosResumo.totalCargos,
            icon: ChartBarIcon,
            bgColorClass: 'bg-pink-100',
            iconColorClass: 'text-pink-600',
            valueColorClass: 'text-pink-600'
        }
    ];
    
    const dadosFiltradosOrdenados = useMemo(() => {
        let dadosFiltrados = [...dados];
    
        // NOVO: Filtragem pela barra de pesquisa de município
        if (termoPesquisaMunicipio) {
            const termo = termoPesquisaMunicipio.toLowerCase();
            dadosFiltrados = dadosFiltrados.filter(dado => dado.MUNICÍPIO.toLowerCase().includes(termo));
        }

        // Manter a filtragem pela barra de pesquisa de indicação
        if (termoPesquisaIndicacao) {
            const termo = termoPesquisaIndicacao.toLowerCase();
            dadosFiltrados = dadosFiltrados.filter(dado => dado.INDICAÇÃO.toLowerCase().includes(termo));
        }
    
        return dadosFiltrados.sort((a, b) => {
            const aValue = a[ordenacaoColuna];
            const bValue = b[ordenacaoColuna];
    
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return ordenacaoDirecao === 'asc' ? aValue.localeCompare(bValue, 'pt-BR') : bValue.localeCompare(aValue, 'pt-BR');
            }
            return 0;
        });
    }, [dados, termoPesquisaMunicipio, termoPesquisaIndicacao, ordenacaoColuna, ordenacaoDirecao]);
    
    const totalPaginas = Math.ceil(dadosFiltradosOrdenados.length / itensPorPagina);
    const indiceUltimoItem = paginaAtual * itensPorPagina;
    const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
    const dadosPaginados = useMemo(() => {
        return dadosFiltradosOrdenados.slice(indicePrimeiroItem, indiceUltimoItem);
    }, [dadosFiltradosOrdenados, indicePrimeiroItem, indiceUltimoItem]);

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
        if (page === '...' && (array[index - 1] === '...' || index === 0 || index === array.length - 1)) {
          return false;
        }
        return true;
      });
    }, []);

    const inputClasses = `
        appearance-none block w-full bg-white border border-gray-300 rounded-full
        py-2.5 px-5 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        shadow-sm transition duration-150 ease-in-out
    `;

    const disabledInputClasses = `
        ${inputClasses}
        bg-gray-100 text-gray-500 cursor-not-allowed
    `;

    const handleSort = (coluna: 'NOME' | 'MUNICÍPIO') => {
        if (ordenacaoColuna === coluna) {
            setOrdenacaoDirecao(ordenacaoDirecao === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenacaoColuna(coluna);
            setOrdenacaoDirecao('asc');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Visão Geral - Tá na Mesa</h2>
            {carregando ? (
                <p className="text-center text-gray-500">Carregando dados...</p>
            ) : erro ? (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 w-full">
                    {erro}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cardData.map((card, index) => {
                            const IconComponent = card.icon;
                            return (
                                <div
                                    key={index}
                                    className={`
                                        ${card.bgColorClass} p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center 
                                        transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg
                                    `}
                                >
                                    <div className={`p-2 rounded-full mb-2 ${card.iconColorClass} bg-opacity-20`}>
                                        <IconComponent className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mt-1">{card.label}</p>
                                    <p className={`mt-1 text-2xl font-bold ${card.valueColorClass}`}>{card.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* NOVO: Barra de pesquisa para Município */}
                            <div className="flex-1">
                                <label htmlFor="search-municipio-input" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pesquisar por Município:
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="search-municipio-input"
                                        className={carregando ? disabledInputClasses : inputClasses}
                                        placeholder="Digite o nome do município..."
                                        value={termoPesquisaMunicipio}
                                        onChange={(e) => {
                                            setTermoPesquisaMunicipio(e.target.value);
                                            setPaginaAtual(1);
                                        }}
                                        disabled={carregando}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.148l.278.279.133.133a.5.5 0 01.708.708l3.182 3.182a.5.5 0 01-.708.708l-3.182-3.182a.5.5 0 01-.708-.708l-.133-.133-.279-.278A7 7 0 012 9z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Barra de pesquisa para Indicação */}
                            <div className="flex-1">
                                <label htmlFor="search-indicacao-input" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pesquisar por Indicação:
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="search-indicacao-input"
                                        className={carregando ? disabledInputClasses : inputClasses}
                                        placeholder="Digite para pesquisar..."
                                        value={termoPesquisaIndicacao}
                                        onChange={(e) => {
                                            setTermoPesquisaIndicacao(e.target.value);
                                            setPaginaAtual(1);
                                        }}
                                        disabled={carregando}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.148l.278.279.133.133a.5.5 0 01.708.708l3.182 3.182a.5.5 0 01-.708.708l-3.182-3.182a.5.5 0 01-.708-.708l-.133-.133-.279-.278A7 7 0 012 9z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-shrink-0 flex items-end">
                                <button
                                    onClick={() => handleSort(ordenacaoColuna)}
                                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 h-[42px]"
                                    disabled={carregando}
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

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th 
                                            scope="col" 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('NOME')}
                                        >
                                            Nome {ordenacaoColuna === 'NOME' && (ordenacaoDirecao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th 
                                            scope="col" 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('MUNICÍPIO')}
                                        >
                                            Município {ordenacaoColuna === 'MUNICÍPIO' && (ordenacaoDirecao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cargo
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Indicação
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Observação
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dadosPaginados.map((dado, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dado.NOME}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dado.MUNICÍPIO}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dado.CARGO}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dado.INDICAÇÃO}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dado.OBS}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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
                                            <label htmlFor="itens-por-pagina-apoiadores" className="sr-only">Itens por página</label>
                                            <select
                                                id="itens-por-pagina-apoiadores"
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
                </>
            )}
        </div>
    );
}