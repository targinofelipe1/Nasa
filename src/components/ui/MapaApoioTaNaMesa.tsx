'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject } from 'geojson';
import L from 'leaflet';

// Importa os componentes do Leaflet dinamicamente para desativar o SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

// Mapeamento de cores para o status de apoio
const esquemaCoresApoio: Record<string, string> = {
  'Com Apoio': '#FF8C00', // Laranja para apoio
  'Sem Apoio': '#D3D3D3', // Cinza claro para sem apoio
};

// Função para remover acentos e normalizar strings
const normalizarNomeMunicipio = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface DadosPlanilhaItem {
  'MUNICÍPIO': string;
  'NOME': string;
}

interface MapaApoioTaNaMesaProps {
  apiData: DadosPlanilhaItem[];
}

const MapaApoioTaNaMesa = ({ apiData }: MapaApoioTaNaMesaProps) => {
  const [dadosGeoJson, setDadosGeoJson] = useState<GeoJsonObject | null>(null);
  const [mapaDadosApoio, setMapaDadosApoio] = useState<Record<string, DadosPlanilhaItem[]>>({});
  const [infoMunicipio, setInfoMunicipio] = useState<{ nome: string; apoio: string; pessoas: string[] } | null>(null);

  // Efeito para carregar o GeoJSON do servidor
  useEffect(() => {
    const carregarDadosGeoJson = async () => {
      try {
        const res = await fetch('/geojson/paraiba.geojson');
        const data = await res.json();
        setDadosGeoJson(data);
      } catch (error) {
        console.error("Falha ao carregar o GeoJSON:", error);
      }
    };
    carregarDadosGeoJson();
  }, []);

  // Efeito para processar os dados da planilha recebidos via prop
  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const mapaDeApoio: Record<string, DadosPlanilhaItem[]> = {};
      apiData.forEach(item => {
        const municipioNomeCompleto = item['MUNICÍPIO'];
        const municipioNormalizado = normalizarNomeMunicipio(municipioNomeCompleto?.split(' - ')[0].toUpperCase() || '');

        if (municipioNormalizado) {
          if (!mapaDeApoio[municipioNormalizado]) {
            mapaDeApoio[municipioNormalizado] = [];
          }
          if (item['NOME'] && item['NOME'].toLowerCase() !== 'ainda não informado') {
            mapaDeApoio[municipioNormalizado].push(item);
          }
        }
      });
      setMapaDadosApoio(mapaDeApoio);
    }
  }, [apiData]);

  // Define o estilo de cada município no mapa
  const obterEstilo = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipioNormalizado = normalizarNomeMunicipio(nomeMunicipio?.toUpperCase() || '');
    
    const temApoio = mapaDadosApoio.hasOwnProperty(municipioNormalizado) && mapaDadosApoio[municipioNormalizado].length > 0;
    const cor = temApoio ? esquemaCoresApoio['Com Apoio'] : esquemaCoresApoio['Sem Apoio'];

    return {
      fillColor: cor,
      color: 'white',
      weight: 1,
      fillOpacity: 0.8,
    };
  };

  // Define a ação ao clicar em um município
  const aoClicarNoMunicipio = (feature: any, layer: L.Layer) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    layer.on({
      click: () => {
        const municipioNormalizado = normalizarNomeMunicipio(nomeMunicipio?.toUpperCase() || '');
        const apoioStatus = (mapaDadosApoio.hasOwnProperty(municipioNormalizado) && mapaDadosApoio[municipioNormalizado].length > 0) ? 'Com Apoio' : 'Sem Apoio';
        
        // Filtra para mostrar apenas nomes que estão preenchidos
        const pessoasComApoio = mapaDadosApoio[municipioNormalizado]?.map(p => p.NOME).filter(Boolean) || [];

        setInfoMunicipio({
          nome: nomeMunicipio,
          apoio: apoioStatus,
          pessoas: pessoasComApoio
        });
      },
    });
  };

  return (
    <div className="relative flex w-full h-[80vh] bg-white">
      {/* Coluna Esquerda: Detalhes do Município (aparece apenas com clique) */}
      <div className="absolute top-4 left-4 z-[1000]">
        {infoMunicipio && (
          <div className="p-3 rounded-lg bg-white shadow-md border border-gray-200">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: esquemaCoresApoio[infoMunicipio.apoio] }}
              ></div>
              <span className="text-sm font-semibold text-gray-800">
                Município: {infoMunicipio.nome}
              </span>
            </div>
            {infoMunicipio.pessoas.length > 0 && (
              <div className="mt-2 text-sm text-gray-700">
                <p className="font-semibold">Pessoas:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {infoMunicipio.pessoas.map((nome, index) => (
                    <li key={index} className="text-xs">{nome}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coluna Central: Mapa */}
      <div className="flex-1 w-full h-full">
        {dadosGeoJson && (
          <MapContainer
            center={[-7.13, -36.8245]}
            zoom={8}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            zoomControl={false}
            style={{ height: '100%', width: '100%', background: 'white' }}
          >
            <GeoJSON
              data={dadosGeoJson}
              style={obterEstilo}
              onEachFeature={aoClicarNoMunicipio}
            />
          </MapContainer>
        )}
      </div>
      
      {/* Coluna Direita: Legenda (agora no canto superior direito) */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="p-3 rounded-lg bg-white shadow-md border border-gray-200">
          <h2 className="text-sm font-semibold mb-2">Legenda de Apoio</h2>
          <div className="grid grid-cols-1 gap-y-2">
            {Object.entries(esquemaCoresApoio).map(([status, cor]) => (
              <div key={status} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: cor }}
                ></div>
                <span className="text-xs font-medium text-gray-800 truncate">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaApoioTaNaMesa;