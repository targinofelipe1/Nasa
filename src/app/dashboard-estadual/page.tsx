// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";
import DashboardHeader from "./DashboardHeader";
import Filters from "./Filters";
import Indicators from "./Indicators";
import Charts from "./Charts";
import Ranking from "./Ranking";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import MapaParaibaRGA from "../map-rga/map-rga";
import useMediaQuery from "@/hooks/useMediaQuery";

const rgaColors: Record<string, string> = {
  "RGA 1": "#fff205",
  "RGA 2": "#90c63d",
  "RGA 3": "#72cef8",
  "RGA 4": "#ffa64f",
  "RGA 5": "#ffc901",
  "RGA 6": "#fbc2d8",
  "RGA 7": "#e89da4",
  "RGA 8": "#31b74a",
  "RGA 9": "#69c3c0",
  "RGA 10": "#fa8145",
  "RGA 11": "#fff4a0",
  "RGA 12": "#b68cc4",
  "RGA 13": "#028ad6",
  "RGA 14": "#d3a045",
};

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // ➡️ Adiciona estado de carregamento
  const [error, setError] = useState<string | null>(null); // ➡️ Adiciona estado de erro
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sheets");
        const result = await response.json();
        if (result.success && result.data.length > 1) { // ➡️ Verifica se há dados
          const headers = result.data[0];
          const formattedData = result.data.slice(1).map((row: any[]) =>
            headers.reduce((acc: any, key: string, index: number) => {
              acc[key] = row[index] || "";
              return acc;
            }, {})
          );
          setData(formattedData);
          setFilteredData(formattedData);
        } else {
          setError("Erro ao buscar dados ou dados vazios."); // ➡️ Define mensagem de erro
          console.error("Erro ao buscar dados ou dados vazios:", result.message);
        }
      } catch (error) {
        setError("Erro de conexão com a API."); // ➡️ Define mensagem de erro
        console.error("Erro ao buscar dados da API:", error);
      } finally {
        setLoading(false); // ➡️ Finaliza o carregamento
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (selected: string[]) => {
    setSelectedRegionals(selected);

    if (selected.length === 0) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(row => selected.includes(row.RGA));
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

          {/* ➡️ Exibe mensagem de carregamento ou erro */}
          {loading ? (
            <p className="text-center text-gray-500 text-lg p-8">Carregando dados...</p>
          ) : error ? (
            <p className="text-center text-red-500 text-lg p-8">{error}</p>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6 min-h-[360px] relative">
                <div className="flex items-center justify-center w-full lg:w-1/3">
                  <div className="w-full max-w-md">
                    {/* ➡️ Passa selectedRegionals e data para o filtro */}
                    <Filters 
                      data={data} 
                      onFilterChange={handleFilterChange} 
                      selectedRegionals={selectedRegionals}
                    />
                  </div>
                </div>
                {!isMobile && (
                  <div className="w-full lg:w-2/3 -ml-10 relative">
                    {selectedRegionals.length >= 2 && (
                      <div className="absolute top-2 right-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 z-50">
                        <h3 className="text-sm font-bold mb-2">Regionais</h3>
                        <ul className="space-y-1">
                          {selectedRegionals.map((rga) => {
                            const cor = rgaColors[`RGA ${rga.replace("ª", "").trim()}`] || "#ccc";
                            return (
                              <li key={rga} className="flex items-center space-x-2">
                                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: cor }}></span>
                                <span className="text-xs">{rga} Regional</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <MapaParaibaRGA apiData={filteredData} exibirLegenda={false} />
                  </div>
                )}
              </div>
              <Indicators data={filteredData} setIsModalOpen={setIsModalOpen} />
              <Charts data={filteredData} />
              <Ranking data={filteredData} />
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}