// VotacaoCards.tsx
import CardPrograma from '@/components/ui/CardProgramaProps';
import { FaUsers, FaMapMarkedAlt, FaChartPie, FaUniversity, FaVoteYea } from 'react-icons/fa';

interface Props {
  tipo: 'geral' | 'votos';
  eleitoresAptos?: number;
  totalComparecimentos?: number;
  totalAbstencoes?: number;
  taxaAbstencao?: number;
  totalLocais?: number;
  totalSecoes?: number;
  votosValidos?: number;
  votosBrancos?: number;
  votosNulos?: number;
  carregando?: boolean;
}

export default function VotacaoCards({
  tipo,
  eleitoresAptos = 0,
  totalComparecimentos = 0,
  totalAbstencoes = 0,
  taxaAbstencao = 0,
  totalLocais = 0,
  totalSecoes = 0,
  votosValidos = 0,
  votosBrancos = 0,
  votosNulos = 0,
  carregando = false,
}: Props) {
  if (carregando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl">
        {[...Array(tipo === 'geral' ? 6 : 3)].map((_, idx) => (
          <div key={idx} className="bg-gray-100 rounded-xl p-6 text-center shadow">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl">
      {tipo === 'geral' && (
        <>
          <CardPrograma
            value={eleitoresAptos}
            label="Total de Eleitores Aptos"
            icon={<FaUsers />}
            bgColor="bg-pink-100"
            iconBg="bg-pink-500"
          />
          <CardPrograma
            value={totalComparecimentos}
            label="Total de Comparecimentos"
            icon={<FaUsers />}
            bgColor="bg-blue-100"
            iconBg="bg-blue-500"
          />
          <CardPrograma
            value={totalAbstencoes}
            label="Total de Abstenções"
            icon={<FaUsers />}
            bgColor="bg-red-100"
            iconBg="bg-red-500"
          />
          <CardPrograma
            value={`${taxaAbstencao.toFixed(2)}%`}
            label="Taxa de Abstenção"
            icon={<FaChartPie />}
            bgColor="bg-yellow-100"
            iconBg="bg-yellow-500"
          />
          <CardPrograma
            value={totalLocais}
            label="Locais de Votação"
            icon={<FaMapMarkedAlt />}
            bgColor="bg-green-100"
            iconBg="bg-green-500"
          />
          <CardPrograma
            value={totalSecoes}
            label="Seções Eleitorais"
            icon={<FaUniversity />}
            bgColor="bg-indigo-100"
            iconBg="bg-indigo-500"
          />
        </>
      )}

      {tipo === 'votos' && (
        <>
          <CardPrograma
            value={votosValidos}
            label="Votos Válidos"
            icon={<FaVoteYea />}
            bgColor="bg-green-100"
            iconBg="bg-green-600"
          />
          <CardPrograma
            value={votosBrancos}
            label="Votos Brancos"
            icon={<FaVoteYea />}
            bgColor="bg-gray-100"
            iconBg="bg-gray-600"
          />
          <CardPrograma
            value={votosNulos}
            label="Votos Nulos"
            icon={<FaVoteYea />}
            bgColor="bg-yellow-100"
            iconBg="bg-yellow-600"
          />
        </>
      )}
    </div>
  );
}
