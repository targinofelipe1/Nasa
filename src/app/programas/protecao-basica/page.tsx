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

export interface TableData {
  [key: string]: any;
}

const programDisplayNames: Record<string, string> = {
  "protecao-basica": "Proteção Social Básica",
};

const columnDisplayNames: Record<string, string> = {
  Município: "Município",
  "Proteção Social Básica - Unidade de CRAS": "Unidade de CRAS",
  "Proteção Social Básica - Primeira Infância no SUAS":
    "Primeira Infância no SUAS",
  "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe":
    "Órfãos do Programa Paraíba que Acolhe",
  "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe (valor investido em 2024/2025)":
    "Valor investido (Órfãos)",
  "Proteção Social Básica - Acessuas Trabalho": "Acessuas Trabalho",
  "Proteção Social Básica - Residenciais Cidade Madura":
    "Residenciais Cidade Madura",
  "Proteção Social Básica - Residenciais Cidade Madura (valor investido em 2025)":
    "Valor investido (Cidade Madura)",
  "Proteção Social Básica - Centros Sociais Urbanos - CSUs":
    "Centros Sociais Urbanos - CSUs",
  "Proteção Social Básica -  Centros Sociais Urbanos - CSUs (valor investido em 2025)":
    "Valor investido (Centros Sociais Urbanos - CSUs)",
  "Proteção Social Básica - Centros de Convivência":
    "Centros de Convivência",
};

const tabGroups = {
  CRAS: [
    "Município",
    "Proteção Social Básica - Unidade de CRAS",
  ],
  "Primeira Infância": [
    "Município",
    "Proteção Social Básica - Primeira Infância no SUAS",
  ],
  Órfãos: [
    "Município",
    "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe",
    "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe (valor investido em 2024/2025)",
  ],
  "Acessuas Trabalho": [
    "Município",
    "Proteção Social Básica - Acessuas Trabalho",
  ],
  "Cidade Madura": [
    "Município",
    "Proteção Social Básica - Residenciais Cidade Madura",
    "Proteção Social Básica - Residenciais Cidade Madura (valor investido em 2025)",
  ],
  CSUs: [
    "Município",
    "Proteção Social Básica - Centros Sociais Urbanos - CSUs",
    "Proteção Social Básica -  Centros Sociais Urbanos - CSUs (valor investido em 2025)",
  ],
  "Centros de Convivência": [
    "Município",
    "Proteção Social Básica - Centros de Convivência",
  ],
};

const programId = "protecao-basica";

export default function ProtecaoBasicaPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [activeTab, setActiveTab] = useState<keyof typeof tabGroups>("CRAS");
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);

  const toastShownRef = useRef(false);
  const redirectedRef = useRef(false);

  const itemsPerPage = 5;
  const programTitle = programDisplayNames[programId] || "Programa";

  // Verificação de permissões
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        setIsVerifying(true);

        const localAllowed =
          (user.unsafeMetadata as { allowedTabs?: string[] } | undefined)
            ?.allowedTabs || [];

        const res = await fetch(`/api/users/${user.id}/permissions`, {
          cache: "no-store",
        });
        const json = await res.json();
        const serverAllowed: string[] = Array.isArray(json?.allowedTabs)
          ? json.allowedTabs
          : [];

        const allAllowed = [...new Set([...localAllowed, ...serverAllowed])];
        setAllowedTabs(allAllowed);

        const userHasAnyPermission = Object.keys(tabGroups).some((tabName) => {
          const permString = `${programId}_${tabName}`;
          return allAllowed.includes(permString);
        });

        if (!cancelled) setHasPermission(userHasAnyPermission);

        if (!userHasAnyPermission) {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.error("Acesso negado: Você não possui permissão!");
          }
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            router.push("/");
          }
        } else {
          const firstAllowedTab = Object.keys(tabGroups).find((tabName) =>
            allAllowed.includes(`${programId}_${tabName}`)
          ) as keyof typeof tabGroups;

          if (firstAllowedTab) {
            setActiveTab(firstAllowedTab);
          }
        }
      } catch (e) {
        console.error("Falha ao verificar permissões:", e);
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.error("Não foi possível verificar suas permissões.");
        }
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user, router, pathname]);

  // Busca dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sheets?programa=${programId}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do programa.");
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados da planilha.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [hasPermission]);

  const handleOpenUpdateModal = (rowData: TableData) => {
    setSelectedRow(rowData);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setSelectedRow(null);
    setIsUpdateModalOpen(false);
  };

  if (!programDisplayNames[programId]) {
    notFound();
  }

  const filteredData = useMemo(() => {
    const term = municipioFilter.toLowerCase();
    return data.filter((row) =>
      String(row["Município"] ?? "").toLowerCase().includes(term)
    );
  }, [data, municipioFilter]);

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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          {hasPermission ? (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">{programTitle}</h1>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data.length > 0 ? (
                <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
                  {/* Abas com permissão */}
                  <div className="mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                      {Object.keys(tabGroups).map((tabName) => {
                        const permString = `${programId}_${tabName}`;
                        const canAccessTab = allowedTabs.includes(permString);
                        return (
                          <button
                            key={tabName}
                            onClick={() => {
                              if (canAccessTab) {
                                setActiveTab(tabName as keyof typeof tabGroups);
                                setCurrentPage(1);
                              }
                            }}
                            disabled={!canAccessTab}
                            className={`-mb-px mr-1 px-4 py-2 text-sm font-medium ${
                              activeTab === tabName
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            } ${!canAccessTab ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {tabName}
                          </button>
                        );
                      })}
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
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
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
                        onClick={() =>
                          paginate(Math.min(totalPages, currentPage + 1))
                        }
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
                  Nenhum dado encontrado para este programa.
                </p>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {selectedRow && hasPermission && (
        <Dialog open={isUpdateModalOpen} onOpenChange={handleCloseUpdateModal}>
          <DialogContent>
            <DialogHeader />
            <UpdateProgramModal
              rowData={selectedRow}
              rowIndex={data.indexOf(selectedRow)}
              onUpdate={fetchData}
              onClose={handleCloseUpdateModal}
              programName={programId}
              activeTab={activeTab}
              tabGroups={tabGroups}
            />
          </DialogContent>
        </Dialog>
      )}
    </ProtectedRoute>
  );
}
