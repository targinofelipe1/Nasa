// components/ui/ExibicaoMetricasComparativas.tsx
import React from 'react';
import CartaoMetrica from './CartaoMetrica';

interface DadosMetricasComuns { // Renomeado para evitar conflito e ser mais descritivo
  eleitoresAptos: number;
  totalComparecimentos: number;
  totalAbstencoes: number;
  taxaAbstencao: number; // Em porcentagem (ex: 20.5 para 20.5%)
  votosValidos: number;
  votosBrancos: number;
  votosNulos: number;
}

interface ExibicaoMetricasComparativasProps {
  dados2018: DadosMetricasComuns; // Tipo de dados corrigido
  dados2022: DadosMetricasComuns; // Tipo de dados corrigido
  isLoading: boolean;
  titulo2018?: string;
  titulo2022?: string;
}

const ExibicaoMetricasComparativas: React.FC<ExibicaoMetricasComparativasProps> = ({
  dados2018,
  dados2022,
  isLoading,
  titulo2018 = "Métricas Gerais (2018)",
  titulo2022 = "Métricas Gerais (2022)",
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
        <CartaoMetrica title="Carregando..." value="" isLoading={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{titulo2018}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CartaoMetrica
            title="Eleitores Aptos"
            value={dados2018.eleitoresAptos}
            description="Total de eleitores aptos a votar."
          />
          <CartaoMetrica
            title="Comparecimentos"
            value={dados2018.totalComparecimentos}
            description="Eleitores que compareceram à votação."
            colorClass="text-green-700"
          />
          <CartaoMetrica
            title="Abstenções"
            value={dados2018.totalAbstencoes}
            description="Eleitores que não compareceram."
            colorClass="text-red-700"
          />
          <CartaoMetrica
            title="Taxa de Abstenção"
            value={dados2018.taxaAbstencao.toFixed(2)}
            unit="%"
            description="Percentual de eleitores ausentes."
            colorClass="text-red-700"
          />
          <CartaoMetrica
            title="Votos Válidos"
            value={dados2018.votosValidos}
            description="Soma de votos nominais e de legenda válidos."
            colorClass="text-blue-700"
          />
          <CartaoMetrica
            title="Votos Brancos"
            value={dados2018.votosBrancos}
            description="Votos em branco."
            colorClass="text-gray-700"
          />
          <CartaoMetrica
            title="Votos Nulos"
            value={dados2018.votosNulos}
            description="Votos considerados nulos."
            colorClass="text-gray-700"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{titulo2022}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CartaoMetrica
            title="Eleitores Aptos"
            value={dados2022.eleitoresAptos}
            description="Total de eleitores aptos a votar."
          />
          <CartaoMetrica
            title="Comparecimentos"
            value={dados2022.totalComparecimentos}
            description="Eleitores que compareceram à votação."
            colorClass="text-green-700"
          />
          <CartaoMetrica
            title="Abstenções"
            value={dados2022.totalAbstencoes}
            description="Eleitores que não compareceram."
            colorClass="text-red-700"
          />
          <CartaoMetrica
            title="Taxa de Abstenção"
            value={dados2022.taxaAbstencao.toFixed(2)}
            unit="%"
            description="Percentual de eleitores ausentes."
            colorClass="text-red-700"
          />
          <CartaoMetrica
            title="Votos Válidos"
            value={dados2022.votosValidos}
            description="Soma de votos nominais e de legenda válidos."
            colorClass="text-blue-700"
          />
          <CartaoMetrica
            title="Votos Brancos"
            value={dados2022.votosBrancos}
            description="Votos em branco."
            colorClass="text-gray-700"
          />
          <CartaoMetrica
            title="Votos Nulos"
            value={dados2022.votosNulos}
            description="Votos considerados nulos."
            colorClass="text-gray-700"
          />
        </div>
      </div>
    </div>
  );
};

export default ExibicaoMetricasComparativas;