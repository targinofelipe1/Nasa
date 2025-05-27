'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Polygon } from 'geojson';
import * as turf from '@turf/turf';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const coresPorPartido: Record<string, string> = {
  '#NULO#': '#7D7D7D', agir: '#D7263D', cidadania: '#1E90FF', dc: '#A020F0', mdb: '#FFA500',
  'pc do b': '#E60000', pdt: '#00CED1', pl: '#0033A0', pmb: '#FF69B4', pp: '#228B22',
  pros: '#FF8C00', prtb: '#8A2BE2', psb: '#FFD700', psd: '#8B0000', psdb: '#4169E1',
  psol: '#FFFF00', pt: '#B22222', ptb: '#2F4F4F', pv: '#006400', rede: '#20B2AA',
  republicanos: '#4682B4', solidariedade: '#FF4500', uniao: '#00BFFF', psl: '#0057B7', pode: '#006E2E',
  pr: '#015AAA', prb: '#115E80', dem: '#8CC63E', psc: '#006f41', pps: '#ec008c', avante: '#2eacb2'

};

const nomesLegais: Record<string, string> = {
  '#NULO#': 'Nulo e Branco', cidadania: 'Cidadania', mdb: 'MDB',
   pdt: 'PDT', pl: 'PL', pmb: 'PMB', pp: 'PP', pros: 'PROS',
  prtb: 'PRTB', psb: 'PSB', psd: 'PSD', psdb: 'PSDB', psol: 'PSOL', pt: 'PT',
  ptb: 'PTB', pv: 'PV', rede: 'Rede', republicanos: 'Republicanos', 
  uniao: 'União', psl: 'PSL', pode: 'Podemos', pr: 'PR', dem: 'DEM', psc: 'PSC',
  pps: 'PPS', avante: 'Avante', prb: 'PRB', solidariedade: 'Solidariedade'

};

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizarPartido = (partido: string) => {
  if (!partido) return '#NULO#';
  const p = partido.toLowerCase().trim();
  if (p === 'nulo' || p === '#nulo#' || p === 'indefinido' || p === '-') return '#NULO#';
  if (p.includes('união')) return 'uniao';
  return p;
};

const MapaParaibaCandidato = ({ apiData, abaAtiva }: { apiData: any[]; abaAtiva: string }) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string | null>(null);
  const [topCandidatos, setTopCandidatos] = useState<{ nome: string; votos: number; cor: string }[]>([]);
  const [isClient, setIsClient] = useState(false);
  const cacheVencedores = useRef<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    const mapa: Record<string, string> = {};
    const votosMunicipais: Record<string, Record<string, number>> = {};

    for (const d of apiData) {
      const municipio = removerAcentos(d['Município']?.toUpperCase() || '');
      const nomeCandidato = d['Nome do Candidato/Voto'];
      if (!municipio || !nomeCandidato) continue;
      votosMunicipais[municipio] ??= {};
      votosMunicipais[municipio][nomeCandidato] = (votosMunicipais[municipio][nomeCandidato] || 0) + parseInt(d['Quantidade de Votos'] || '0', 10);
    }

    for (const municipio in votosMunicipais) {
      const candidatos = votosMunicipais[municipio];
      const [maisVotado] = Object.entries(candidatos).sort((a, b) => b[1] - a[1]);
      const registro = apiData.find(d => removerAcentos(d['Município']?.toUpperCase() || '') === municipio && d['Nome do Candidato/Voto'] === maisVotado[0]);
      const partido = normalizarPartido(registro?.['Sigla do Partido'] || '#NULO#');
      mapa[municipio] = partido;
    }

    cacheVencedores.current = mapa;
  }, [apiData]);

  const getStyle = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipio = removerAcentos(nomeMunicipio?.toUpperCase() || '');
    const partido = normalizarPartido(cacheVencedores.current[municipio] || '');
    const cor = coresPorPartido[partido] || '#d3a1c8';
    return { fillColor: cor, color: 'white', weight: 1.5, fillOpacity: 0.8 };
  };

  const ClickHandler = () => {
    useMapEvents({
      click: e => {
        if (!geoJsonData || !('features' in geoJsonData)) return;
        const ponto = turf.point([e.latlng.lng, e.latlng.lat]);
        const municipio = (geoJsonData.features as Feature[]).find(feature => {
          if (!feature.geometry || feature.geometry.type !== 'Polygon') return false;
          const poligono = turf.polygon(feature.geometry.coordinates as Polygon['coordinates']);
          return turf.booleanPointInPolygon(ponto, poligono);
        });
        if (!municipio) return;

        const nome = municipio.properties?.NOME || municipio.properties?.name;
        setMunicipioSelecionado(nome);

        const votosMunicipio = apiData.filter(d => removerAcentos(d['Município']?.toUpperCase() || '') === removerAcentos(nome.toUpperCase()));

        const votosPorCandidato: Record<string, { votos: number; partido: string }> = {};
        for (const d of votosMunicipio) {
          const nome = d?.['Nome do Candidato/Voto'] || 'Desconhecido';
          const partido = normalizarPartido(d?.['Sigla do Partido']);
          if (!votosPorCandidato[nome]) votosPorCandidato[nome] = { votos: 0, partido };
          votosPorCandidato[nome].votos += parseInt(d?.['Quantidade de Votos'] || '0', 10);
        }

        let limite = 10;
        const cargo = (votosMunicipio[0]?.Cargo || '').toLowerCase();
        if (cargo.includes('presidente')) limite = 4;
        else if (cargo.includes('senador') || cargo.includes('governador')) limite = 8;
        else if (cargo.includes('deputado')) limite = 15;

        const top = Object.entries(votosPorCandidato)
          .sort((a, b) => b[1].votos - a[1].votos)
          .slice(0, limite)
          .map(([nome, { votos, partido }]) => ({ nome, votos, cor: coresPorPartido[partido] || '#d3a1c8' }));

        setTopCandidatos(top);
      }
    });
    return null;
  };

  return (
    <div className="relative flex flex-col md:flex-row gap-4 items-start bg-white">
      <div className="flex-1">
        {isClient && geoJsonData && (
          <MapContainer
            center={[-7.13, -36.8245]}
            zoom={8}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            zoomControl={false}
            style={{ height: '80vh', width: '100%', backgroundColor: 'white' }}
          >
            <GeoJSON data={geoJsonData} style={getStyle} />
            <ClickHandler />
          </MapContainer>
        )}
      </div>

      <div className="w-full md:w-90 p-4 border rounded bg-gray-50 shadow-sm mx-auto">
        <h2 className="text-center text-base font-semibold mb-4">Legenda de Partidos</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {Object.keys(coresPorPartido).map((sigla, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <div
                className="w-5 h-5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: coresPorPartido[sigla] || '#999' }}
              ></div>
              <span className="text-sm text-gray-800 truncate max-w-[100px]">
                {nomesLegais[sigla] || sigla.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>



      {municipioSelecionado && (
        <div className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-lg border border-gray-300 p-4 space-y-2 z-50">
          <h2 className="text-base font-bold text-gray-800 mb-2">Município: {municipioSelecionado}</h2>
          <div className="space-y-1">
            {topCandidatos.map((candidato, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: candidato.cor }}></span>
                <span className="text-sm text-gray-800">{candidato.nome}</span>
                <span className="text-sm font-semibold text-gray-600 ml-auto">{candidato.votos.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaParaibaCandidato;