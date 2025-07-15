"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import NoScroll from "@/components/ui/NoScroll";
import Reports from "../relatorios-estadual/Reports";
import FiltersMunicipal from "./FilterMunicipal";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";



export default function ReportsPageMunicipal() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [selectedMunicipals, setMunicipiosFiltrados] = useState<string[]>([]);


  useEffect(() => {
    if (selectedMunicipals.length > 0) {
      sessionStorage.setItem("selectedMunicipios", JSON.stringify(selectedMunicipals));
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

  const filteredData = apiData.filter((row) =>
    Object.values(row).some((value) => {
      const stringValue = value ? String(value).trim().toLowerCase() : ""; // Converte para string e remove espaços extras
      return stringValue !== "0" && stringValue !== "" && stringValue !== "não";
    })
  );
  
  return (

    <ProtectedRoute>
      <>
        <NoScroll /> {/* 🔹 Impede a rolagem vertical apenas nesta página */}

        

        <div className="w-full bg-white p-4 shadow-md text-center">
          <h1 className="text-2xl font-bold">Relatório Municipal</h1>
        </div>

      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
          {/* Sidebar à esquerda */}
          <Sidebar />

          {/* Layout Flexível: Filtros à esquerda e relatório à direita */}
          <div className="no-print flex flex-row w-full h-full p-4">
            {/* 🔹 Área dos filtros ajustada */}
            <div className="w-1/4 pr-4 h-screen sticky top-4 overflow-y-auto">
              <FiltersMunicipal data={apiData} onMunicipalChange={setMunicipiosFiltrados} />
            </div>

            {/* 🔹 Área do relatório */}
            <div className="w-3/4 pl-6 sticky top-0 h-screen overflow-auto">
              {/* Passa os dados filtrados para o Reports */}
              <Reports data={filteredData} selectedMunicipals={selectedMunicipals} />
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
