// src/components/ui/FiltrosDemograficos.tsx
import React, { Dispatch, SetStateAction } from 'react';

// Adicione aqui quaisquer interfaces adicionais se elas forem necessárias
// para os dados demográficos específicos (ex: EleitoradoAgregado, se usado diretamente aqui)

interface FiltrosDemograficosProps {
  generoSelecionado: string;
  setGeneroSelecionado: (value: string) => void;
  generosDisponiveis: string[];
  estadoCivilSelecionado: string;
  setEstadoCivilSelecionado: (value: string) => void;
  estadosCivisDisponiveis: string[];
  faixaEtariaSelecionada: string;
  setFaixaEtariaSelecionada: (value: string) => void;
  faixasEtariasDisponiveis: string[];
  escolaridadeSelecionada: string;
  setEscolaridadeSelecionada: (value: string) => void;
  escolaridadesDisponiveis: string[];
  racaCorSelecionada: string;
  setRacaCorSelecionada: (value: string) => void;
  racasCoresDisponiveis: string[];
  identidadeGeneroSelecionada: string;
  setIdentidadeGeneroSelecionada: (value: string) => void;
  identidadesGeneroDisponiveis: string[];
  incluirQuilombola: boolean;
  setIncluirQuilombola: (value: boolean) => void;
  incluirInterpreteLibras: boolean;
  setIncluirInterpreteLibras: (value: boolean) => void;
  incluirComBiometria: boolean;
  setIncluirComBiometria: (value: boolean) => void;
  incluirComDeficiencia: boolean;
  setIncluirComDeficiencia: (value: boolean) => void;
  incluirComNomeSocial: boolean;
  setIncluirComNomeSocial: (value: boolean) => void;
  abaAtiva: string; // CORRIGIDO: ADICIONADA A PROPRIEDADE 'abaAtiva'
  carregando: boolean;
}

