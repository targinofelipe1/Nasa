// components/ui/DetalheMunicipioVotacao.tsx
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';
import L, { Control, LatLngBounds } from 'leaflet';

// Importando ícones para os cards
import { HomeModernIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

const GeoJSONComponent = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

// Interfaces para os dados
interface VotacaoDetalhada {
  totalVotos: number;
}

interface VotosEsperados {
  totalVotosEsperados: number;
}

interface CardData {
  label: string;
  value: string;
  icon: React.ElementType;
  bgColorClass: string;
  iconColorClass: string;
  valueColorClass: string;
}

// NOVA INTERFACE PARA O OBJETO DE DADOS DA PLANILHA
interface DadosDaPlanilha {
  estadual: any[];
  senador: any[];
  apoio: any[];
}

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const normalizeString = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

interface MapaDetalheLogicProps {
  municipioGeoJsonFeature: Feature<Geometry, GeoJsonProperties> | null;
}

const MapaDetalheLogic: React.FC<MapaDetalheLogicProps> = ({ municipioGeoJsonFeature }) => {
  const map = useMap();
  useEffect(() => {
    let geoJsonLayer: L.GeoJSON | null = null;

    map.eachLayer(layer => {
      if ((layer as any)._geojson) {
        map.removeLayer(layer);
      }
    });

    if (municipioGeoJsonFeature) {
      geoJsonLayer = L.geoJSON(municipioGeoJsonFeature, {
        style: {
          fillColor: '#E6954B', // Corrigido para a cor laranja
          weight: 2,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.7
        }
      }).addTo(map);

      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [map, municipioGeoJsonFeature]);

  return null;
};

const DetalheMunicipioVotacao: React.FC = () => {
  const [fullGeoJsonData, setFullGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioGeoJsonFeature, setMunicipioGeoJsonFeature] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [dadosVotacao, setDadosVotacao] = useState<{ estadual: VotacaoDetalhada; senador: VotacaoDetalhada; apoio: VotosEsperados } | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  
  const [dadosDaPlanilha, setDadosDaPlanilha] = useState<DadosDaPlanilha | null>(null);
  

  useEffect(() => {
    setIsClient(true);
    loadGeoJson().then(setFullGeoJsonData).catch(console.error);

    const fetchData = async () => {
      try {
        const [resEstadual, resSenador, resApoio] = await Promise.all([
          fetch('/api/sheets/eleicao/pestadual'),
          fetch('/api/sheets/eleicao/psenado'),
          fetch('/api/sheets/eleicao/apoio'),
        ]);
        const [jsonEstadual, jsonSenador, jsonApoio] = await Promise.all([
          resEstadual.json(),
          resSenador.json(),
          resApoio.json(),
        ]);
        
        const todosOsDados = [
            ...jsonEstadual.data?.slice(1).map((row: string[]) => ({ municipio: row[0], tipo: 'estadual' })) || [],
            ...jsonSenador.data?.slice(1).map((row: string[]) => ({ municipio: row[0], tipo: 'senador' })) || [],
            ...jsonApoio.data?.slice(1).map((row: string[]) => ({ municipio: row[0], tipo: 'apoio' })) || [],
        ];
        
        const uniqueMunicipios = Array.from(new Set(todosOsDados.map(d => d.municipio))).sort((a,b) => a.localeCompare(b));
        setMunicipiosDisponiveis(uniqueMunicipios);

        setDadosDaPlanilha({ estadual: jsonEstadual.data, senador: jsonSenador.data, apoio: jsonApoio.data });
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (dadosDaPlanilha) {
      setCarregandoDados(true);
      const { estadual, senador, apoio } = dadosDaPlanilha;
      
      let totalVotosEstadual = 0;
      let totalVotosSenador = 0;
      let totalVotosEsperados = 0;

      if (municipioSelecionado && municipioSelecionado !== 'Todos os Municípios') {
        const votosEstadualFiltrados = estadual
          ?.slice(1)
          ?.filter((linha: string[]) => normalizeString(linha[0]) === normalizeString(municipioSelecionado));
        
        const votosSenadorFiltrados = senador
          ?.slice(1)
          ?.filter((linha: string[]) => normalizeString(linha[0]) === normalizeString(municipioSelecionado));

        const votosApoioFiltrados = apoio
          ?.slice(1)
          ?.filter((linha: string[]) => normalizeString(linha[0]) === normalizeString(municipioSelecionado));

        totalVotosEstadual = votosEstadualFiltrados.reduce((sum: number, linha: string[]) => sum + parseInt(linha[13] || '0', 10), 0) || 0;
        totalVotosSenador = votosSenadorFiltrados.reduce((sum: number, linha: string[]) => sum + parseInt(linha[13] || '0', 10), 0) || 0;
        totalVotosEsperados = votosApoioFiltrados.reduce((sum: number, linha: string[]) => sum + parseInt(linha[2] || '0', 10), 0) || 0;

      } else { // Se "Todos os Municípios" for selecionado, soma todos
        totalVotosEstadual = estadual
          ?.slice(1)
          ?.reduce((sum: number, linha: string[]) => sum + parseInt(linha[13] || '0', 10), 0) || 0;
        
        totalVotosSenador = senador
          ?.slice(1)
          ?.reduce((sum: number, linha: string[]) => sum + parseInt(linha[13] || '0', 10), 0) || 0;

        totalVotosEsperados = apoio
          ?.slice(1)
          ?.reduce((sum: number, linha: string[]) => sum + parseInt(linha[2] || '0', 10), 0) || 0;
      }
        
      setDadosVotacao({
        estadual: { totalVotos: totalVotosEstadual },
        senador: { totalVotos: totalVotosSenador },
        apoio: { totalVotosEsperados: totalVotosEsperados },
      });
      setCarregandoDados(false);
    }
  }, [municipioSelecionado, dadosDaPlanilha]);


  useEffect(() => {
    if (municipioSelecionado && municipioSelecionado !== 'Todos os Municípios' && fullGeoJsonData) {
      const normalizedSelectedMun = normalizeString(municipioSelecionado);
      const feature = (fullGeoJsonData as FeatureCollection).features.find(
        f => normalizeString(f.properties?.name || '') === normalizedSelectedMun
      );
      setMunicipioGeoJsonFeature(feature || null);
    } else {
      setMunicipioGeoJsonFeature(null);
    }
  }, [municipioSelecionado, fullGeoJsonData]);

  const cards = useMemo(() => {
    const cardList: CardData[] = [];
    if (dadosVotacao) {
      cardList.push({
        label: `Votos Deputado Estadual (2018)`,
        value: dadosVotacao.estadual.totalVotos.toLocaleString('pt-BR'),
        icon: HomeModernIcon,
        bgColorClass: 'bg-indigo-100',
        iconColorClass: 'text-indigo-600',
        valueColorClass: 'text-indigo-600',
      });
      cardList.push({
        label: `Votos para Senador (2022)`,
        value: dadosVotacao.senador.totalVotos.toLocaleString('pt-BR'),
        icon: UserIcon,
        bgColorClass: 'bg-green-100',
        iconColorClass: 'text-green-600',
        valueColorClass: 'text-green-600',
      });
      cardList.push({
        label: `Votos Esperados (2025)`,
        value: dadosVotacao.apoio.totalVotosEsperados.toLocaleString('pt-BR'),
        icon: EnvelopeIcon,
        bgColorClass: 'bg-yellow-100',
        iconColorClass: 'text-yellow-600',
        valueColorClass: 'text-yellow-600',
      });
    }
    return cardList;
  }, [dadosVotacao]);
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        {/* Layout do título e filtro ajustado */}
        <div className="flex flex-col mb-4 gap-2">
          <h3 className="text-lg font-bold text-gray-900">
            Mapa Detalhado: {municipioSelecionado}
          </h3>
          <div className="relative w-full">
            <select
              className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2 px-5 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              value={municipioSelecionado}
              onChange={(e) => setMunicipioSelecionado(e.target.value)}
            >
              <option value="Todos os Municípios">Todos os Municípios</option>
              {municipiosDisponiveis.map((municipio) => (
                <option key={municipio} value={municipio}>
                  {municipio}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>
        
        {isClient && fullGeoJsonData && (
          <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200">
            {/* Adicionado uma key para forçar a renderização do mapa */}
            <MapContainer
              key={municipioSelecionado}
              center={[-7.13, -36.8245]}
              zoom={municipioSelecionado !== 'Todos os Municípios' ? 10 : 8}
              scrollWheelZoom={false}
              dragging={municipioSelecionado === 'Todos os Municípios'}
              zoomControl={false}
              attributionControl={false}
              style={{ height: '100%', width: '100%', backgroundColor: 'white' }}
            >
              {isClient && fullGeoJsonData ? (
                municipioSelecionado !== 'Todos os Municípios' ? (
                  <MapaDetalheLogic municipioGeoJsonFeature={municipioGeoJsonFeature} />
                ) : (
                   <GeoJSONComponent
                     data={fullGeoJsonData}
                     style={{ fillColor: '#E6954B', weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 }}
                   />
                )
              ) : null}
            </MapContainer>
          </div>
        )}
      </div>

      <div className="w-full md:w-96 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Dados de Votação</h3>
        {carregandoDados ? (
          <p className="text-gray-500">Carregando dados...</p>
        ) : dadosVotacao ? (
          <div className="grid grid-cols-1 gap-4">
            {cards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={index}
                  className={`
                    ${card.bgColorClass} p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center 
                    transition-all duration-300 ease-in-out
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
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p>Não foi possível carregar os dados para este município.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalheMunicipioVotacao;