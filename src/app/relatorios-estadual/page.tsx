"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Reports from "./Reports";
import FiltersEstadual from "./FiltersEstadual";
import NoScroll from "@/components/ui/NoScroll";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import BotaoImpressao from "@/components/ui/BotaoImpressao";

export default function ReportsPageEstadual() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (selectedRegionals.length > 0) {
      sessionStorage.setItem("selectedRegionals", JSON.stringify(selectedRegionals));
    } else {
      sessionStorage.removeItem("selectedRegionals");
    }
  }, [selectedRegionals]);

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

  useEffect(() => {
    if (apiData.length > 0) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
    console.log("📌 Regionais Selecionadas:", selectedRegionals);
  }, [selectedRegionals, apiData]);

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
            {/* Contêiner de filtros - Agora também com ml-16 */}
            <div className="w-full md:w-1/4 pr-4 overflow-y-auto ml-16">
              <div className="flex flex-col items-center">
                <FiltersEstadual data={apiData} onRegionalChange={setSelectedRegionals} />
              </div>
            </div>

            {/* Contêiner de relatórios - visível em todas as telas */}
            <div className="block w-full md:w-3/4 pl-6 pr-8 h-screen overflow-auto ml-16">
              {/* Botão de impressão alinhado à direita em telas grandes */}
              <div className="md:flex md:justify-end md:mb-4 hidden">
                {showButton && <BotaoImpressao apiData={apiData} />}
              </div>
              
              <Reports data={apiData} selectedRegionals={selectedRegionals} />
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}