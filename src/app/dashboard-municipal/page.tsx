"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";
import Filters from "./Filters";
import DashboardHeader from "../dashboard-estadual/DashboardHeader";
import Indicators from "../dashboard-estadual/Indicators";
import Charts from "../dashboard-estadual/Charts";
import Ranking from "../dashboard-estadual/Ranking";


export default function Dashboard() {
    const [data, setData] = useState<{ Município: string }[]>([]);
    const [filteredData, setFilteredData] = useState<{ Município: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // 🔹 Estado para rastrear o modal

  // Buscar dados da planilha ao carregar a página
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
        } else {
          console.error("Erro ao buscar dados:", result.message);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (selectedRegionals: string[]) => {
    if (selectedRegionals.length === 0) {
      setFilteredData(data);
    } else {
        setFilteredData(data.filter(row => selectedRegionals.includes(row.Município)));
    }
  };

  return (
    <div className="flex w-screen h-screen bg-white"> {/* Força fundo branco */}
      <Sidebar />
      <main className="flex-1 p-6 overflow-x-hidden">
        <Navbar />
        <DashboardHeader />

        {data.length > 0 && <Filters data={data} onFilterChange={handleFilterChange} />}

        {/* 🔹 Passamos a função para atualizar o estado do modal */}
        <Indicators data={filteredData} setIsModalOpen={setIsModalOpen} />
        <Charts data={filteredData}/>
        <Ranking data={filteredData} />
      </main>
    </div>
  );
}
