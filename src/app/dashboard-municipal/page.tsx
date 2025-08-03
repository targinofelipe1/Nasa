// src/app/dashboard-municipal/page.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";
import Filters from "./Filters";
import DashboardHeader from "../dashboard-estadual/DashboardHeader";
import Indicators from "../dashboard-estadual/Indicators";
import Charts from "../dashboard-estadual/Charts";
import Ranking from "../dashboard-estadual/Ranking";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import MapaParaiba from "../maps/MapaParaiba";
import useMediaQuery from "@/hooks/useMediaQuery"; // ➡️ Importe o hook

export default function Dashboard() {
  const [data, setData] = useState<{ Município: string }[]>([]);
  const [filteredData, setFilteredData] = useState<{ Município: string }[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)"); // ➡️ Usa o hook para detectar a tela

  useEffect(() => {
    const fetchData = async () => {
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
          setData(formattedData);
          setFilteredData(formattedData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (selected: string[]) => {
    setSelectedMunicipalities(selected);
    if (selected.length === 0) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) => selected.includes(row.Município));
      setFilteredData(filtered);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
        <Sidebar />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Navbar />
          <DashboardHeader />

          {data.length > 0 && (
            // ➡️ Ajusta o layout para mobile e desktop
            <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6 min-h-[360px]">
              {/* Filtro ocupa a largura total em mobile e 1/3 em desktop */}
              <div className="flex items-center justify-center w-full lg:w-1/3">
                <div className="w-full max-w-md">
                  <Filters
                    data={data}
                    onFilterChange={handleFilterChange}
                    selectedMunicipalities={selectedMunicipalities}
                  />
                </div>
              </div>

              {/* ➡️ Renderiza o mapa APENAS se NÃO for mobile */}
              {!isMobile && (
                <div className="w-full lg:w-2/3 -ml-10">
                  <MapaParaiba
                    apiData={data}
                    filteredMunicipalities={selectedMunicipalities}
                    setFilteredMunicipalities={setSelectedMunicipalities}
                  />
                </div>
              )}
            </div>
          )}

          <Indicators data={filteredData} setIsModalOpen={setIsModalOpen} />
          <Charts data={filteredData} />
          <Ranking data={filteredData} />
        </main>
      </div>
    </ProtectedRoute>
  );
}