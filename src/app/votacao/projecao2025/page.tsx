'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';

import { MapPinIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import TermometroVotos from '@/components/ui/TermometroVotos';
import RankingVotosCidades from '@/components/ui/RankingVotosCidades';
const MapaApoioHeatmap = dynamic(() => import('@/components/ui/MapaApoioHeatmap'), {
  ssr: false,
  loading: () => <p className="text-center p-4">Carregando heatmap...</p>,
});
const DetalheMunicipioVotacao = dynamic(() => import('@/components/ui/DetalheMunicipioVotacao'), {
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Carregando detalhes do município...</p>,
});
const MapaParaibaApoio = dynamic(() => import('@/components/ui/MapaParaibaApoio'), {
  ssr: false,
  loading: () => <p className="text-center p-6">Carregando mapa...</p>,
});

interface DadoApoio {
  'Município': string;
  'Apoio': 'Sim' | 'Não' | string;
  'Total de Votos Esperado': number;
  'Nome do Apoiador': string;
}

export default function PainelApoio() {
  const [dadosApoio, setDadosApoio] = useState<DadoApoio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [totalVotosEsperadosDaPlanilha, setTotalVotosEsperadosDaPlanilha] = useState(0);
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets/eleicao/apoio');
        const json = await res.json();
        
        if (!json.success || !json.data) {
          setErro('Falha ao carregar os dados da planilha de apoio.');
          return;
        }

        const linhas: string[][] = json.data?.slice(1) || [];
        const dadosProcessados: DadoApoio[] = linhas.map(linha => ({
          'Município': linha[0]?.trim() || '',
          'Apoio': (linha[1]?.trim() || 'Não') as 'Sim' | 'Não',
          'Total de Votos Esperado': parseInt(linha[2]?.trim() || '0', 10),
          'Nome do Apoiador': linha[3]?.trim() || '',
        }));
        
        setDadosApoio(dadosProcessados);

        const votosEsperados = dadosProcessados.reduce((sum, dado) => sum + dado['Total de Votos Esperado'], 0);
        setTotalVotosEsperadosDaPlanilha(votosEsperados);

        const uniqueMunicipios = Array.from(new Set(dadosProcessados.map(d => d.Município))).sort((a,b) => a.localeCompare(b));
        setMunicipiosDisponiveis(uniqueMunicipios);

      } catch (e: any) {
        setErro(`Erro ao buscar dados: ${e.message}`);
      } finally {
        setCarregando(false);
      }
    };
    fetchData();
  }, []);

  const dadosGerais = useMemo(() => {
    let totalApoios = 0;
    let totalNaoApoios = 0;
    dadosApoio.forEach(dado => {
      if (dado.Apoio === 'Sim') {
        totalApoios += 1;
      } else {
        totalNaoApoios += 1;
      }
    });

    return {
      totalMunicipios: dadosApoio.length,
      municipiosComApoio: totalApoios,
      municipiosSemApoio: totalNaoApoios,
      totalVotosEsperados: totalVotosEsperadosDaPlanilha,
    };
  }, [dadosApoio, totalVotosEsperadosDaPlanilha]);

  const formatarNumero = (valor: number) =>
  typeof window !== 'undefined' ? valor.toLocaleString('pt-BR') : `${valor}`;

const cardData = [
  {
    label: 'Total de Municípios',
    value: dadosGerais.totalMunicipios,
    icon: MapPinIcon,
    bgColorClass: 'bg-indigo-100',
    iconColorClass: 'text-indigo-600',
    valueColorClass: 'text-indigo-600'
  },
  {
    label: 'Municípios com Apoio',
    value: dadosGerais.municipiosComApoio,
    icon: CheckCircleIcon,
    bgColorClass: 'bg-green-100',
    iconColorClass: 'text-green-600',
    valueColorClass: 'text-green-600'
  },
  {
    label: 'Municípios sem Apoio',
    value: dadosGerais.municipiosSemApoio,
    icon: XCircleIcon,
    bgColorClass: 'bg-red-100',
    iconColorClass: 'text-red-600',
    valueColorClass: 'text-red-600'
  },
  {
    label: 'Total de Votos Esperados',
    value: formatarNumero(dadosGerais.totalVotosEsperados),
    icon: EnvelopeIcon,
    bgColorClass: 'bg-yellow-100',
    iconColorClass: 'text-yellow-600',
    valueColorClass: 'text-yellow-600',
  },
];

  const metaDeVotosFixa = 150000;
  
  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex bg-white h-screen overflow-hidden">
        <div style={{ zoom: '80%' }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-auto" style={{ zoom: '80%' }}>
          <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-black font-medium">Painel</span> /
              <span className="text-gray-400"> Apoio Político</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel de Apoio Político</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
              <button
                className="pb-2 text-base font-medium border-b-2 border-blue-900 text-blue-900"
              >
                Visão Geral
              </button>
              
            </div>
          </div>

          <div className="p-6 space-y-10">
            {carregando ? (
              <p className="text-center text-gray-500">Carregando dados...</p>
            ) : erro ? (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 w-full">
                {erro}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cardData.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                      <div
                        key={index}
                        className={`
                          ${card.bgColorClass} p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center 
                          transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg
                        `}
                      >
                        <div className={`p-2 rounded-full mb-2 ${card.iconColorClass} bg-opacity-20`}>
                          <IconComponent className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-1">{card.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${card.valueColorClass}`}>{card.value}</p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="hidden md:block">
                  <MapaParaibaApoio apiData={dadosApoio} />
                </div>
                <div className="md:hidden mt-6 p-4 rounded-lg text-sm text-yellow-800">
                  <div className="w-full bg-white p-4 rounded-xl shadow-sm text-center">
                    <p className="text-base text-gray-500">
                      O mapa interativo não está disponível na visualização móvel. Por favor, acesse em uma tela maior para visualizar o conteúdo.
                    </p>
                  </div>
                </div>

                <TermometroVotos votosAtuais={dadosGerais.totalVotosEsperados} metaDeVotos={metaDeVotosFixa} />

                <RankingVotosCidades />

                <DetalheMunicipioVotacao />

                <MapaApoioHeatmap apiData={dadosApoio}/>

              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}