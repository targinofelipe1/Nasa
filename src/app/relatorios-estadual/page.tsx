"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Reports from "./Reports";
import CombinedFilters from "@/components/ui/CombinedFilters"; // Importe o filtro combinado
import NoScroll from "@/components/ui/NoScroll";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import BotaoImpressao from "@/components/ui/BotaoImpressao";

export default function ReportsPageEstadual() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]); // Adicione o estado para municípios
  const [showButton, setShowButton] = useState(false);
  
  // Dados filtrados com base na seleção de regionais e municípios
  const filteredData = apiData.filter(item => {
    const isRegionalMatch = selectedRegionals.length === 0 || selectedRegionals.includes(item.RGA);
    const isMunicipalMatch = selectedMunicipalities.length === 0 || selectedMunicipalities.includes(item["Município"]);
    return isRegionalMatch && isMunicipalMatch;
  });

  useEffect(() => {
    // A lógica de sessionStorage agora precisa lidar com ambos os filtros, ou apenas a regional se for a prioridade
    if (selectedRegionals.length > 0 || selectedMunicipalities.length > 0) {
      sessionStorage.setItem("selectedFilters", JSON.stringify({
        regionals: selectedRegionals,
        municipalities: selectedMunicipalities
      }));
    } else {
      sessionStorage.removeItem("selectedFilters");
    }
  }, [selectedRegionals, selectedMunicipalities]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/sheets");
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          const headers = result.data[0];

          const formattedData = result.data.slice(1).map((row: any[]) =>
            headers.reduce((acc: any, key: string, index: number) => {
              acc[key.trim()] = row[index]?.toString().replace(/\./g, "").trim() || "";
              return acc;
            }, {})
          );
          setApiData(formattedData);

          // Restaure o estado de filtro do sessionStorage ao carregar a página
          const storedFilters = sessionStorage.getItem("selectedFilters");
          if (storedFilters) {
            const { regionals, municipalities } = JSON.parse(storedFilters);
            setSelectedRegionals(regionals);
            setSelectedMunicipalities(municipalities);
          }
        } else {
          console.error("❌ Erro ao buscar dados:", result.message);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados da API:", error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    setShowButton(apiData.length > 0);
    console.log("📌 Regionais Selecionadas:", selectedRegionals);
    console.log("📌 Municípios Selecionados:", selectedMunicipalities);
  }, [selectedRegionals, selectedMunicipalities, apiData]);

  // Função para lidar com a mudança dos filtros combinados
  const handleCombinedFilterChange = (regionals: string[], municipalities: string[]) => {
    setSelectedRegionals(regionals);
    setSelectedMunicipalities(municipalities);
  };

  return (
    <ProtectedRoute>
      <>
        <NoScroll />

        <div className="w-full bg-white p-4 shadow-md text-center">
          <h1 className="text-2xl font-bold">Relatório Estadual</h1>
        </div>

        <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
          <Sidebar />

          <div className="no-print flex flex-col md:flex-row w-full h-full p-4">
            <div className="w-full md:w-1/4 pr-4 overflow-y-auto ml-16">
              <div className="flex flex-col items-center">
                {/* Use o CombinedFilters aqui */}
                <CombinedFilters
                  data={apiData}
                  onFilterChange={handleCombinedFilterChange}
                />
              </div>
            </div>

            <div className="block w-full md:w-3/4 pl-6 pr-8 h-screen overflow-auto ml-16">
              <div className="md:flex md:justify-end md:mb-4 hidden">
                {showButton && <BotaoImpressao apiData={filteredData} />}
              </div>
              
              {/* Passe os dados já filtrados para o componente Reports */}
              <Reports data={filteredData} selectedRegionals={selectedRegionals} />
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}