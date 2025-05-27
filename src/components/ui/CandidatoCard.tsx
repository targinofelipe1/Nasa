// Caminho: src/components/ui/CandidatoCard.tsx
import React from 'react';

const CORES_POR_PARTIDO_HEX: Record<string, string> = {
  '#NULO#': '#7D7D7D',
  AGIR: '#D7263D',
  CIDADANIA: '#1E90FF',
  DC: '#A020F0',
  MDB: '#FFA500',
  'PC DO B': '#E60000',
  PDT: '#00CED1',
  PL: '#0033A0',
  PMB: '#FF69B4',
  PP: '#228B22',
  PROS: '#FF8C00',
  PRTB: '#8A2BE2',
  PSB: '#FFD700',
  PSD: '#8B0000',
  PSDB: '#4169E1',
  PSOL: '#FFFF00',
  PT: '#B22222',
  PTB: '#2F4F4F',
  PV: '#006400',
  REDE: '#20B2AA',
  REPUBLICANOS: '#4682B4',
  SOLIDARIEDADE: '#FF4500',
  UNIAO: '#00BFFF',
  PSL: '#0057B7',
  PODE: '#006E2E',
  PR: '#015AAA',
  PRB: '#115E80',
  DEM: '#8CC63E',
  PSC: '#006F41',
  PPS: '#EC008C',
  AVANTE: '#2EACB2',
  INDEFINIDO: '#A9A9A9',
};

const COR_PADRAO_ICONE_HEX = '#6B7280';

interface CandidatoCardProps {
  nome: string;
  votos: number;
  siglaPartido: string;
}

const normalizarPartidoParaCard = (partido: string): string => {
  if (!partido) return '#NULO#';
  const p = partido.trim().toUpperCase();

  if (
    p === 'NULO' ||
    p === '#NULO#' ||
    p === 'INDEFINIDO' ||
    p === '-' ||
    p === 'BRANCO'
  )
    return '#NULO#';

  if (p.includes('UNIÃO')) return 'UNIAO';
  if (p === 'PODEMOS') return 'PODE';

  return p;
};

const CandidatoCard: React.FC<CandidatoCardProps> = ({ nome, votos, siglaPartido }) => {
  const normalizedSigla = normalizarPartidoParaCard(siglaPartido);
  const backgroundColor = CORES_POR_PARTIDO_HEX[normalizedSigla] || COR_PADRAO_ICONE_HEX;

  return (
    <div className="bg-white p-3 shadow-md rounded-lg border border-gray-200 flex flex-col items-center text-center w-full hover:shadow-lg transition-shadow duration-150 ease-in-out min-h-[130px]">
      <div
        className="text-white rounded-full p-2 mb-2 inline-flex items-center justify-center w-10 h-10 flex-shrink-0"
        style={{ backgroundColor }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <p className="font-bold text-gray-800 text-sm leading-tight truncate w-full" title={nome}>
        {nome}
      </p>
      <p className="text-gray-600 text-xs">
        {votos.toLocaleString('pt-BR')} votos
      </p>
    </div>
  );
};

export default CandidatoCard;
