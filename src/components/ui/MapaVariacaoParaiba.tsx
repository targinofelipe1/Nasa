// components/ui/MapaVariacaoParaiba.tsx
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Polygon, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';

type LeafletMap = import('leaflet').Map;
type LeafletModule = typeof import('leaflet');

let L: LeafletModule | undefined;

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  if (!res.ok) {
    throw new Error(`Erro ao carregar GeoJSON: ${res.statusText}`);
  }
  return res.json();
};

interface DadosMunicipioMapa {
  name: string;
  value2018?: number;
  value2022?: number;
  percentageChange?: number;
  color: string;
  infoContent: string;
}

interface MapaVariacaoParaibaProps {
  dadosMunicipios: DadosMunicipioMapa[];
  isLoading: boolean;
  tituloLoading?: string;
}

const MapBoundsAdjuster = () => {
  const map = useMap();
  const boundsAdjusted = useRef(false);

  useEffect(() => {
    if (map && !boundsAdjusted.current && L) {
      const bounds = L.latLngBounds([
        [-8.47, -34.7],
        [-6.0, -38.8],
      ]);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
      boundsAdjusted.current = true;
    }
  }, [map, L]);

  return null;
};

const MapaVariacaoParaiba: React.FC<MapaVariacaoParaibaProps> = ({
  dadosMunicipios,
  isLoading,
  tituloLoading = "Carregando dados do mapa...",
}) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [leafletRef, setLeafletRef] = useState<LeafletModule | null>(null);
  const [detalhesMunicipioClicado, setDetalhesMunicipioClicado] = useState<{
    nome: string;
    infoContent: string;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then(leafletModule => {
      L = leafletModule;
      setLeafletRef(leafletModule);
    }).catch(console.error);

    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    setDetalhesMunicipioClicado(null);
  }, [dadosMunicipios]);

  const getStyle = useCallback(
    (feature: any) => {
      const nomeMunicipioGeoJSON = feature.properties?.NOME || feature.properties?.name;
      const dadosDoMunicipio = dadosMunicipios.find((m) => {
        return removerAcentos(m.name.toUpperCase()) === removerAcentos(nomeMunicipioGeoJSON?.toUpperCase());
      });
      const cor = dadosDoMunicipio ? dadosDoMunicipio.color : '#CCCCCC';

      return {
        fillColor: cor,
        color: 'white',
        weight: 1.5,
        fillOpacity: 0.8,
      };
    },
    [dadosMunicipios]
  );

  const ClickHandler = () => {
    const map = useMap();

    useMapEvents({
      click: (e) => {
        if (!geoJsonData || !('features' in geoJsonData) || !leafletRef) return;

        const pontoClique = turf.point([e.latlng.lng, e.latlng.lat]);
        let featureClicada: Feature<Polygon | MultiPolygon> | undefined;

        for (const feature of geoJsonData.features as Feature<Polygon | MultiPolygon>[]) {
          if (feature.geometry) {
            if (feature.geometry.type === 'Polygon') {
              const polygon = turf.polygon(feature.geometry.coordinates as Polygon['coordinates']);
              if (turf.booleanPointInPolygon(pontoClique, polygon)) {
                featureClicada = feature;
                break;
              }
            } else if (feature.geometry.type === 'MultiPolygon') {
              for (const singlePolygonCoords of feature.geometry.coordinates as MultiPolygon['coordinates']) {
                const polygon = turf.polygon(singlePolygonCoords);
                if (turf.booleanPointInPolygon(pontoClique, polygon)) {
                  featureClicada = feature;
                  break;
                }
              }
            }
          }
        }

        if (featureClicada) {
          const nomeMunicipio = featureClicada.properties?.NOME || featureClicada.properties?.name;
          const dadosDoMunicipio = dadosMunicipios.find((m) => {
            return removerAcentos(m.name.toUpperCase()) === removerAcentos(nomeMunicipio?.toUpperCase());
          });

          if (dadosDoMunicipio) {
            setDetalhesMunicipioClicado({
              nome: nomeMunicipio,
              infoContent: dadosDoMunicipio.infoContent,
            });
          } else {
            setDetalhesMunicipioClicado(null);
          }
        } else {
          setDetalhesMunicipioClicado(null);
        }
      },
    });
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[700px] bg-gray-100 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-blue-900">{tituloLoading}</p>
      </div>
    );
  }

  if (!geoJsonData || dadosMunicipios.length === 0) {
    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
        Não há dados ou GeoJSON disponível para exibir o mapa comparativo.
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isClient && geoJsonData && leafletRef && (
        <MapContainer
          center={[-7.2, -36.5]}
          zoom={7}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={false}
          zoomControl={false}
          boxZoom={false}
          keyboard={false}
          touchZoom={false}
          attributionControl={false}
          style={{ height: '80vh', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
        >
          <MapBoundsAdjuster />
          <GeoJSON data={geoJsonData} style={getStyle} />
          <ClickHandler />
        </MapContainer>
      )}
      <div className="absolute bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg z-10 text-sm">
        <h3 className="font-semibold mb-2">Legenda de Variação</h3>
        <div className="flex items-center mb-1">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
          <span>Grande Queda</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: 'rgb(255, 128, 0)' }}></div>
          <span>Queda Moderada</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: 'rgb(255, 255, 150)' }}></div>
          <span>Pequena Variação</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: 'rgb(128, 255, 0)' }}></div>
          <span>Aumento Moderado</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: 'rgb(0, 128, 0)' }}></div>
          <span>Grande Aumento</span>
        </div>
        <div className="flex items-center mt-2">
          <div className="w-5 h-5 rounded-full mr-2" style={{ backgroundColor: '#CCCCCC' }}></div>
          <span>Sem Dados / Dados Insuficientes</span>
        </div>
      </div>

      {detalhesMunicipioClicado && (
        <div className="absolute top-4 right-4 w-72 bg-white rounded-lg shadow-lg border border-gray-300 p-4 space-y-2 z-50 text-left">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-bold text-gray-800">Município: {detalhesMunicipioClicado.nome}</h2>
            <button
              onClick={() => setDetalhesMunicipioClicado(null)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Fechar detalhes"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: detalhesMunicipioClicado.infoContent }} />
        </div>
      )}
    </div>
  );
};

export default React.memo(MapaVariacaoParaiba);