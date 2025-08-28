// app/auditoria/page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";

import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Componentes de auditoria
import AuditLogTable, { TableData } from "@/components/ui/AuditLogTable";
import ViewDetailsModal from "@/components/ui/ViewDetailsModal";

const programDisplayNames: Record<string, string> = {
  auditoria: "Log de Auditoria",
  "bolsa-familia": "Bolsa Família",
  "cadastro-unico": "Cadastro Único",
  "protecao-basica": "Proteção Social Básica",
  "seguranca-alimentar": "Segurança Alimentar",
  "casa-da-cidadania-e-sine": "Casa da Cidadania e SINE",
  "bpc-rmv": "BPC/RMV",
  saude: "Saúde",
};

const columnDisplayNames: Record<string, string> = {
  timestamp: "Data e Hora de Atualização",
  userId: "Usuário",
  programa: "Programa",
  municipio: "Município",
};

export default function AuditoriaPage() {
  const [data, setData] = useState<TableData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [municipioFilter, setMunicipioFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogEntry, setSelectedLogEntry] = useState<TableData | null>(null);

  const programName = "auditoria";

  const getUserName = (id: string): string => {
    const user = users.find((u) => u.id === id);
    return user ? user.fullName : id;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sheets?programa=${programName}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do log de auditoria.");
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const filteredHeaders = Object.keys(result.data[0]).filter(
          (key) => key !== "campo"
        );
        setHeaders(filteredHeaders);
        setData(result.data);
      } else {
        setHeaders([]);
        setData([]);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar o log de auditoria.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const { data } = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao carregar a lista de usuários:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAllUsers();
  }, []);

  if (!programDisplayNames[programName]) {
    notFound();
  }

  const filteredData = data.filter((row) => {
    const matchesMunicipio = String(row["municipio"])
      .toLowerCase()
      .includes(municipioFilter.toLowerCase());
    const userName = getUserName(String(row["userId"]));
    const matchesUserName = userName
      .toLowerCase()
      .includes(userIdFilter.toLowerCase());

    return matchesMunicipio && matchesUserName;
  });

  const handleClearFilters = () => {
    setMunicipioFilter("");
    setUserIdFilter("");
  };

  const handleOpenModal = (logEntry: TableData) => {
    setSelectedLogEntry(logEntry);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gerenciamento de Ações</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Filtrar por município..."
                    value={municipioFilter}
                    onChange={(e) => {
                      setMunicipioFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <Input
                    type="text"
                    placeholder="Filtrar por usuário..."
                    value={userIdFilter}
                    onChange={(e) => {
                      setUserIdFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto shrink-0"
                >
                  <X className="w-4 h-4 mr-2" /> Limpar Filtros
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data.length > 0 ? (
                <>
                  <div className="flex justify-between items-center my-4">
                    <span className="font-semibold text-gray-700">
                      Total: {filteredData.length} registros
                    </span>
                  </div>

                  <AuditLogTable
                    headers={headers}
                    currentItems={currentItems}
                    columnDisplayNames={columnDisplayNames}
                    programDisplayNames={programDisplayNames}
                    getUserName={getUserName}
                    handleOpenModal={handleOpenModal}
                  />

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">
                  Nenhum dado encontrado para este programa.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <ViewDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        logEntry={selectedLogEntry}
      />
    </ProtectedRoute>
  );
}
