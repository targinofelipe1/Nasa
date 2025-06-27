import React, { useState, useMemo } from 'react';

interface ComparativoCandidatoData {
  municipio: string;
  zona: string;
  secao: string;
  totalVotos2018: number;
  totalVotos2022: number;
  porcentagem2018: number;
  porcentagem2022: number;
  variacaoVotos: number; // Votos 2022 - Votos 2018
  variacaoPorcentagem: number; // Porcentagem 2022 - Porcentagem 2018
  localNome: string;
  localEndereco: string;
  localBairro: string;
}

interface ComparativoMunicipioAgregado {
  municipio: string;
  totalVotos2018: number;
  totalVotos2022: number;
  porcentagem2018: number;
  porcentagem2022: number;
  variacaoVotos: number;
  variacaoPorcentagem: number;
  secoes: ComparativoCandidatoData[];
}

interface TabelaComparativoCandidatosProps {
  data: ComparativoCandidatoData[];
  nomeCandidato1: string; // Propriedade corrigida
  nomeCandidato2: string; // Propriedade corrigida
  isLoading: boolean;
  paginaAtual: number;
  totalPaginas: number;
  irParaProximaPagina: () => void;
  irParaPaginaAnterior: () => void;
  itensPorPagina: number;
  setItensPorPagina: (value: number) => void;
  setPaginaAtual: (value: number) => void; // Adicionado para controle de paginação
}

const TabelaComparativoCandidatos: React.FC<TabelaComparativoCandidatosProps> = ({
  data,
  nomeCandidato1, // Desestruturação corrigida
  nomeCandidato2, // Desestruturação corrigida
  isLoading,
  paginaAtual,
  totalPaginas,
  irParaProximaPagina,
  irParaPaginaAnterior,
  itensPorPagina,
  setItensPorPagina,
  setPaginaAtual, // Adicionado
}) => {
  const [municipioExpandido, setMunicipioExpandido] = useState<string | null>(null);

  const aggregatedData = useMemo(() => {
    const map = new Map<string, ComparativoMunicipioAgregado>();

    data.forEach(item => {
      if (!map.has(item.municipio)) {
        map.set(item.municipio, {
          municipio: item.municipio,
          totalVotos2018: 0,
          totalVotos2022: 0,
          porcentagem2018: 0,
          porcentagem2022: 0,
          variacaoVotos: 0,
          variacaoPorcentagem: 0,
          secoes: [],
        });
      }
      const municipioData = map.get(item.municipio)!;
      municipioData.totalVotos2018 += item.totalVotos2018;
      municipioData.totalVotos2022 += item.totalVotos2022;
      municipioData.secoes.push(item);
    });

    const result = Array.from(map.values()).map(municipioData => {
      const avgPorcentagem2018 = municipioData.secoes.reduce((sum, s) => sum + s.porcentagem2018, 0) / municipioData.secoes.length;
      const avgPorcentagem2022 = municipioData.secoes.reduce((sum, s) => sum + s.porcentagem2022, 0) / municipioData.secoes.length;

      return {
        ...municipioData,
        porcentagem2018: avgPorcentagem2018,
        porcentagem2022: avgPorcentagem2022,
        variacaoVotos: municipioData.totalVotos2022 - municipioData.totalVotos2018,
        variacaoPorcentagem: avgPorcentagem2022 - avgPorcentagem2018,
      };
    }).sort((a, b) => a.municipio.localeCompare(b.municipio));
    return result;
  }, [data]);

  const toggleMunicipio = (municipio: string) => {
    setMunicipioExpandido(municipioExpandido === municipio ? null : municipio);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-blue-900">Carregando comparativo...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
        Nenhum dado encontrado para o comparativo com os candidatos e filtros selecionados.
      </div>
    );
  }

  const totalMunicipios = aggregatedData.length;
  const indiceUltimoMunicipio = paginaAtual * itensPorPagina;
  const indicePrimeiroMunicipio = indiceUltimoMunicipio - itensPorPagina;
  const municipiosPaginaAtual = aggregatedData.slice(indicePrimeiroMunicipio, indiceUltimoMunicipio);

  return (
    <div className="mt-8 bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Comparativo de Votos: {nomeCandidato1} vs. {nomeCandidato2} (Por Município)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Município
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Votos {nomeCandidato1}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % (2018)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Votos {nomeCandidato2}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % (2022)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variação Votos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variação %
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {municipiosPaginaAtual.map((municipioItem, index) => (
              <React.Fragment key={municipioItem.municipio}>
                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {municipioItem.municipio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{municipioItem.totalVotos2018.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{municipioItem.porcentagem2018.toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{municipioItem.totalVotos2022.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{municipioItem.porcentagem2022.toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: municipioItem.variacaoVotos > 0 ? 'green' : municipioItem.variacaoVotos < 0 ? 'red' : 'inherit' }}>
                    {municipioItem.variacaoVotos.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ color: municipioItem.variacaoPorcentagem > 0 ? 'green' : municipioItem.variacaoPorcentagem < 0 ? 'red' : 'inherit' }}>
                    {municipioItem.variacaoPorcentagem.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => toggleMunicipio(municipioItem.municipio)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {municipioExpandido === municipioItem.municipio ? 'Esconder' : 'Ver'} Seções
                    </button>
                  </td>
                </tr>
                {municipioExpandido === municipioItem.municipio && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <div className="bg-gray-100 p-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Detalhes por Seção em {municipioItem.municipio}</h4>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Zona</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Seção</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Local de Votação</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Votos {nomeCandidato1} (2018)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">% (2018)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Votos {nomeCandidato2} (2022)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">% (2022)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Variação Votos</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Variação %</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {municipioItem.secoes.map((secaoItem, secaoIndex) => (
                              <tr key={`${secaoItem.municipio}-${secaoItem.zona}-${secaoItem.secao}`} className={secaoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.zona}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.secao}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.localNome} ({secaoItem.localEndereco})</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.totalVotos2018.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.porcentagem2018.toFixed(2)}%</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.totalVotos2022.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{secaoItem.porcentagem2022.toFixed(2)}%</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700" style={{ color: secaoItem.variacaoVotos > 0 ? 'green' : secaoItem.variacaoVotos < 0 ? 'red' : 'inherit' }}>
                                  {secaoItem.variacaoVotos.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700" style={{ color: secaoItem.variacaoPorcentagem > 0 ? 'green' : secaoItem.variacaoPorcentagem < 0 ? 'red' : 'inherit' }}>
                                  {secaoItem.variacaoPorcentagem.toFixed(2)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalMunicipios > 0 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
          aria-label="Paginação"
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
                Mostrando <span className="font-medium">{indicePrimeiroMunicipio + 1}</span> a{' '}
                <span className="font-medium">{Math.min(indiceUltimoMunicipio, totalMunicipios)}</span> de{' '}
                <span className="font-medium">{totalMunicipios}</span> municípios
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <label htmlFor="itens-por-pagina-comparativo" className="sr-only">Itens por página</label>
                <select
                  id="itens-por-pagina-comparativo"
                  className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                  value={itensPorPagina}
                  onChange={(e) => {
                    setItensPorPagina(Number(e.target.value));
                    // setPaginaAtual(1); // Descomente se quiser resetar a página ao mudar itens por página
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

              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginação">
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
                    onClick={() => setPaginaAtual(pagina)} // CORREÇÃO: Chamando setPaginaAtual
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
      )}
    </div>
  );
};

export default TabelaComparativoCandidatos;