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

const MapaParaiba = ({
  apiData,
  filteredMunicipalities,
  setFilteredMunicipalities,
}: {
  apiData: any[];
  filteredMunicipalities: string[];
  setFilteredMunicipalities: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setMapReady(true);
  }, []);
  

  useEffect(() => {
    loadGeoJson()
      .then((data) => {
        console.log("✅ GeoJSON carregado com sucesso:", data);
        setGeoJsonData(data);
      })
      .catch((err) => console.error("❌ Erro ao carregar o GeoJSON:", err));
  }, []);

  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        console.log(`🖱️ Clique detectado: Latitude ${lat}, Longitude ${lng}`);
  
        if (!geoJsonData || !("features" in geoJsonData)) return;
  
        const pontoClicado = turf.point([lng, lat]);
  
        const municipioEncontrado = (geoJsonData.features as Feature[]).find((feature) => {
          if (!feature.geometry || feature.geometry.type !== "Polygon") return false;
          const poligonoMunicipio = turf.polygon(feature.geometry.coordinates as Polygon["coordinates"]);
          return turf.booleanPointInPolygon(pontoClicado, poligonoMunicipio);
        });
  
        if (municipioEncontrado) {
          const municipioNome = municipioEncontrado.properties?.NOME || municipioEncontrado.properties?.name || "Não encontrado";
          // Alterna a seleção (se já está selecionado, deseleciona)
          setMunicipioSelecionado(prev => 
            prev?.toUpperCase() === municipioNome.toUpperCase() ? null : municipioNome
          );
        }
      },
    });
  
    return null;
  };

  const getStyle = (feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name || feature.properties?.municipio;
    if (!nomeMunicipio) {
      console.warn("⚠ Município sem nome no GeoJSON:", feature);
      return { fillColor: "gray", color: "white", weight: 1, fillOpacity: 0.7 };
    }
  
    const municipioNormalizado = nomeMunicipio.trim().toUpperCase();
    const isSelected = municipioSelecionado?.toUpperCase() === municipioNormalizado;
    const isFiltered = filteredMunicipalities.includes(municipioNormalizado);
  
    let fillColor = "gray"; // Cor padrão para municípios sem programa
  
    if (isSelected) {
      fillColor = "#14b8a6"; // Verde para selecionado (independente de ter programa)
    } else if (isFiltered) {
      fillColor = "#3b82f6"; // Azul para municípios com programa
    }
  
    return {
      fillColor,
      color: "white",
      weight: 1.5,
      fillOpacity: 0.8,
    };
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
        <div
        className="absolute top-4 bg-white p-3 rounded-lg shadow-md border border-gray-200 z-50"
        style={{ right: "120px" }}
      >      
          <p className="text-lg font-semibold">
            Município: <span style={{ color: "#14b8a6", fontWeight: "bold" }}>{municipioSelecionado}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MapaParaiba;
