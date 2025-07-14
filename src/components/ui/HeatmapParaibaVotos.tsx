'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Geometry, GeoJsonProperties } from 'geojson';
import L, { Map as LeafletMap, Control } from 'leaflet';

interface VotoDataAggregated {
  totalVotosCandidato: number;
  totalVotosValidosMunicipio: number;
  nomeCandidato: string;
}

interface CandidatoDropdownOption {
  nome: string;
  siglaPartido: string;
  numeroCandidato?: string;
}

interface HeatmapParaibaVotosProps {
  apiData: any[];
  candidatosDisponiveis: CandidatoDropdownOption[];
  currentCargo: string;
  municipiosDisponiveisGlobal: string[];
}

const GeoJSONComponent = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const getColor = (d: number): string => {
  return d > 75 ? '#800026' :
         d > 60 ? '#BD0026' :
         d > 45 ? '#E31A1C' :
         d > 30 ? '#FC4E2A' :
         d > 15 ? '#FD8D3C' :
                  '#E6954B';
};

interface CustomInfoControl extends L.Control {
  _div: HTMLElement;
  updateContent: (html: string) => void;
}

// NOVO: Função para normalizar strings (remover acentos e converter para maiúsculas)
const normalizeString = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

const HeatmapParaibaVotos: React.FC<HeatmapParaibaVotosProps> = ({ apiData, candidatosDisponiveis, currentCargo, municipiosDisponiveisGlobal }) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedCandidateForHeatmap, setSelectedCandidateForHeatmap] = useState<string>('Todos os Candidatos');
  const [dataByLocation, setDataByLocation] = useState<Map<string, VotoDataAggregated>>(new Map());
  const infoControlRef = useRef<CustomInfoControl | null>(null);
  const [currentInfoContent, setCurrentInfoContent] = useState<string>('');

   const safeParseVotes = useCallback((value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

  useEffect(() => {
    setIsClient(true);
    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedCandidateForHeatmap('Todos os Candidatos');
    setCurrentInfoContent('');
  }, [apiData, currentCargo]);

  const candidatosDisponiveisForHeatmapDropdown = useMemo(() => {
    let filteredDataForCandidates = apiData.filter(item => item.Cargo === currentCargo);

    const uniqueCandidatos = new Map<string, CandidatoDropdownOption>();
    filteredDataForCandidates.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      if (nomeCandidato && siglaPartido &&
          nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
          siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatos.has(key)) {
          uniqueCandidatos.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    return Array.from(uniqueCandidatos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [apiData, currentCargo]);

  useEffect(() => {
    const aggregatedData = new Map<string, VotoDataAggregated>();
    let filteredApiDataForAggregation = apiData.filter(item => item.Cargo === currentCargo);
    
    if (selectedCandidateForHeatmap !== 'Todos os Candidatos' && filteredApiDataForAggregation.length > 0) {
      const targetCandidateName = selectedCandidateForHeatmap.toUpperCase();

      const totalValidVotesByMunicipio: { [normalizedMunicipio: string]: number } = {};
      filteredApiDataForAggregation.forEach(item => {
        const municipio = item['Município']?.trim();
        const normalizedMunicipio = municipio ? normalizeString(municipio) : ''; // APLICADO AQUI
        const nomeVoto = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaVoto = item['Sigla do Partido']?.toLowerCase();
        const votos = parseInt(item['Quantidade de Votos'] || '0', 10);

        const isLegenda = nomeVoto === siglaVoto?.toUpperCase();
        const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

        if (normalizedMunicipio && !isBrancoOuNulo && !isLegenda) { // Verifica se municipio normalizado existe
          totalValidVotesByMunicipio[normalizedMunicipio] = (totalValidVotesByMunicipio[normalizedMunicipio] || 0) + votos;
        }
      });

      const candidateVotesByMunicipio: { [normalizedMunicipio: string]: number } = {};
      filteredApiDataForAggregation.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === targetCandidateName)
        .forEach(item => {
          const municipio = item['Município']?.trim();
          const normalizedMunicipio = municipio ? normalizeString(municipio) : ''; // APLICADO AQUI
          const votos = parseInt(item['Quantidade de Votos'] || '0', 10);
          if (normalizedMunicipio) { // Verifica se municipio normalizado existe
            candidateVotesByMunicipio[normalizedMunicipio] = (candidateVotesByMunicipio[normalizedMunicipio] || 0) + votos;
          }
        });

      const municipiosToAggregate = municipiosDisponiveisGlobal; 

      municipiosToAggregate.forEach(mun => {
        const normalizedMun = normalizeString(mun); // APLICADO AQUI
        aggregatedData.set(normalizedMun, {
          totalVotosCandidato: candidateVotesByMunicipio[normalizedMun] || 0,
          totalVotosValidosMunicipio: totalValidVotesByMunicipio[normalizedMun] || 0,
          nomeCandidato: targetCandidateName
        });
      });
    }

    setDataByLocation(aggregatedData);
  }, [apiData, selectedCandidateForHeatmap, currentCargo, municipiosDisponiveisGlobal, safeParseVotes]); // Adicionado safeParseVotes como dependência

  const getStyle = useCallback((feature?: Feature<Geometry, GeoJsonProperties>) => {
    if (!feature || !feature.properties || !feature.properties.name) {
      return { fillColor: '#CCCCCC', weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
    }
    
    const municipioNomeGeoJSON = normalizeString(feature.properties.name); // APLICADO AQUI: Normaliza o nome do GeoJSON
    const candidateData = dataByLocation.get(municipioNomeGeoJSON); // Usa o nome normalizado para buscar
    const percentage = candidateData && candidateData.totalVotosValidosMunicipio > 0
                                     ? (candidateData.totalVotosCandidato / candidateData.totalVotosValidosMunicipio) * 100
                                     : 0;

    return {
      fillColor: getColor(percentage),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '',
      fillOpacity: 0.7
    };
  }, [dataByLocation]);

  const MapComponentsAndLogic = ({ geoJsonData, getStyle, selectedCandidateForHeatmap, dataByLocation, infoControlRef, currentInfoContent }: { 
    geoJsonData: GeoJsonObject; 
    getStyle: (feature?: Feature<Geometry, GeoJsonProperties>) => any;
    selectedCandidateForHeatmap: string; 
    dataByLocation: Map<string, VotoDataAggregated>;
    infoControlRef: React.MutableRefObject<CustomInfoControl | null>;
    currentInfoContent: string;
  }) => {
    const map = useMap();
    
    const InfoControl = L.Control.extend({
        onAdd: function (this: CustomInfoControl, map: LeafletMap) {
            this._div = L.DomUtil.create('div', 'info');
            this._div.style.backgroundColor = 'white';
            this._div.style.padding = '10px';
            this._div.style.borderRadius = '8px';
            this._div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
            this._div.style.minWidth = '200px';
            this._div.style.pointerEvents = 'auto'; 
            this._div.innerHTML = currentInfoContent; 
            this._div.style.display = currentInfoContent === '' ? 'none' : 'block'; 

            this.updateContent = function (html: string) { 
                this._div.innerHTML = html;
                this._div.style.display = html === '' ? 'none' : 'block';
            };
            return this._div;
        },
        onRemove: function (this: CustomInfoControl, map: LeafletMap) { }
    });

    const LegendControl = L.Control.extend({
        onAdd: function (this: L.Control, map: LeafletMap) {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 15, 30, 45, 60, 75];
            const labelsText = ['0 – 15%', '15 – 30%', '30 – 45%', '45 – 60%', '60 – 75%', '+ 75%'];
            const labelsHtml: string[] = [];

            div.innerHTML = '<h4 style="margin-bottom: 10px; font-size: 1.15em; font-weight: bold;">Votos</h4>';
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '8px';
            div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';

            for (let i = 0; i < grades.length; i++) {
                const sampleValueForColor = (i === grades.length - 1) ? 76 : grades[i] + 1; 
                
                labelsHtml.push(
                    `<div style="display: flex; align-items: center; margin-bottom: 10px;">` + 
                    `<i style="background:${getColor(sampleValueForColor)}; width: 24px; height: 24px; margin-right: 12px; opacity: 0.8; border-radius: 4px; flex-shrink: 0;"></i> ` +
                    `<span style="line-height: 24px;"> ${labelsText[i]}</span>` +
                    `</div>`
                );
            }
            div.innerHTML += labelsHtml.join('');
            return div;
        },
        onRemove: function (this: L.Control, map: LeafletMap) {}
    });

    useEffect(() => {
      if (infoControlRef.current && map.addControl(infoControlRef.current)) {
        map.removeControl(infoControlRef.current);
      }
      
      const info = new InfoControl({ position: 'topleft' }); 
      info.addTo(map);
      infoControlRef.current = info as CustomInfoControl;

      const legend = new LegendControl({ position: 'bottomleft' });
      legend.addTo(map);

      if (infoControlRef.current) {
        infoControlRef.current.updateContent(currentInfoContent);
      }

      let geoJsonLayer: L.GeoJSON | null = null; 

      const onEachFeatureInternal = (feature: Feature, layer: L.Layer) => {
          layer.bindPopup(function (layer) { return ''; }); 
          
          layer.on({
              click: (e) => {
                  if (selectedCandidateForHeatmap === 'Todos os Candidatos') {
                      return;
                  }

                  const municipioNomeOriginal = feature.properties?.name || 'Desconhecido'; // Nome original do GeoJSON
                  const municipioNomeNormalizado = normalizeString(municipioNomeOriginal); // NOVO: Normaliza para buscar dados
                  const candidateData = dataByLocation.get(municipioNomeNormalizado); // Usa nome normalizado para buscar
                  
                  const percentage = candidateData && candidateData.totalVotosValidosMunicipio > 0
                                                     ? (candidateData.totalVotosCandidato / candidateData.totalVotosValidosMunicipio) * 100
                                                     : 0;
                  const dotColor = getColor(percentage);

                  let infoHtml = `<h4 style="margin-bottom: 8px; font-weight: bold; font-size: 1.2em;">Município: ${municipioNomeOriginal}</h4>`; // Exibe o nome original aqui
                  if (candidateData) {
                      const totalVotos = candidateData.totalVotosCandidato.toLocaleString('pt-BR');
                      const displayPercentage = candidateData.totalVotosValidosMunicipio > 0
                                                          ? (candidateData.totalVotosCandidato / candidateData.totalVotosValidosMunicipio * 100).toFixed(2)
                                                          : '0.00';
                      
                      infoHtml += `
                          <div style="display: flex; align-items: center; margin-bottom: 4px; font-size: 1.1em; color: #333;"> 
                            <span style="background-color: ${dotColor}; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; flex-shrink: 0;"></span>
                            <span style="font-weight: bold; margin-right: 4px;">${candidateData.nomeCandidato}:</span>
                            <span>${totalVotos} votos (${displayPercentage}%)</span>
                          </div>
                      `;
                  } else { 
                      infoHtml += `<p style="font-size: 1.1em;">${selectedCandidateForHeatmap}: 0 votos (0.00%)</p>`; 
                  }
                  
                  setCurrentInfoContent(infoHtml);
              },
              mouseover: (e) => { 
                if (selectedCandidateForHeatmap === 'Todos os Candidatos') { 
                  return; 
                }
                const targetLayer = e.target;
                targetLayer.setStyle({
                    weight: 5,
                    color: 'white',
                    dashArray: '',
                    fillOpacity: 0.7
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    targetLayer.bringToFront();
                }
              },
              mouseout: (e) => { 
                if (selectedCandidateForHeatmap === 'Todos os Candidatos') { 
                  return; 
                }
                const targetLayer = e.target;
                targetLayer.setStyle(getStyle(feature));
              },
          });
      };
      
      if (geoJsonData) {
        map.eachLayer(layer => {
            if ((layer as any)._geojson || (layer as any).options.onEachFeature === onEachFeatureInternal) {
                map.removeLayer(layer);
            }
        });
        
        geoJsonLayer = L.geoJSON(geoJsonData, { style: getStyle, onEachFeature: onEachFeatureInternal }).addTo(map);
      }

      return () => {
        if (map) {
          if (infoControlRef.current) { 
            map.removeControl(infoControlRef.current);
            infoControlRef.current = null;
          }
          map.removeControl(legend); 
          if (geoJsonLayer) {
              map.removeLayer(geoJsonLayer);
          }
        }
      };
    }, [map, selectedCandidateForHeatmap, dataByLocation, getStyle, geoJsonData, currentInfoContent]);

    return null;
  };

  const selectClasses = `
    appearance-none block w-full bg-white border border-gray-300 rounded-full
    py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    shadow-sm transition duration-150 ease-in-out
    cursor-pointer
  `;

  const disabledSelectClasses = `
    ${selectClasses}
    bg-gray-100 text-gray-500 cursor-not-allowed
  `;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Heatmap de Votos por Município</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        
        <div className="md:col-span-2">
          <label htmlFor="heatmap-candidate-select" className="block text-sm font-medium text-gray-700 mb-1">
            Selecione um Candidato para o Heatmap:
          </label>
          <div className="relative">
            <select
              id="heatmap-candidate-select"
              className={apiData.length === 0 ? disabledSelectClasses : selectClasses}
              value={selectedCandidateForHeatmap}
              onChange={(e) => {
                setSelectedCandidateForHeatmap(e.target.value);
                setCurrentInfoContent('');
              }}
              disabled={apiData.length === 0}
            >
              <option value="Todos os Candidatos">Selecione um Candidato...</option>
              {candidatosDisponiveisForHeatmapDropdown.map((candidato) => (
                <option key={`${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`} value={candidato.nome}>
                  {candidato.nome} ({candidato.siglaPartido})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {selectedCandidateForHeatmap === 'Todos os Candidatos' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-4">
          <p>Selecione um candidato para visualizar o heatmap de votos na Paraíba.</p>
        </div>
      )}

      {isClient && geoJsonData ? (
        <MapContainer
          center={[-7.13, -36.8245]}
          zoom={8}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={selectedCandidateForHeatmap !== 'Todos os Candidatos'}
          zoomControl={false}
          style={{ height: '500px', width: '100%', backgroundColor: 'white' }}
          className={`rounded-lg overflow-hidden ${selectedCandidateForHeatmap === 'Todos os Candidatos' ? '' : 'cursor-pointer'}`}
        >
          <MapComponentsAndLogic 
            geoJsonData={geoJsonData} 
            getStyle={getStyle} 
            selectedCandidateForHeatmap={selectedCandidateForHeatmap} 
            dataByLocation={dataByLocation} 
            infoControlRef={infoControlRef}
            currentInfoContent={currentInfoContent}
          />
        </MapContainer>
      ) : (
        <div style={{ height: '500px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      )}
    </div>
  );
};

export default HeatmapParaibaVotos;