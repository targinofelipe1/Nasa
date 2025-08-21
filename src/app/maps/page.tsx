// src/app/maps/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/ui/Sidebar";
import MapaParaiba from "./MapaParaiba";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import useMediaQuery from "@/hooks/useMediaQuery";
import Filters from "./Filters";
import ProgramIndicators from "./ProgramIndicators";
import CitiesModal from "./CitiesModal";

export default function MapsPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProgramOptions, setSelectedProgramOptions] = useState<{ value: string; label: string }[]>([]);

  // ➡️ Estado para controlar a visibilidade e o conteúdo do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    programName: '',
    municipalities: [] as string[],
  });

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function fetchData() {
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
          setApiData(formattedData);
        } else {
          setError("Erro ao buscar dados ou dados vazios.");
        }
      } catch (error) {
        setError("Erro de conexão com a API.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFilterChange = useCallback((selectedData: { selectedPrograms: any[], municipalities: string[] }) => {
    setFilteredMunicipalities(selectedData.municipalities);
    setSelectedProgramOptions(selectedData.selectedPrograms);
  }, []);

  // ➡️ Funções para abrir e fechar o modal, que serão passadas como props
  const openModal = useCallback((programName: string, municipalities: string[]) => {
    setModalContent({ programName, municipalities });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);


  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>
        <Sidebar />
        
        <div className="flex flex-col lg:flex-row w-full h-full p-4 relative">
          
          <div className="w-full lg:w-1/4 lg:pr-4 flex flex-col space-y-4">
            <Filters data={apiData} onFilterChange={handleFilterChange} />
            <ProgramIndicators 
              programs={selectedProgramOptions} 
              apiData={apiData} 
              onOpenModal={openModal} // ➡️ Passando a função para abrir o modal
            />
          </div>

          <div className="flex-1 mt-4 lg:mt-0 flex flex-col">
            <h1 className="text-2xl font-bold mb-4 text-center">Mapa Interativo de Programas da Paraíba</h1>
            
            <div className="flex-1">
              {loading ? (
                <p className="text-center text-gray-500">Carregando dados do mapa...</p>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : apiData.length > 0 && !isModalOpen ? ( // ➡️ O mapa só é exibido se o modal NÃO estiver aberto
                <MapaParaiba 
                  apiData={apiData} 
                  filteredMunicipalities={filteredMunicipalities} 
                  setFilteredMunicipalities={setFilteredMunicipalities} 
                  allowDragging={isMobile}
                />
              ) : (
                <p className="text-center text-gray-500">Nenhum dado disponível.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <CitiesModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        programName={modalContent.programName} 
        municipalities={modalContent.municipalities}
      />
    </ProtectedRoute>
  );
}