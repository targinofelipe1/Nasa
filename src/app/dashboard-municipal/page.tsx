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

export default function Dashboard() {
  const [data, setData] = useState<{ Município: string }[]>([]);
  const [filteredData, setFilteredData] = useState<{ Município: string }[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
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

  const handleFilterChange = (selectedMunicipalities: string[]) => {
    if (selectedMunicipalities.length === 0) {
      setFilteredData(data);
      setFilteredMunicipalities([]);
    } else {
      const filtered = data.filter((row) => selectedMunicipalities.includes(row.Município));
      setFilteredData(filtered);
      setFilteredMunicipalities(selectedMunicipalities);
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
            <div className="flex flex-row justify-between gap-6 mb-6 min-h-[360px]">
              <div className="flex items-center justify-center w-1/3">
                <div className="w-full max-w-md">
                  <Filters data={data} onFilterChange={handleFilterChange} />
                </div>
              </div>

              <div className="w-3/3 -ml-10">
                <MapaParaiba
                  apiData={data}
                  filteredMunicipalities={filteredMunicipalities}
                  setFilteredMunicipalities={setFilteredMunicipalities}
                />
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
