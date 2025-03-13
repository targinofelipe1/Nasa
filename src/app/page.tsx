"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import MapaParaibaRGA from "./map-rga/map-rga";
import RegionalIndicators from "./map-rga/indicadores";

export default function MapsPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // ✅ Teste se os dados da API e do RGA estão corretos
  useEffect(() => {
    console.log(
      "📊 Dados da API carregados (RGA):",
      apiData.map((d) => d.RGA)
    );
  }, [apiData]);

  return (
    <div className="flex h-screen">
      {/* Sidebar à esquerda */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-col w-full h-full p-4">
        {/* 🔹 Mapa interativo */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Mapa Interativo das Regionais da Paraíba
          </h1>
          {apiData.length > 0 ? (
            <MapaParaibaRGA apiData={apiData} />
          ) : (
            <p className="text-center text-gray-500">
              Carregando dados do mapa...
            </p>
          )}
        </div>

        {/* 🔹 Indicadores Regionais abaixo do mapa */}
        <div className="mt-6">
          {apiData.length > 0 ? (
            <RegionalIndicators
              data={apiData}
              setIsModalOpen={setIsModalOpen}
            />
          ) : (
            <p className="text-center text-gray-500">
              Carregando indicadores regionais...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
