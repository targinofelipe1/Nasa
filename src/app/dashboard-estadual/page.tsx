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
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setSelectedRegionals(selected);

    if (selected.length === 0) {
      setFilteredData(data);
      setFilteredMunicipalities([]);
    } else {
      const filtered = data.filter(row => selected.includes(row.RGA));
      setFilteredData(filtered);
      const municipalities = filtered.map(item => item.Município).filter(Boolean);
      setFilteredMunicipalities(municipalities);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex w-screen h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Navbar />
          <DashboardHeader />

          {data.length > 0 && (
            <div className="flex flex-row justify-between gap-6 mb-6 min-h-[360px] relative">
              <div className="flex items-center justify-center w-1/3">
                <div className="w-full max-w-md">
                  <Filters data={data} onFilterChange={handleFilterChange} />
                </div>
              </div>

              <div className="w-3/3 -ml-10 relative">
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
