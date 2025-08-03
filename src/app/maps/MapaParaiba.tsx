// src/app/maps/MapaParaiba.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJsonObject, Feature, Polygon } from "geojson";
import * as turf from "@turf/turf";
import { LatLngTuple } from "leaflet"; // ➡️ Importe o tipo LatLngTuple

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
  allowDragging,
}: {
  apiData: any[];
  filteredMunicipalities: string[];
  setFilteredMunicipalities: React.Dispatch<React.SetStateAction<string[]>>;
  allowDragging: boolean;
}) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const mapRef = useRef<any>(null); // ➡️ Crie a referência para o mapa
  const initialCenterRef = useRef<LatLngTuple>([-7.13, -36.8245]); // ➡️ Ref para a latitude inicial

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

  // ➡️ UseEffect para controlar o arrastar e travar o movimento vertical
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (allowDragging) {
      // Ativa o arrastar se a prop for verdadeira
      map.dragging.enable();
      
      // Armazena a latitude inicial
      const initialLat = map.getCenter().lat;

      // Adiciona um listener para o evento de arrastar
      const handleDrag = () => {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        // Se a latitude mudou, força o mapa a voltar para a latitude inicial
        if (currentCenter.lat !== initialLat) {
          map.setView([initialLat, currentCenter.lng], currentZoom, { animate: false });
        }
      };

      map.on('drag', handleDrag);

      // Função de limpeza para remover o listener
      return () => {
        map.off('drag', handleDrag);
      };
    } else {
      // Desativa o arrastar se a prop for falsa
      map.dragging.disable();
    }
  }, [allowDragging]);


  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        if (!geoJsonData || !("features" in geoJsonData)) return;
        const pontoClicado = turf.point([lng, lat]);
        const municipioEncontrado = (geoJsonData.features as Feature[]).find((feature) => {
          if (!feature.geometry || feature.geometry.type !== "Polygon") return false;
          const poligonoMunicipio = turf.polygon(feature.geometry.coordinates as Polygon["coordinates"]);
          return turf.booleanPointInPolygon(pontoClicado, poligonoMunicipio);
        });
        if (municipioEncontrado) {
          const municipioNome = municipioEncontrado.properties?.NOME || municipioEncontrado.properties?.name || "Não encontrado";
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
    if (!nomeMunicipio) return { fillColor: "gray", color: "white", weight: 1, fillOpacity: 0.7 };
    const municipioNormalizado = nomeMunicipio.trim().toUpperCase();
    const isSelected = municipioSelecionado?.toUpperCase() === municipioNormalizado;
    const isFiltered = filteredMunicipalities.includes(municipioNormalizado);
    let fillColor = "gray";
    if (isSelected) {
      fillColor = "#14b8a6";
    } else if (isFiltered) {
      fillColor = "#3b82f6";
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
          ref={mapRef}
          center={initialCenterRef.current} // ➡️ Usa a referência para o centro inicial
          zoom={8}
          minZoom={7}
          maxZoom={13}
          style={{ height: "80vh", width: "100%", backgroundColor: "white" }}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          // A propriedade 'dragging' é desnecessária aqui, pois será controlada pelo useEffect
        >
          {geoJsonData && <GeoJSON data={geoJsonData} style={getStyle} />}
          {mapReady && <ClickHandler />}
        </MapContainer>
      )}

      {municipioSelecionado && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg shadow-md border border-gray-200 z-50 bg-white/80 backdrop-blur-sm max-w-xs"
        >
          <p className="text-sm font-semibold text-center">
            Município: <span style={{ color: "#14b8a6", fontWeight: "bold" }}>{municipioSelecionado}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MapaParaiba;