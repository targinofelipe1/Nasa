'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject } from 'geojson';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const coresApoio: Record<string, string> = {
  'Sim': '#006400',
  'Não': '#B22222',
  'Outros': '#D3D3D3',
};

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface MapaParaibaApoioProps {
  apiData: any[];
}

const MapaParaibaApoio = ({ apiData }: MapaParaibaApoioProps) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioApoio, setMunicipioApoio] = useState<Record<string, string>>({});
  const [municipioSelecionado, setMunicipioSelecionado] = useState<{ nome: string; apoio: string } | null>(null);

  useEffect(() => {
    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    if (apiData.length > 0) {
      const mapa: Record<string, string> = {};
      apiData.forEach(dado => {
        const municipio = removerAcentos(dado['Município'].toUpperCase());
        mapa[`${municipio}`] = dado['Apoio'];
      });
      setMunicipioApoio(mapa);
    }
  }, [apiData]);

  const getStyle = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipioNormalizado = removerAcentos(nomeMunicipio?.toUpperCase() || '');
    const apoio = municipioApoio[`${municipioNormalizado}`] || 'Outros';
    const cor = coresApoio[`${apoio}`] || '#D3D3D3';
    return {
      fillColor: cor,
      color: 'white',
      weight: 1,
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    layer.on({
      click: () => {
        const municipioNormalizado = removerAcentos(nomeMunicipio?.toUpperCase() || '');
        const apoioStatus = municipioApoio[`${municipioNormalizado}`] || 'Outros';
        setMunicipioSelecionado({ nome: nomeMunicipio, apoio: apoioStatus });
      },
    });
  };

  return (
    <div className="relative flex w-full h-full bg-white">
      {/* Coluna Esquerda: Nome do Município */}
      <div className="w-[300px] flex-shrink-0 p-4">
        {municipioSelecionado && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-white shadow-md border border-gray-200">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: coresApoio[municipioSelecionado.apoio] || '#D3D3D3' }}
            ></div>
            <span className="text-sm font-semibold text-gray-800">
              Município: {municipioSelecionado.nome}
            </span>
          </div>
        )}
      </div>

      {/* Coluna Central: Mapa */}
      <div className="flex-1 w-full h-[80vh]">
        {geoJsonData && (
          <MapContainer
            center={[-7.13, -36.8245]}
            zoom={8}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={true}
            zoomControl={false}
            style={{ height: '100%', width: '100%', background: 'white' }}
          >
            <GeoJSON
              data={geoJsonData}
              style={getStyle}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        )}
      </div>
      
      {/* Coluna Direita: Legenda */}
      <div className="w-[300px] flex-shrink-0 p-4">
        <div className="p-4 border rounded-lg bg-gray-50 shadow-sm flex flex-col items-start gap-4">
          <h2 className="text-center text-base font-semibold mb-2">Legenda de Apoio</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3">
            {Object.entries(coresApoio).filter(([status]) => status !== 'Outros').map(([status, cor]) => (
              <div key={status} className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: cor }}
                ></div>
                <span className="text-sm text-gray-800 truncate">
                  {status === 'Sim' ? 'Com Apoio' : 'Sem Apoio'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaParaibaApoio;