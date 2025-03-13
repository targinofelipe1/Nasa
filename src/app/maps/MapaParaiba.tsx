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

          const nomeMunicipio = feature.properties?.NOME || feature.properties?.name || "Desconhecido";

          const poligonoMunicipio = turf.polygon(feature.geometry.coordinates as Polygon["coordinates"]);
          return turf.booleanPointInPolygon(pontoClicado, poligonoMunicipio);
        });

        if (municipioEncontrado) {
          const municipioNome = municipioEncontrado.properties?.NOME || municipioEncontrado.properties?.name || "Não encontrado";

          setMunicipioSelecionado(municipioNome);

          console.log(`📍 Município selecionado: ${municipioNome}`);

          if (filteredMunicipalities.length > 0) {
            // 🔹 Se há filtros ativos, adiciona ou remove normalmente
            setFilteredMunicipalities((prev) => {
              const isFiltered = apiData.some(d => d.Município.toUpperCase() === municipioNome.toUpperCase());
              return isFiltered
                ? [...new Set([...prev, municipioNome.toUpperCase()])]
                : prev.filter(m => apiData.some(d => d.Município.toUpperCase() === m));
            });
          } else {
            // 🔹 Se NÃO há filtros ativos, reseta qualquer seleção anterior
            setMunicipioSelecionado(municipioNome);
            setFilteredMunicipalities([]); // Garante que apenas um município fica ativo
          }
          
          
          
        } else {
          console.log("❌ Nenhum município encontrado para esse clique.");
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
    const isFiltered = filteredMunicipalities.includes(municipioNormalizado) && !isSelected;


   let fillColor = "gray";

   if (isSelected) {
     fillColor = "#14b8a6"; // Município selecionado manualmente
   } else if (isFiltered) {
     fillColor = "#3b82f6"; // Município dentro dos filtros ativos
   }



    return {
      fillColor: fillColor,
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
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-3 border border-gray-200">
          <p className="text-lg font-semibold">
            Município: <span style={{ color: "#14b8a6", fontWeight: "bold" }}>{municipioSelecionado}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MapaParaiba;
