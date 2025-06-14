// components/VotacaoCards.tsx

import React from 'react';
import CardPrograma from '@/components/ui/CardProgramaProps';
import { FaUsers, FaMapMarkedAlt, FaChartPie, FaUniversity, FaVoteYea } from 'react-icons/fa';
import { BsPeopleFill } from 'react-icons/bs';
import { MdLocationOn } from 'react-icons/md';
import { IoIosListBox } from "react-icons/io";

interface Props {
  tipo: 'geral' | 'votos' | 'filtrado'; // 'filtrado' agora significa mostrar apenas os primeiros 4 cards
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
    // Para 'filtrado', teremos apenas 4 cards de eleitores/comparecimento/abstenção
    const numCardsLoading = tipo === 'geral' ? 6 : (tipo === 'filtrado' ? 4 : 3);
    return (
      <div className={`grid ${tipo === 'filtrado' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'} gap-6 bg-white rounded-xl`}>
        {[...Array(numCardsLoading)].map((_, idx) => (
          <div key={idx} className="bg-gray-100 rounded-xl p-6 text-center shadow">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ))}
      </div>
    );
  }

  // Define a classe do grid baseada no tipo
  let gridLayoutClass = "grid grid-cols-1 gap-6"; // Default para mobile
  if (tipo === 'geral') {
    gridLayoutClass += " md:grid-cols-3"; // Layout original para 'geral' (6 cards)
  } else if (tipo === 'filtrado') {
    // Para 'filtrado', queremos todos os 4 cards em uma única linha se possível
    gridLayoutClass += " sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4"; // 4 colunas para caber em uma linha
  } else if (tipo === 'votos') {
    // Para 'votos' (sem filtros ativos na aba de cargo), mantemos os 3 cards
    gridLayoutClass += " md:grid-cols-3"; 
  }

  return (
    <div className={`${gridLayoutClass} bg-white rounded-xl`}>
      {/* Cards para o tipo 'geral' */}
      {tipo === 'geral' && (
        <>
          <CardPrograma
            value={eleitoresAptos}
            label="Total de Eleitores Aptos"
            icon={<BsPeopleFill />}
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
            icon={<MdLocationOn />}
            bgColor="bg-green-100"
            iconBg="bg-green-500"
          />
          <CardPrograma
            value={totalSecoes}
            label="Seções Eleitorais"
            icon={<IoIosListBox />}
            bgColor="bg-indigo-100"
            iconBg="bg-indigo-500"
          />
        </>
      )}

      {/* Cards para o tipo 'votos' (3 cards de votos, sem comparecimentos e sem filtros ativos) */}
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

      {/* Cards para o tipo 'filtrado' (Eleitores aptos, Comparecimentos, Abstenções, Taxa de Abstenção) */}
      {tipo === 'filtrado' && (
        <>
          <CardPrograma
            value={eleitoresAptos}
            label="Eleitores Aptos"
            icon={<BsPeopleFill />}
            bgColor="bg-pink-100"
            iconBg="bg-pink-500"
          />
          <CardPrograma
            value={totalComparecimentos}
            label="Comparecimentos"
            icon={<FaUsers />}
            bgColor="bg-blue-100"
            iconBg="bg-blue-500"
          />
          <CardPrograma
            value={totalAbstencoes}
            label="Abstenções"
            icon={<FaUsers />}
            bgColor="bg-red-100"
            iconBg="bg-red-500"
          />
          <CardPrograma
            value={`${taxaAbstencao.toFixed(2)}%`}
            label="Taxa Abstenção"
            icon={<FaChartPie />}
            bgColor="bg-yellow-100"
            iconBg="bg-yellow-500"
          />
        </>
      )}
    </div>
  );
}