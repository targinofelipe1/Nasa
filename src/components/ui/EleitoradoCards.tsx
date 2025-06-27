// EleitoradoCards.tsx
'use client';

import React from 'react';
// Importe os ícones que você deseja usar.
import { FaUsers, FaFingerprint, FaWheelchair, FaIdCard, FaHandsHelping, FaMale, FaFemale, FaChild, FaUserTie, FaUserFriends, FaExclamationTriangle } from 'react-icons/fa'; // Adicionado FaExclamationTriangle
import { GiFamilyTree } from 'react-icons/gi';
import { BsChatSquareTextFill } from 'react-icons/bs';

interface EleitoradoCardsProps {
  abaAtiva: string;
  carregando: boolean;
  totalEleitores: number;
  totalBiometria: number;
  totalDeficiencia: number;
  totalNomeSocial: number;
  totalQuilombola: number;
  totalInterpreteLibras: number;

  totalMulheres: number;
  totalHomens: number;
  totalJovens: number;
  totalAdultos: number;
  totalIdosos: number;
  totalAnalfabetos: number; // Adicionado

  totalEleitoresGeral: number;
  totalBiometriaGeral: number;
  totalDeficienciaGeral: number;
  totalNomeSocialGeral: number;
  totalQuilombolaGeral: number;
  totalInterpreteLibrasGeral: number;

  totalMulheresGeral: number;
  totalHomensGeral: number;
  totalJovensGeral: number;
  totalAdultosGeral: number;
  totalIdososGeral: number;
  totalAnalfabetosGeral: number; // Adicionado

  filtrosAtivos: boolean;
}

const EleitoradoCards: React.FC<EleitoradoCardsProps> = ({
  abaAtiva,
  carregando,
  totalEleitores,
  totalBiometria,
  totalDeficiencia,
  totalNomeSocial,
  totalQuilombola,
  totalInterpreteLibras,
  totalMulheres,
  totalHomens,
  totalJovens,
  totalAdultos,
  totalIdosos,
  totalAnalfabetos, // Recebendo a quantidade filtrada

  totalEleitoresGeral,
  totalBiometriaGeral,
  totalDeficienciaGeral,
  totalNomeSocialGeral,
  totalQuilombolaGeral,
  totalInterpreteLibrasGeral,
  totalMulheresGeral,
  totalHomensGeral,
  totalJovensGeral,
  totalAdultosGeral,
  totalIdososGeral,
  totalAnalfabetosGeral, // Recebendo a quantidade geral

  filtrosAtivos,
}) => {
  if (carregando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center animate-pulse min-h-[120px] border border-gray-200"
          >
            <p className="text-lg font-semibold text-gray-400">Carregando...</p>
            <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');

  const getCardValue = (partialValue: number | undefined, generalValue: number | undefined): number => {
    return filtrosAtivos ? (partialValue || 0) : (generalValue || 0);
  };

  const cards = [
    { label: 'Total de Eleitores', valor: formatNumber(getCardValue(totalEleitores, totalEleitoresGeral)), Icone: FaUsers, color: '#2563EB' }, // Azul
    { label: 'Total de Mulheres', valor: formatNumber(getCardValue(totalMulheres, totalMulheresGeral)), Icone: FaFemale, color: '#E91E63' }, // Rosa
    { label: 'Total de Homens', valor: formatNumber(getCardValue(totalHomens, totalHomensGeral)), Icone: FaMale, color: '#007ACC' }, // Azul Escuro
    { label: 'Total de Jovens (16-24)', valor: formatNumber(getCardValue(totalJovens, totalJovensGeral)), Icone: FaChild, color: '#4CAF50' }, // Verde
    { label: 'Total de Adultos (25-59)', valor: formatNumber(getCardValue(totalAdultos, totalAdultosGeral)), Icone: FaUserFriends, color: '#FFC107' }, // Amarelo/Laranja (representa grupo de adultos)
    { label: 'Total de Idosos (60+)', valor: formatNumber(getCardValue(totalIdosos, totalIdososGeral)), Icone: FaUserTie, color: '#795548' }, // Marrom (representa experiência/idade)
    { label: 'Com Biometria', valor: formatNumber(getCardValue(totalBiometria, totalBiometriaGeral)), Icone: FaFingerprint, color: '#10B981' },
    { label: 'Com Deficiência', valor: formatNumber(getCardValue(totalDeficiencia, totalDeficienciaGeral)), Icone: FaWheelchair, color: '#8B5CF6' },
    { label: 'Com Nome Social', valor: formatNumber(getCardValue(totalNomeSocial, totalNomeSocialGeral)), Icone: FaIdCard, color: '#EF4444' },
    { label: 'Quilombolas', valor: formatNumber(getCardValue(totalQuilombola, totalQuilombolaGeral)), Icone: GiFamilyTree, color: '#DC2626' },
    { label: 'Necessitam Libras', valor: formatNumber(getCardValue(totalInterpreteLibras, totalInterpreteLibrasGeral)), Icone: BsChatSquareTextFill, color: '#F97316' },
    // NOVO CARD PARA COMPLETAR A FILEIRA
    { label: 'Total de Analfabetos', valor: formatNumber(getCardValue(totalAnalfabetos, totalAnalfabetosGeral)), Icone: FaExclamationTriangle, color: '#D32F2F' }, // Vermelho escuro
  ];

  return (
    <div className="mt-8 mb-4">
      {abaAtiva === 'Visão Geral' && (
        // Com 12 cards, xl:grid-cols-6 resultará em duas linhas de 6 cards cada.
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {cards.map(({ label, valor, Icone, color }) => (
            <div
              key={label}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center text-center min-h-[120px]"
            >
              <Icone size={32} color={color} />
              <p className="text-sm font-medium text-gray-500 mt-2">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{valor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EleitoradoCards;