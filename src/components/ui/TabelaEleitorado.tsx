// src/components/ui/TabelaEleitorado.tsx

import React, { Dispatch, SetStateAction } from 'react';


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
  'Nome do Local'?: string; 
  'Endereço do Local'?: string;
  'Bairro do Local'?: string;
}


interface LocalVotacaoDetalhado {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Endereço do Local': string;
  'Bairro do Local': string;
  'Nome do Local': string;
}


interface TabelaEleitoradoProps {
  dados: EleitoradoAgregado[];
  abaAtiva: string;
  paginaAtual: number;
  setPaginaAtual: Dispatch<SetStateAction<number>>;
  itensPorPagina: number;
  setItensPorPagina: Dispatch<SetStateAction<number>>;
  carregando: boolean;
  locaisDetalhes: LocalVotacaoDetalhado[]; // <<<< ADICIONE ESTA LINHA >>>>
}

const TabelaEleitorado: React.FC<TabelaEleitoradoProps> = ({
  dados,
  abaAtiva,
  paginaAtual,
  setPaginaAtual,
  itensPorPagina,
  setItensPorPagina,
  carregando,
  locaisDetalhes, 
}) => {
 

  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const dadosPaginaAtual = dados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  const irParaProximaPagina = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  };

  const irParaPaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
  };

  if (carregando) {
    return (
      <div className="mt-8 bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: itensPorPagina }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhes do Eleitorado (Tabela)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Município</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seção</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
              {abaAtiva === 'Visão Geral' && (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Eleitores</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Biometria</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Deficiência</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Nome Social</th>
                </>
              )}
              {abaAtiva === 'Gênero' && (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gênero</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Eleitores</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dadosPaginaAtual.map((item, index) => (
              <tr key={`${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}-${item['Local de Votação']}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item['Município']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Zona Eleitoral']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Seção Eleitoral']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Local de Votação']}</td>
                {abaAtiva === 'Visão Geral' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Qtd. Eleitores'].toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Qtd. com Biometria'].toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Qtd. com Deficiência'].toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Qtd. com Nome Social'].toLocaleString('pt-BR')}</td>
                  </>
                )}
                {abaAtiva === 'Gênero' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Gênero']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Qtd. Eleitores'].toLocaleString('pt-BR')}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
        aria-label="Pagination"
      >
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={irParaPaginaAnterior}
            disabled={paginaAtual === 1 || carregando}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            onClick={irParaProximaPagina}
            disabled={paginaAtual === totalPaginas || carregando}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Próximo
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{indicePrimeiroItem + 1}</span> a{' '}
              <span className="font-medium">{Math.min(indiceUltimoItem, dados.length)}</span> de{' '}
              <span className="font-medium">{dados.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <label htmlFor="itens-por-pagina" className="sr-only">Itens por página</label>
              <select
                id="itens-por-pagina"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                value={itensPorPagina}
                onChange={(e) => {
                  setItensPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
                disabled={carregando}
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
                disabled={paginaAtual === 1 || carregando}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setPaginaAtual(page)}
                  aria-current={page === paginaAtual ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === paginaAtual
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                  disabled={carregando}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas || carregando}
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

export default TabelaEleitorado;