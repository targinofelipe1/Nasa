import React from 'react';

interface FiltrosEleitoradoProps {
  municipioSelecionado: string;
  setMunicipioSelecionado: (value: string) => void;
  municipiosDisponiveis: string[];

  zonaSelecionada: string;
  setZonaSelecionada: (value: string) => void;
  zonasDisponiveis: string[];

  localSelecionado: string;
  setLocalSelecionado: (value: string) => void;
  locaisDisponiveis: string[];

  secaoSelecionada: string;
  setSecaoSelecionada: (value: string) => void;
  secoesDisponiveis: string[];

  carregando: boolean;
}

const FiltrosEleitorado: React.FC<FiltrosEleitoradoProps> = ({
  municipioSelecionado,
  setMunicipioSelecionado,
  municipiosDisponiveis,
  zonaSelecionada,
  setZonaSelecionada,
  zonasDisponiveis,
  localSelecionado,
  setLocalSelecionado,
  locaisDisponiveis,
  secaoSelecionada,
  setSecaoSelecionada,
  secoesDisponiveis,
  carregando,
}) => {
  const formatFilterValue = (value: string): string => {
    return value.trim().toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Município */}
      <div>
        <label htmlFor="municipio-select" className="block text-sm font-medium text-gray-700 mb-1">
          Município:
        </label>
        <div className="relative">
          <select
            id="municipio-select"
            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={municipioSelecionado}
            onChange={(e) => {
              const valorPadronizado = formatFilterValue(e.target.value);
              setMunicipioSelecionado(valorPadronizado);
              setZonaSelecionada('TODAS AS ZONAS');
              setLocalSelecionado('TODOS OS LOCAIS');
              setSecaoSelecionada('TODAS AS SEÇÕES');
            }}
            disabled={carregando}
          >
            <option value="TODOS OS MUNICÍPIOS">Todos os Municípios</option>
            {municipiosDisponiveis.map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zona Eleitoral */}
      <div>
        <label htmlFor="zona-select" className="block text-sm font-medium text-gray-700 mb-1">
          Zona Eleitoral:
        </label>
        <div className="relative">
          <select
            id="zona-select"
            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={zonaSelecionada}
            onChange={(e) => {
              const valorPadronizado = formatFilterValue(e.target.value);
              setZonaSelecionada(valorPadronizado);
              setLocalSelecionado('TODOS OS LOCAIS');
              setSecaoSelecionada('TODAS AS SEÇÕES');
            }}
            // Habilita se não estiver carregando E se um município específico foi selecionado
            disabled={carregando || municipioSelecionado === 'TODOS OS MUNICÍPIOS'}
          >
            <option value="TODAS AS ZONAS">Todas as Zonas</option>
            {zonasDisponiveis.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Local de Votação */}
      <div>
        <label htmlFor="local-select" className="block text-sm font-medium text-gray-700 mb-1">
          Local de Votação:
        </label>
        <div className="relative">
          <select
            id="local-select"
            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localSelecionado}
            onChange={(e) => {
              const valorPadronizado = formatFilterValue(e.target.value);
              setLocalSelecionado(valorPadronizado);
              setSecaoSelecionada('TODAS AS SEÇÕES');
            }}
            // Habilita se não estiver carregando E se uma zona específica (ou município) foi selecionada
            disabled={carregando || zonaSelecionada === 'TODAS AS ZONAS'}
          >
            <option value="TODOS OS LOCAIS">Todos os Locais</option>
            {locaisDisponiveis.map((local) => (
              <option key={local} value={local}>
                {local}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção Eleitoral */}
      <div>
        <label htmlFor="secao-select" className="block text-sm font-medium text-gray-700 mb-1">
          Seção Eleitoral:
        </label>
        <div className="relative">
          <select
            id="secao-select"
            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={secaoSelecionada}
            onChange={(e) => {
              const valorPadronizado = formatFilterValue(e.target.value);
              setSecaoSelecionada(valorPadronizado);
            }}
            // Habilita se não estiver carregando E se um local (ou zona/município) foi selecionado
            disabled={carregando || localSelecionado === 'TODOS OS LOCAIS'}
          >
            <option value="TODAS AS SEÇÕES">Todas as Seções</option>
            {secoesDisponiveis.map((secao) => (
              <option key={secao} value={secao}>
                {secao}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosEleitorado;