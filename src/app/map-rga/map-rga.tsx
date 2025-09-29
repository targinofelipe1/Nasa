// src/app/maps/map-rga/map-rga.tsx (exemplo com a prop ajustada)
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJsonObject, Feature, Polygon } from "geojson";
import * as turf from "@turf/turf";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch("/geojson/paraiba.geojson");
  return res.json();
};

const MapaParaibaRGA = ({ apiData, exibirLegenda = true }: { apiData: any[], exibirLegenda?: boolean }) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string | null>(null);
  const [rgaSelecionada, setRgaSelecionada] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);

const rgaColors: Record<string, string> = {
  "RGA 1": "#F9C74F",
  "RGA 2": "#80B918",
  "RGA 3": "#43AA8B",
  "RGA 4": "#F8961E",
  "RGA 5": "#F9844A",
  "RGA 6": "#F94144",
  "RGA 7": "#5C4A72",
  "RGA 8": "#90BE6D",
  "RGA 9": "#4D908E",
  "RGA 10": "#F3722C",
  "RGA 11": "#577590",
  "RGA 12": "#A999C2",
  "RGA 13": "#277DA1",
  "RGA 14": "#E69C00",
};


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    console.log("📊 Dados da API carregados:", apiData);
  }, [apiData]);

  useEffect(() => {
    loadGeoJson()
      .then((data) => {
        console.log("✅ GeoJSON carregado com sucesso:", data);
        setGeoJsonData(data);
      })
      .catch((err) => console.error("❌ Erro ao carregar o GeoJSON:", err));
  }, []);

  const normalizarRGA = (rga: string) => {
    return `RGA ${rga.replace("ª", "").trim()}`;
  };

  const removerAcentos = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const getStyle = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name || feature.properties?.municipio;
    if (!nomeMunicipio) {
      console.warn("⚠ Município sem nome no GeoJSON:", feature);
      return { fillColor: "gray", color: "white", weight: 1, fillOpacity: 0.7 };
    }

    const municipioNormalizado = removerAcentos(nomeMunicipio.trim().toUpperCase());
    const municipioData = apiData.find(d => removerAcentos(d.Município.toUpperCase()) === municipioNormalizado);
    const rga = municipioData?.RGA ? normalizarRGA(municipioData.RGA) : "Desconhecido";
    const fillColor: string = rgaColors[rga] ?? "gray";

    if (!rgaColors[rga]) {
      console.warn(`⚠ RGA ${rga} não encontrada no rgaColors!`);
    }

    return {
      fillColor: fillColor,
      color: "white",
      weight: 1.5,
      fillOpacity: 0.8,
    };
  };

  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        console.log(`🖱️ Clique detectado: Latitude ${lat}, Longitude ${lng}`);

        if (!geoJsonData || !("features" in geoJsonData)) return;

        const pontoClicado = turf.point([lng, lat]);

        const municipioEncontrado = (geoJsonData.features as Feature[]).find((feature) => {
          if (!feature.geometry || feature.geometry.type !== "Polygon") return false;

          const nomeMunicipio = feature.properties?.NOME || feature.properties?.name || "Desconhecido";
          const poligonoMunicipio = turf.polygon(feature.geometry.coordinates as Polygon["coordinates"]);
          return turf.booleanPointInPolygon(pontoClicado, poligonoMunicipio);
        });

        if (municipioEncontrado) {
          const municipioNome = municipioEncontrado.properties?.NOME || municipioEncontrado.properties?.name || "Não encontrado";
          setMunicipioSelecionado(municipioNome);

          const municipioData = apiData.find(d => removerAcentos(d.Município.toUpperCase()) === removerAcentos(municipioNome.toUpperCase()));
          const rga = municipioData?.RGA ? normalizarRGA(municipioData.RGA) : "Desconhecido";
          setRgaSelecionada(rga);

          console.log(`📍 Município selecionado: ${municipioNome}, RGA: ${rga}`);
        } else {
          console.log("❌ Nenhum município encontrado para esse clique.");
        }
      },
    });

    return null;
  };

  const LegendaRGA = () => {
    return (
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border border-gray-200 z-50">
        <h3 className="text-sm font-semibold mb-2">Regionais (RGA)</h3>
        <ul>
          {Object.entries(rgaColors).map(([rga, color]) => {
            const numeroRGA = rga.replace("RGA ", ""); // Remove "RGA " para obter apenas o número
            return (
              <li key={rga} className="flex items-center mb-1">
                <span className="w-4 h-4 inline-block rounded mr-2" style={{ backgroundColor: color }}></span>
                <span className="text-xs">{`${numeroRGA}ª Regional`}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="relative flex justify-center items-center bg-white">
      {isClient && geoJsonData && (
        <MapContainer
          center={[-7.13, -36.8245]}
          zoom={8}
          minZoom={7}
          maxZoom={13}
          style={{ height: "80vh", width: "100%", backgroundColor: "white" }}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          dragging={false}
        >
          {geoJsonData && <GeoJSON data={geoJsonData} style={getStyle} />}
          {mapReady && <ClickHandler />}
        </MapContainer>
      )}

      {municipioSelecionado && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-3 border border-gray-200 z-50">
          <p className="text-lg font-semibold flex items-center">
            <span className="w-4 h-4 inline-block rounded mr-2" style={{ backgroundColor: rgaColors[rgaSelecionada ?? "Desconhecido"] ?? "gray" }}></span>
            Município: <span style={{ color: rgaColors[rgaSelecionada ?? "Desconhecido"] ?? "#14b8a6", fontWeight: "bold" }}>{municipioSelecionado}</span>
          </p>
        </div>
      )}

      {exibirLegenda && <LegendaRGA />}
    </div>
  );
};

export default MapaParaibaRGA;