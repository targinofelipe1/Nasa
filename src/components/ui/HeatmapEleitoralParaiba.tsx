'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';
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

interface MapaPorMunicipioEleitoralProps {
    apiData: any[];
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

const normalizeString = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

const MapaPorMunicipioEleitoral: React.FC<MapaPorMunicipioEleitoralProps> = ({ apiData, currentCargo, municipiosDisponiveisGlobal }) => {
    const [fullGeoJsonData, setFullGeoJsonData] = useState<GeoJsonObject | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [selectedMunicipioOnDropdown, setSelectedMunicipioOnDropdown] = useState<string>('Selecione um Município');
    const [municipioGeoJsonFeature, setMunicipioGeoJsonFeature] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
    const [selectedCandidateForHeatmap, setSelectedCandidateForHeatmap] = useState<string>('Todos os Candidatos');
    const [dataByLocation, setDataByLocation] = useState<Map<string, VotoDataAggregated>>(new Map());
    const infoControlRef = useRef<CustomInfoControl | null>(null);
    const [currentInfoContent, setCurrentInfoContent] = useState<string>('');

    const safeParseVotes = useCallback((value: any): number => {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseInt(value.replace(/\./g, ''), 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }, []);

    useEffect(() => {
        setIsClient(true);
        loadGeoJson().then(setFullGeoJsonData).catch(console.error);
    }, []);

    useEffect(() => {
        setSelectedMunicipioOnDropdown('Selecione um Município');
        setMunicipioGeoJsonFeature(null);
        setSelectedCandidateForHeatmap('Todos os Candidatos');
        setCurrentInfoContent('');
        setDataByLocation(new Map());
    }, [apiData, currentCargo]);

    useEffect(() => {
        if (selectedMunicipioOnDropdown && selectedMunicipioOnDropdown !== 'Selecione um Município' && fullGeoJsonData) {
            const normalizedSelectedMun = normalizeString(selectedMunicipioOnDropdown);
            const feature = (fullGeoJsonData as FeatureCollection).features.find(
                f => normalizeString(f.properties?.name || '') === normalizedSelectedMun
            );
            setMunicipioGeoJsonFeature(feature || null);
        } else {
            setMunicipioGeoJsonFeature(null);
        }
    }, [selectedMunicipioOnDropdown, fullGeoJsonData]);

    const candidatosDisponiveisForHeatmapDropdown = useMemo(() => {
        if (!selectedMunicipioOnDropdown || selectedMunicipioOnDropdown === 'Selecione um Município') {
            return [];
        }

        const normalizedSelectedMunicipio = normalizeString(selectedMunicipioOnDropdown);

        let filteredDataForCandidates = apiData.filter(item => 
            item.Cargo === currentCargo && 
            normalizeString(item['Município']?.trim() || '') === normalizedSelectedMunicipio
        );

        const uniqueCandidatos = new Map<string, CandidatoDropdownOption>();
        filteredDataForCandidates.forEach((item: any) => {
            const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
            const siglaPartido = item['Sigla do Partido']?.trim();
            const numeroCandidato = item['Numero do Candidato']?.trim();

            if (nomeCandidato && siglaPartido &&
                nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
                siglaPartido.toLowerCase() !== '#nulo#' && normalizeString(nomeCandidato) !== normalizeString(siglaPartido)) {
                const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
                if (!uniqueCandidatos.has(key)) {
                    uniqueCandidatos.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
                }
            }
        });
        return Array.from(uniqueCandidatos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [apiData, currentCargo, selectedMunicipioOnDropdown]);

    useEffect(() => {
        const aggregatedData = new Map<string, VotoDataAggregated>();
        
        if (selectedCandidateForHeatmap !== 'Todos os Candidatos' && 
            selectedMunicipioOnDropdown !== 'Selecione um Município' &&
            apiData.length > 0) {
            
            const targetCandidateName = selectedCandidateForHeatmap.toUpperCase();
            const normalizedTargetMunicipio = normalizeString(selectedMunicipioOnDropdown);

            const filteredDataForMunicipio = apiData.filter(item => 
                item.Cargo === currentCargo && 
                normalizeString(item['Município']?.trim() || '') === normalizedTargetMunicipio
            );

            let totalValidVotesMunicipio = 0;
            let candidateVotesMunicipio = 0;

            filteredDataForMunicipio.forEach(item => {
                const nomeVoto = item['Nome do Candidato/Voto']?.trim().toUpperCase();
                const siglaVoto = item['Sigla do Partido']?.toLowerCase();
                const votos = safeParseVotes(item['Quantidade de Votos']);

                const isLegenda = normalizeString(nomeVoto) === normalizeString(siglaVoto || '');
                const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

                if (!isBrancoOuNulo && !isLegenda) {
                    totalValidVotesMunicipio += votos;
                }
                
                if (normalizeString(nomeVoto) === normalizeString(targetCandidateName)) {
                    candidateVotesMunicipio += votos;
                }
            });

            aggregatedData.set(normalizedTargetMunicipio, {
                totalVotosCandidato: candidateVotesMunicipio,
                totalVotosValidosMunicipio: totalValidVotesMunicipio,
                nomeCandidato: targetCandidateName
            });
        }
        setDataByLocation(aggregatedData);
    }, [apiData, selectedCandidateForHeatmap, currentCargo, selectedMunicipioOnDropdown, safeParseVotes]);

    const getStyle = useCallback((feature?: Feature<Geometry, GeoJsonProperties>) => {
        if (!feature || !feature.properties || !feature.properties.name) {
            return { fillColor: '#E6954B', weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
        }
        
        const municipioNomeGeoJSON = normalizeString(feature.properties.name);
        const candidateData = dataByLocation.get(municipioNomeGeoJSON);
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

    const MapComponentsAndLogic = ({ getStyle, selectedCandidateForHeatmap, dataByLocation, infoControlRef, currentInfoContent, municipioGeoJsonFeature, fullGeoJsonData }: { 
        geoJsonToDisplay: GeoJsonObject | null;
        getStyle: (feature?: Feature<Geometry, GeoJsonProperties>) => any;
        selectedCandidateForHeatmap: string; 
        dataByLocation: Map<string, VotoDataAggregated>;
        infoControlRef: React.MutableRefObject<CustomInfoControl | null>;
        currentInfoContent: string;
        municipioGeoJsonFeature: Feature<Geometry, GeoJsonProperties> | null;
        fullGeoJsonData: GeoJsonObject | null; // Adicionado fullGeoJsonData aqui
    }) => {
        const map = useMap();
        const legendControlRef = useRef<L.Control | null>(null);
        
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
            if (infoControlRef.current) {
                map.removeControl(infoControlRef.current);
            }
            if (legendControlRef.current) {
                map.removeControl(legendControlRef.current);
            }

            const info = new InfoControl({ position: 'topleft' }); 
            info.addTo(map);
            infoControlRef.current = info as CustomInfoControl;

            const legend = new LegendControl({ position: 'bottomleft' });
            legend.addTo(map);
            legendControlRef.current = legend;

            if (infoControlRef.current) {
                infoControlRef.current.updateContent(currentInfoContent);
            }

            return () => {
                if (infoControlRef.current) { 
                    map.removeControl(infoControlRef.current);
                    infoControlRef.current = null;
                }
                if (legendControlRef.current) {
                    map.removeControl(legendControlRef.current);
                    legendControlRef.current = null;
                }
            };
        }, [map, currentInfoContent]);

        useEffect(() => {
            let geoJsonLayer: L.GeoJSON | null = null; 

            map.eachLayer(layer => {
                if ((layer as any)._geojson) {
                    map.removeLayer(layer);
                }
            });

            if (municipioGeoJsonFeature) {
                geoJsonLayer = L.geoJSON(municipioGeoJsonFeature, { 
                    style: getStyle, 
                    onEachFeature: (feature, layer) => {
                        layer.bindPopup(function (layer) { return ''; }); 
                        layer.on({
                            click: (e) => {
                                if (selectedCandidateForHeatmap === 'Todos os Candidatos') {
                                    return;
                                }
                                const municipioNomeOriginal = feature.properties?.name || 'Desconhecido';
                                const municipioNomeNormalizado = normalizeString(municipioNomeOriginal);
                                const candidateData = dataByLocation.get(municipioNomeNormalizado);
                                
                                const percentage = candidateData && candidateData.totalVotosValidosMunicipio > 0
                                                                 ? (candidateData.totalVotosCandidato / candidateData.totalVotosValidosMunicipio) * 100
                                                                 : 0;
                                const dotColor = getColor(percentage);

                                let infoHtml = `<h4 style="margin-bottom: 8px; font-weight: bold; font-size: 1.2em;">Município: ${municipioNomeOriginal}</h4>`;
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
                                if (selectedCandidateForHeatmap === 'Todos os Candidatos') return;
                                const targetLayer = e.target;
                                targetLayer.setStyle({ weight: 5, color: 'white', dashArray: '', fillOpacity: 0.7 });
                                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                    targetLayer.bringToFront();
                                }
                            },
                            mouseout: (e) => { 
                                if (selectedCandidateForHeatmap === 'Todos os Candidatos') return;
                                const targetLayer = e.target;
                                targetLayer.setStyle(getStyle(feature));
                            },
                        });
                    }
                }).addTo(map);

                const bounds = (geoJsonLayer as L.GeoJSON).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                }
            } else {
                if (fullGeoJsonData) {
                    geoJsonLayer = L.geoJSON(fullGeoJsonData, { 
                        style: {
                            fillColor: '#E6954B',
                            weight: 1,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.7
                        },
                        onEachFeature: (feature, layer) => {
                            layer.on('mouseover', () => {
                                if (infoControlRef.current) {
                                    infoControlRef.current.updateContent(
                                        `<h4 style="margin-bottom: 8px; font-weight: bold; font-size: 1.2em;">Município: ${feature.properties?.name || 'Desconhecido'}</h4>`
                                    );
                                }
                            });
                            layer.on('mouseout', () => {
                                if (infoControlRef.current) {
                                    infoControlRef.current.updateContent('');
                                }
                            });
                        }
                    }).addTo(map);

                    const bounds = (geoJsonLayer as L.GeoJSON).getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [10, 10] });
                    } else {
                        map.setView([-7.13, -36.8245], 8);
                    }
                }
                setCurrentInfoContent(''); 
            }

            return () => {
                if (geoJsonLayer) {
                    map.removeLayer(geoJsonLayer);
                }
            };
        }, [map, municipioGeoJsonFeature, getStyle, selectedCandidateForHeatmap, dataByLocation, setCurrentInfoContent, fullGeoJsonData, infoControlRef]);

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

    const sortedMunicipios = useMemo(() => {
        return [...municipiosDisponiveisGlobal].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [municipiosDisponiveisGlobal]);

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mapa Eleitoral por Município</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                
                <div>
                    <label htmlFor="municipio-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecione o Município:
                    </label>
                    <div className="relative">
                        <select
                            id="municipio-select"
                            className={apiData.length === 0 ? disabledSelectClasses : selectClasses}
                            value={selectedMunicipioOnDropdown}
                            onChange={(e) => {
                                setSelectedMunicipioOnDropdown(e.target.value);
                                setSelectedCandidateForHeatmap('Todos os Candidatos');
                                setCurrentInfoContent('');
                            }}
                            disabled={apiData.length === 0}
                        >
                            <option value="Selecione um Município">Selecione um Município...</option>
                            {sortedMunicipios.map((municipio) => (
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

                <div>
                    <label htmlFor="heatmap-candidate-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecione o Candidato:
                    </label>
                    <div className="relative">
                        <select
                            id="heatmap-candidate-select"
                            className={selectedMunicipioOnDropdown === 'Selecione um Município' || candidatosDisponiveisForHeatmapDropdown.length === 0 ? disabledSelectClasses : selectClasses}
                            value={selectedCandidateForHeatmap}
                            onChange={(e) => {
                                setSelectedCandidateForHeatmap(e.target.value);
                                setCurrentInfoContent('');
                            }}
                            disabled={selectedMunicipioOnDropdown === 'Selecione um Município' || candidatosDisponiveisForHeatmapDropdown.length === 0}
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

            {selectedMunicipioOnDropdown === 'Selecione um Município' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-4">
                    <p>Primeiro, selecione um município para começar a análise dos votos.</p>
                </div>
            )}

            {selectedMunicipioOnDropdown !== 'Selecione um Município' && selectedCandidateForHeatmap === 'Todos os Candidatos' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-4">
                    <p>Agora, selecione um candidato para visualizar a porcentagem de votos no município de {selectedMunicipioOnDropdown}.</p>
                </div>
            )}

            {isClient && fullGeoJsonData ? (
                <MapContainer
                    center={[-7.13, -36.8245]}
                    zoom={8}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    dragging={false}
                    zoomControl={false}
                    attributionControl={false}
                    style={{ height: '500px', width: '100%', backgroundColor: 'white' }}
                    className={`rounded-lg overflow-hidden ${selectedMunicipioOnDropdown === 'Selecione um Município' ? '' : 'cursor-default'}`}
                >
                    <MapComponentsAndLogic 
                        geoJsonToDisplay={municipioGeoJsonFeature}
                        getStyle={getStyle} 
                        selectedCandidateForHeatmap={selectedCandidateForHeatmap} 
                        dataByLocation={dataByLocation} 
                        infoControlRef={infoControlRef}
                        currentInfoContent={currentInfoContent}
                        municipioGeoJsonFeature={municipioGeoJsonFeature}
                        fullGeoJsonData={fullGeoJsonData}
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

export default MapaPorMunicipioEleitoral;