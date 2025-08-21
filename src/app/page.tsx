"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import useMediaQuery from "@/hooks/useMediaQuery";
import CombinedFilters from "@/components/ui/CombinedFilters";
import DashboardHeader from "./dashboard-estadual/DashboardHeader";
import Indicators from "./dashboard-estadual/Indicators";
import MapaParaibaRGA from "./map-rga/map-rga";
import Charts from "./dashboard-estadual/Charts";
import Ranking from "./dashboard-estadual/Ranking";

const rgaColors: Record<string, string> = {
  "RGA 1": "#F9C74F",
  "RGA 2": "#80B918",
  "RGA 3": "#43AA8B",
  "RGA 4": "#F8961E",
  "RGA 5": "#F9844A",
  "RGA 6": "#F94144",
  "RGA 7": "#5C4A72",
  "RGA 8": "#90BE6D",
  "RGA 9": "#4D908E",
  "RGA 10": "#F3722C",
  "RGA 11": "#F9F8F4",
  "RGA 12": "#A999C2",
  "RGA 13": "#277DA1",
  "RGA 14": "#E69C00",
};

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sheets");
        const result = await response.json();
        if (result.success && result.data.length > 1) {
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
          setError("Erro ao buscar dados ou dados vazios.");
          console.error("Erro ao buscar dados ou dados vazios:", result.message);
        }
      } catch (error) {
        setError("Erro de conexão com a API.");
        console.error("Erro ao buscar dados da API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (regionals: string[], municipalities: string[]) => {
    setSelectedRegionals(regionals);
    setSelectedMunicipalities(municipalities);
    
    let filtered = data;

    if (regionals.length > 0) {
      filtered = filtered.filter(row => regionals.includes(row.RGA));
    }

    if (municipalities.length > 0) {
      filtered = filtered.filter(row => municipalities.includes(row.Município));
    }

    setFilteredData(filtered);
  };

  const getLegendItems = () => {
    const items: { label: string; color: string }[] = [];
    
    if (selectedRegionals.length > 0) {
      selectedRegionals.forEach(rga => {
        const color = rgaColors[`RGA ${rga.replace("ª", "").trim()}`] || "#ccc";
        items.push({ label: `${rga}ª Regional`, color });
      });
    }
    
    if (selectedMunicipalities.length > 0) {
      selectedMunicipalities.forEach(municipio => {
        const municipioData = data.find(d => d.Município === municipio);
        const rga = municipioData?.RGA ? municipioData.RGA.replace("ª", "").trim() : "Desconhecido";
        const color = rgaColors[`RGA ${rga}`] || "#ccc";
        items.push({ label: municipio, color });
      });
    }

    return items;
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
        <Sidebar />
        <main className="flex-1 pr-6 pb-6 pt-6 pl-2 overflow-x-hidden">
          <Navbar />
          <DashboardHeader />

          {loading ? (
            <p className="text-center text-gray-500 text-lg p-8">Carregando dados...</p>
          ) : error ? (
            <p className="text-center text-red-500 text-lg p-8">{error}</p>
          ) : (
            <>
          <div className="flex flex-col lg:flex-row gap-6 mb-6 min-h-[360px] relative">
              <div className="flex items-start w-full lg:w-1/3">
               <div className="w-full">
                    <CombinedFilters
                      data={data}
                      onFilterChange={handleFilterChange}
                    />
                  </div>
              </div>
                {!isMobile && (
                  <div className="w-full lg:w-2/3 -ml-10 relative">
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