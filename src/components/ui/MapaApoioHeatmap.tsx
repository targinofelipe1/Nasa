'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature } from 'geojson';
import L from 'leaflet';

const GeoJSONComponent = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const faixasVotos = [
  { max: 300, cor: '#C8E6C9', label: '0 - 300 Votos' },
  { max: 600, cor: '#A5D6A7', label: '301 - 600 Votos' },
  { max: 1000, cor: '#81C784', label: '601 - 1.000 Votos' },
  { max: 2000, cor: '#66BB6A', label: '1.001 - 2.000 Votos' },
  { max: 5000, cor: '#4CAF50', label: '2.001 - 5.000 Votos' },
  { max: 10000, cor: '#2E7D32', label: '5.001 - 10.000 Votos' },
];
const corMaxVotos = '#1B5E20';
const labelMaxVotos = 'Acima de 10.000 Votos';

const coresGradiente = {
  semApoio: '#B71C1C',
  semDados: '#E8E8E8',
};

const normalizeString = (str: string): string =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const getCorPorIntensidade = (valor: number, status: string): string => {
  if (status === 'Não') return coresGradiente.semApoio;
  if (status === 'Sem Dados') return coresGradiente.semDados;

  for (const faixa of faixasVotos) {
    if (valor <= faixa.max) {
      return faixa.cor;
    }
  }

  return corMaxVotos;
};

interface MapaApoioHeatmapProps {
  apiData: any[];
}

const MapaApoioHeatmap: React.FC<MapaApoioHeatmapProps> = ({ apiData }) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioApoio, setMunicipioApoio] = useState<Record<string, { status: string; votos: number }>>({});
  const [maxVotos, setMaxVotos] = useState(0);

  useEffect(() => {
    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    if (apiData.length > 0) {
      const mapa: Record<string, { status: string; votos: number }> = {};
      let maxTotalVotos = 0;
      apiData.forEach(dado => {
        const municipio = normalizeString(dado['Município']);
        const votos = dado['Total de Votos Esperado'];
        const status = dado['Apoio'];

        if (status === 'Sim' && votos > maxTotalVotos) {
          maxTotalVotos = votos;
        }
        if (municipio) {
          mapa[municipio] = { status, votos };
        }
      });
      setMunicipioApoio(mapa);
      setMaxVotos(maxTotalVotos);
    }
  }, [apiData]);

  const getStyle = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipioNormalizado = normalizeString(nomeMunicipio || '');
    const apoio = municipioApoio[municipioNormalizado] || { status: 'Sem Dados', votos: 0 };
    const cor = getCorPorIntensidade(apoio.votos, apoio.status);

    return {
      fillColor: cor,
      color: 'white',
      weight: 1,
      fillOpacity: 0.8
    };
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipioNormalizado = normalizeString(nomeMunicipio || '');
    const dados = municipioApoio[municipioNormalizado];

    let tooltipContent = `<h4 style="margin-bottom: 5px; font-weight: bold;">${nomeMunicipio}</h4>`;
    if (dados) {
      const votosFormatados = typeof window !== 'undefined'
        ? dados.votos.toLocaleString('pt-BR')
        : `${dados.votos}`; // fallback seguro

      tooltipContent += `<div>Apoio: <span style="color: ${dados.status === 'Sim' ? 'green' : 'red'}; font-weight: bold;">${dados.status}</span></div>`;
      tooltipContent += `<div>Votos Esperados: ${votosFormatados}</div>`;
    } else {
      tooltipContent += `<div>Sem dados de apoio.</div>`;
    }

    layer.bindTooltip(tooltipContent, { sticky: true });

    layer.on({
      mouseover: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle({
          weight: 2,
          color: 'white',
          fillOpacity: 1,
        });
        targetLayer.bringToFront();
      },
      mouseout: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle(getStyle(feature));
      },
    });
  };

  const legendaItens = useMemo(() => {
    const itens = faixasVotos.map((faixa) => ({
      label: faixa.label,
      cor: faixa.cor,
    }));
    itens.push({ label: labelMaxVotos, cor: corMaxVotos });
    return itens;
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Mapa de Apoio - Intensidade de Votos Esperados</h3>
      <div className="relative flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1">
          {geoJsonData && (
            <MapContainer
              center={[-7.13, -36.8245]}
              zoom={8}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              dragging={true}
              zoomControl={false}
              style={{ height: '80vh', width: '100%', backgroundColor: 'white' }}
            >
              <GeoJSONComponent data={geoJsonData} style={getStyle} onEachFeature={onEachFeature} />
            </MapContainer>
          )}
        </div>

        <div className="w-full md:w-90 p-4 border rounded bg-gray-50 shadow-sm mx-auto">
          <h2 className="text-center text-base font-semibold mb-4">Legenda</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3">
            {legendaItens.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.cor }}
                ></div>
                <span className="text-sm text-gray-800">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm flex-shrink-0" style={{ backgroundColor: coresGradiente.semApoio }}></div>
              <span className="text-sm text-gray-800">Sem Apoio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaApoioHeatmap;
