// src/app/maps/page.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import MapaParaiba from "./MapaParaiba";
import Filters from "./Filters";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import useMediaQuery from "@/hooks/useMediaQuery";

export default function MapsPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/sheets");
        const result = await response.json();
        
        if (result.success && result.data.length > 1) {
          const headers = result.data[0];
          const formattedData = result.data.slice(1).map((row: any[]) =>
            headers.reduce((acc: any, key: string, index: number) => {
              acc[key] = row[index] || "";
              return acc;
            }, {})
          );
          setApiData(formattedData);
        } else {
          setError("Erro ao buscar dados ou dados vazios.");
        }
      } catch (error) {
        setError("Erro de conexão com a API.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFilterChange = (selectedMunicipalities: string[]) => {
    setFilteredMunicipalities(selectedMunicipalities);
  };
  
  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
        {/* Lembre-se de que sua Sidebar deve ter um z-index maior, como z-[20] */}
        <Sidebar />
        
        {/* ➡️ Container principal com z-index baixo para ficar atrás da sidebar */}
        <div className="flex flex-col lg:flex-row w-full h-full p-4 relative z-10">
          <div className="w-full lg:w-1/4 lg:pr-4">
            <Filters data={apiData} onFilterChange={handleFilterChange} />
          </div>

          <div className="flex-1 mt-4 lg:mt-0">
            <h1 className="text-2xl font-bold mb-4 text-center">Mapa Interativo de Programas da Paraíba</h1>
            {loading ? (
              <p className="text-center text-gray-500">Carregando dados do mapa...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : apiData.length > 0 ? (
              <MapaParaiba 
                apiData={apiData} 
                filteredMunicipalities={filteredMunicipalities} 
                setFilteredMunicipalities={setFilteredMunicipalities} 
                allowDragging={isMobile}
              />
            ) : (
              <p className="text-center text-gray-500">Nenhum dado disponível.</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}