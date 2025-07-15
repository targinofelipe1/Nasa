"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Reports from "./Reports";
import FiltersEstadual from "./FiltersEstadual";
import NoScroll from "@/components/ui/NoScroll";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";

export default function ReportsPageEstadual() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);


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
    console.log("📌 Regionais Selecionadas:", selectedRegionals);
  }, [selectedRegionals]);

  return (
    <ProtectedRoute>
      <>
        <NoScroll /> 


        <div className="w-full bg-white p-4 shadow-md text-center">
          <h1 className="text-2xl font-bold">Relatório Estadual</h1>
        </div>

      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
          <Sidebar />

          <div className="no-print flex flex-row w-full h-full p-4">
            <div className="w-1/4 pr-4 h-screen sticky top-4 overflow-y-auto">
                <FiltersEstadual data={apiData} onRegionalChange={setSelectedRegionals} />
            </div>

            <div className="w-3/4 pl-6 sticky top-0 h-screen overflow-auto">
                <Reports data={apiData} selectedRegionals={selectedRegionals} />
                
            </div>


          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
