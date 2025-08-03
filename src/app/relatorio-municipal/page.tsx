"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import NoScroll from "@/components/ui/NoScroll";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import BotaoImpressao from "@/components/ui/BotaoImpressao"; 
import FiltersEstadual from "../relatorios-estadual/FiltersEstadual";
import Reports from "../relatorios-estadual/Reports";
import FiltersMunicipal from "./FilterMunicipal";

export default function ReportsPageEstadual() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedMunicipals, setSelectedMunicipals] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false); 

  useEffect(() => {
    if (selectedMunicipals.length > 0) {
      sessionStorage.setItem("selectedMunicipals", JSON.stringify(selectedMunicipals));
    } else {
      sessionStorage.removeItem("selectedMunicipals");
    }
  }, [selectedMunicipals]);

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
    console.log("📌 Regionais Selecionadas:", selectedMunicipals);
  }, [selectedMunicipals, apiData]);

  return (
    <ProtectedRoute>
      <>
        <NoScroll />

        <div className="w-full bg-white p-4 shadow-md text-center">
          <h1 className="text-2xl font-bold">Relatório Municipal</h1>
        </div>

        <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
          <Sidebar />

          <div className="no-print flex flex-col md:flex-row w-full h-full p-4">
            {/* Div do filtro - visível em todas as telas */}
            <div className="w-full md:w-1/4 pr-4 h-screen sticky top-4 overflow-y-auto">
              <FiltersMunicipal data={apiData} onMunicipalChange={setSelectedMunicipals} />
              
              {/* Adicione o botão de gerar PDF aqui */}
              {showButton && (
                <div className="mt-4 flex justify-center md:justify-start">
                  <BotaoImpressao apiData={apiData} />
                </div>
              )}
              
            </div>

            <div className="hidden md:block w-full md:w-3/4 pl-6 sticky top-0 h-screen overflow-auto">
              <Reports data={apiData} selectedMunicipals={selectedMunicipals}/>
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}