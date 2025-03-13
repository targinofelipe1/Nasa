"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import MapaParaiba from "./MapaParaiba";
import Filters from "./Filters";

export default function MapsPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);

  // 🔹 Busca os dados da API ao carregar a página
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/sheets"); 
        const result = await response.json();
        
        if (result.success) {
          const headers = result.data[0];
          const formattedData = result.data.slice(1).map((row: any[]) =>
            headers.reduce((acc: any, key: string, index: number) => {
              acc[key] = row[index] || "";
              return acc;
            }, {})
          );

          console.log("✅ Dados da API carregados:", formattedData);
          setApiData(formattedData);
        } else {
          console.error("❌ Erro ao buscar dados:", result.message);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados da API:", error);
      }
    }

    fetchData();
  }, []);

  // 🔹 Atualiza os municípios filtrados
  const handleFilterChange = (selectedMunicipalities: string[]) => {
    console.log("🔹 Municípios filtrados:", selectedMunicipalities);
    setFilteredMunicipalities(selectedMunicipalities);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar à esquerda */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-row w-full h-full p-4">
        {/* 🔹 Área dos filtros */}
        <div className="w-1/4 pr-4">
          <Filters data={apiData} onFilterChange={handleFilterChange} />
        </div>

        {/* 🔹 Mapa interativo */}
        <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4 text-center">Mapa Interativo de Programas da Paraíba</h1>
          {apiData.length > 0 ? (
            <MapaParaiba 
              apiData={apiData} 
              filteredMunicipalities={filteredMunicipalities} 
              setFilteredMunicipalities={setFilteredMunicipalities} 
            />
          ) : (
            <p className="text-center text-gray-500">Carregando dados do mapa...</p>
          )}
        </div>
      </div>
    </div>
  );
}
