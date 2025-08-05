'use client';

import { FaRegSquare, FaCheckSquare } from 'react-icons/fa';

interface TermometroVotosProps {
  votosAtuais: number;
  metaDeVotos: number;
}

export default function TermometroVotos({ votosAtuais, metaDeVotos }: TermometroVotosProps) {
  const porcentagem = metaDeVotos > 0 ? (votosAtuais / metaDeVotos) * 100 : 0;
  const porcentagemFormatada = Math.min(porcentagem, 100).toFixed(0);

  let corBarra: string;
  let corIcone: string;
  let statusTexto: string;

  if (porcentagem > 100) {
    corBarra = '#3B82F6'; // Azul
    corIcone = 'text-blue-500';
    statusTexto = 'Meta superada!';
  } else if (porcentagem >= 70) {
    corBarra = '#22C55E'; // Verde
    corIcone = 'text-green-500';
    statusTexto = 'Progresso bom!';
  } else if (porcentagem >= 30) {
    corBarra = '#F59E0B'; // Amarelo
    corIcone = 'text-yellow-500';
    statusTexto = 'Atenção, continue o progresso.';
  } else {
    corBarra = '#EF4444'; // Vermelho
    corIcone = 'text-red-500';
    statusTexto = 'Nível crítico. Reforçar o apoio.';
  }

  const formatarNumero = (valor: number) =>
    typeof window !== 'undefined' ? valor.toLocaleString('pt-BR') : `${valor}`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Progresso de Votos</h3>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${porcentagem}%`, backgroundColor: corBarra }}
        ></div>
      </div>

      <div className="flex justify-between w-full text-sm font-medium text-gray-600 mb-2">
        <span>{formatarNumero(votosAtuais)} Votos Esperados</span>
        <span>{formatarNumero(metaDeVotos)} Meta</span>
      </div>

      <div className="text-3xl font-extrabold" style={{ color: corBarra }}>
        {porcentagemFormatada}%
      </div>

      <div className="mt-4 flex items-center space-x-2">
        {porcentagem >= 100 ? (
          <FaCheckSquare className={`h-6 w-6 ${corIcone}`} />
        ) : (
          <FaRegSquare className={`h-6 w-6 ${corIcone}`} />
        )}
        <p className="text-sm text-gray-600">{statusTexto}</p>
      </div>
    </div>
  );
}
