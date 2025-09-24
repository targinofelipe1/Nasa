"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { notFound, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  SquarePen,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import UpdateProgramModal from "@/components/ui/UpdateProgramModal";
import { useUser } from "@clerk/nextjs";
import UpdateOdeModal from "@/components/ui/UpdateOdeModal";

export interface TableData {
  [key: string]: any;
}

// Nome que vai aparecer no título
const programId = "ode";
const programTitle = "ODE - Obras, Serviços e Programas";
const screenId = "ode_list"; // ou "ode" se quiser unificar


// Display amigável para colunas
const columnDisplayNames: Record<string, string> = {
  NOME: "Nome",
  "Setor de Trabalho": "Setor",
  Região: "Região",
  Município: "Município",
  Descrição: "Descrição",
  Outro: "Outro",
  Obra: "Obra",
  Serviço: "Serviço",
  "Programa/Projeto/Entidade": "Programa",
  Ação: "Ação",
  "Quantidade de Benefícios/Beneficiários": "Qtd Benefícios",
  Status: "Status",
  Ano: "Ano",
  Valor: "Valor",
  "Fonte de Recurso": "Fonte",
};

// Abas para organizar colunas
const tabGroups = {
  Identificação: ["NOME", "Setor de Trabalho", "Região", "Município"],
  Detalhes: ["Descrição", "Outro", "Obra", "Serviço"],
  Programa: ["Programa/Projeto/Entidade", "Ação"],
  Execução: [
    "Quantidade de Benefícios/Beneficiários",
    "Status",
    "Ano",
    "Valor",
    "Fonte de Recurso",
  ],
};

export default function OdeListPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [activeTab, setActiveTab] = useState<keyof typeof tabGroups>("Identificação");
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const redirectedRef = useRef(false);


  const toastShownRef = useRef(false);

  const itemsPerPage = 5;

  // Busca dados na API do ODE
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ode?programa=ode`);
      if (!response.ok) throw new Error("Erro ao buscar dados do ODE.");
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados da planilha ODE.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) fetchData();
  }, [isSignedIn]);

  const handleOpenUpdateModal = (rowData: TableData) => {
    setSelectedRow(rowData);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setSelectedRow(null);
    setIsUpdateModalOpen(false);
  };

  if (!programTitle) {
    notFound();
  }

  // Filtro por município
  const filteredData = useMemo(() => {
    const term = municipioFilter.toLowerCase();
    return data.filter((row) =>
      String(row["Município"] ?? "").toLowerCase().includes(term)
    );
  }, [data, municipioFilter]);

  useEffect(() => {
  if (!isLoaded || !isSignedIn || !user) return;

  const verify = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, {
        cache: "no-store",
      });
      const json = await res.json();

      const allowed = Array.isArray(json?.allowedTabs)
        ? json.allowedTabs.includes(screenId)
        : false;


      setHasPermission(allowed);

      if (!allowed) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.error("Acesso negado: você não possui permissão!");
        }
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          router.push("/");
        }
      }
    } catch (e) {
      console.error("Falha ao verificar permissões:", e);
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast.error("Erro ao verificar permissões.");
      }
      router.push("/");
    } finally {
      setIsVerifying(false);
    }
  };

  verify();
}, [isLoaded, isSignedIn, user, router]);


  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const currentHeaders = tabGroups[activeTab] ?? [];

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (!isLoaded || isVerifying) {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

if (!hasPermission) {
  return null; // já redirecionou no useEffect
}

  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{programTitle}</h1>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data.length > 0 ? (
              <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex border-b border-gray-200">
                    {Object.keys(tabGroups).map((tabName) => (
                      <button
                        key={tabName}
                        onClick={() => {
                          setActiveTab(tabName as keyof typeof tabGroups);
                          setCurrentPage(1);
                        }}
                        className={`-mb-px mr-1 px-4 py-2 text-sm font-medium ${
                          activeTab === tabName
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tabName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por município..."
                    value={municipioFilter}
                    onChange={(e) => {
                      setMunicipioFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Tabela */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {currentHeaders.map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {columnDisplayNames[key] || key}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {currentHeaders.map((key, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              key === "Município"
                                ? "font-semibold"
                                : "text-gray-900"
                            }`}
                          >
                            {String(row[key] ?? "")}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenUpdateModal(row)}
                          >
                            <SquarePen className="h-4 w-4 text-gray-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginação */}
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Nenhum dado encontrado para ODE.
              </p>
            )}
          </div>
        </main>
      </div>

      {selectedRow && (
        <Dialog open={isUpdateModalOpen} onOpenChange={handleCloseUpdateModal}>
          <DialogContent>
            <DialogHeader />
            <UpdateOdeModal
            rowData={selectedRow}
            rowIndex={data.indexOf(selectedRow)}
            onUpdate={fetchData}
            onClose={handleCloseUpdateModal}
            activeTab={activeTab}
            tabGroups={tabGroups}
            />
          </DialogContent>
        </Dialog>
      )}
    </ProtectedRoute>
  );
}
