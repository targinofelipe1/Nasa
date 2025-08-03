"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Reports from "./Reports";
import FiltersEstadual from "./FiltersEstadual";
import NoScroll from "@/components/ui/NoScroll";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import BotaoImpressao from "@/components/ui/BotaoImpressao"; // Importe o botão

export default function ReportsPageEstadual() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false); // Novo estado para controlar a visibilidade do botão

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
    // Lógica para mostrar o botão quando houver dados
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
            {/* Div do filtro - visível em todas as telas */}
            <div className="w-full md:w-1/4 pr-4 h-screen sticky top-4 overflow-y-auto">
              <FiltersEstadual data={apiData} onRegionalChange={setSelectedRegionals} />
              
              {/* Adicione o botão de gerar PDF aqui */}
              {showButton && (
                <div className="mt-4 flex justify-center md:justify-start">
                  <BotaoImpressao apiData={apiData} />
                </div>
              )}
              
            </div>

            <div className="hidden md:block w-full md:w-3/4 pl-6 sticky top-0 h-screen overflow-auto">
              <Reports data={apiData} selectedRegionals={selectedRegionals} />
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}