const FiltrosDemograficos: React.FC<FiltrosDemograficosProps> = ({
  generoSelecionado,
  setGeneroSelecionado,
  generosDisponiveis,
  estadoCivilSelecionado,
  setEstadoCivilSelecionado,
  estadosCivisDisponiveis,
  faixaEtariaSelecionada,
  setFaixaEtariaSelecionada,
  faixasEtariasDisponiveis,
  escolaridadeSelecionada,
  setEscolaridadeSelecionada,
  escolaridadesDisponiveis,
  racaCorSelecionada,
  setRacaCorSelecionada,
  racasCoresDisponiveis,
  identidadeGeneroSelecionada,
  setIdentidadeGeneroSelecionada,
  identidadesGeneroDisponiveis,
  incluirQuilombola,
  setIncluirQuilombola,
  incluirInterpreteLibras,
  setIncluirInterpreteLibras,
  incluirComBiometria,
  setIncluirComBiometria,
  incluirComDeficiencia,
  setIncluirComDeficiencia,
  incluirComNomeSocial,
  setIncluirComNomeSocial,
  abaAtiva, // Desestruturada aqui
  carregando,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {abaAtiva === 'Gênero' && (
        <div>
          <label htmlFor="genero-select" className="block text-sm font-medium text-gray-700 mb-1">
            Gênero:
          </label>
          <div className="relative">
            <select
              id="genero-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={generoSelecionado}
              onChange={(e) => setGeneroSelecionado(e.target.value)}
              disabled={carregando}
            >
              <option value="Todos os Gêneros">Todos os Gêneros</option>
              {generosDisponiveis.map((genero) => (
                <option key={genero} value={genero}>
                  {genero}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'Estado Civil' && (
        <div>
          <label htmlFor="estado-civil-select" className="block text-sm font-medium text-gray-700 mb-1">
            Estado Civil:
          </label>
          <div className="relative">
            <select
              id="estado-civil-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={estadoCivilSelecionado}
              onChange={(e) => setEstadoCivilSelecionado(e.target.value)}
              disabled={carregando}
            >
              <option value="Todos os Estados Civis">Todos os Estados Civis</option>
              {estadosCivisDisponiveis.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'Faixa Etária' && (
        <div>
          <label htmlFor="faixa-etaria-select" className="block text-sm font-medium text-gray-700 mb-1">
            Faixa Etária:
          </label>
          <div className="relative">
            <select
              id="faixa-etaria-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={faixaEtariaSelecionada}
              onChange={(e) => setFaixaEtariaSelecionada(e.target.value)}
              disabled={carregando}
            >
              <option value="Todas as Faixas Etárias">Todas as Faixas Etárias</option>
              {faixasEtariasDisponiveis.map((faixa) => (
                <option key={faixa} value={faixa}>
                  {faixa}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'Escolaridade' && (
        <div>
          <label htmlFor="escolaridade-select" className="block text-sm font-medium text-gray-700 mb-1">
            Escolaridade:
          </label>
          <div className="relative">
            <select
              id="escolaridade-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={escolaridadeSelecionada}
              onChange={(e) => setEscolaridadeSelecionada(e.target.value)}
              disabled={carregando}
            >
              <option value="Todas as Escolaridades">Todas as Escolaridades</option>
              {escolaridadesDisponiveis.map((escolaridade) => (
                <option key={escolaridade} value={escolaridade}>
                  {escolaridade}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'Raça/Cor' && (
        <div>
          <label htmlFor="raca-cor-select" className="block text-sm font-medium text-gray-700 mb-1">
            Raça/Cor:
          </label>
          <div className="relative">
            <select
              id="raca-cor-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={racaCorSelecionada}
              onChange={(e) => setRacaCorSelecionada(e.target.value)}
              disabled={carregando}
            >
              <option value="Todas as Raças/Cores">Todas as Raças/Cores</option>
              {racasCoresDisponiveis.map((raca) => (
                <option key={raca} value={raca}>
                  {raca}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'Identidade de Gênero' && (
        <div>
          <label htmlFor="identidade-genero-select" className="block text-sm font-medium text-gray-700 mb-1">
            Identidade de Gênero:
          </label>
          <div className="relative">
            <select
              id="identidade-genero-select"
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={identidadeGeneroSelecionada}
              onChange={(e) => setIdentidadeGeneroSelecionada(e.target.value)}
              disabled={carregando}
            >
              <option value="Todas as Identidades de Gênero">Todas as Identidades de Gênero</option>
              {identidadesGeneroDisponiveis.map((identidade) => (
                <option key={identidade} value={identidade}>
                  {identidade}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Checkboxes de características especiais */}
      {(abaAtiva === 'Visão Geral' || abaAtiva === 'Quilombola') && (
        <div className="flex items-center mt-2">
          <input
            id="incluir-quilombola"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={incluirQuilombola}
            onChange={(e) => setIncluirQuilombola(e.target.checked)}
            disabled={carregando}
          />
          <label htmlFor="incluir-quilombola" className="ml-2 block text-sm text-gray-900">
            Incluir Eleitores Quilombolas
          </label>
        </div>
      )}

      {(abaAtiva === 'Visão Geral' || abaAtiva === 'Intérprete de Libras') && (
        <div className="flex items-center mt-2">
          <input
            id="incluir-interprete-libras"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={incluirInterpreteLibras}
            onChange={(e) => setIncluirInterpreteLibras(e.target.checked)}
            disabled={carregando}
          />
          <label htmlFor="incluir-interprete-libras" className="ml-2 block text-sm text-gray-900">
            Incluir Eleitores com Intérprete de Libras
          </label>
        </div>
      )}

      {(abaAtiva === 'Visão Geral' || abaAtiva === 'Biometria') && (
        <div className="flex items-center mt-2">
          <input
            id="incluir-biometria"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={incluirComBiometria}
            onChange={(e) => setIncluirComBiometria(e.target.checked)}
            disabled={carregando}
          />
          <label htmlFor="incluir-biometria" className="ml-2 block text-sm text-gray-900">
            Incluir Eleitores com Biometria
          </label>
        </div>
      )}

      {(abaAtiva === 'Visão Geral' || abaAtiva === 'Deficiência') && (
        <div className="flex items-center mt-2">
          <input
            id="incluir-deficiencia"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={incluirComDeficiencia}
            onChange={(e) => setIncluirComDeficiencia(e.target.checked)}
            disabled={carregando}
          />
          <label htmlFor="incluir-deficiencia" className="ml-2 block text-sm text-gray-900">
            Incluir Eleitores com Deficiência
          </label>
        </div>
      )}

      {(abaAtiva === 'Visão Geral' || abaAtiva === 'Nome Social') && (
        <div className="flex items-center mt-2">
          <input
            id="incluir-nome-social"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={incluirComNomeSocial}
            onChange={(e) => setIncluirComNomeSocial(e.target.checked)}
            disabled={carregando}
          />
          <label htmlFor="incluir-nome-social" className="ml-2 block text-sm text-gray-900">
            Incluir Eleitores com Nome Social
          </label>
        </div>
      )}
    </div>
  );
};

export default FiltrosDemograficos;