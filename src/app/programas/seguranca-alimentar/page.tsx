"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { notFound, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SquarePen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import SegurancaAlimentarUpdateModalContent from "@/components/ui/SegurancaAlimentarUpdateModalContent";
import { useUser } from "@clerk/nextjs";

export interface TableData {
  [key: string]: any;
}

const programDisplayNames: Record<string, string> = {
  "seguranca-alimentar": "Segurança Alimentar",
};

const columnDisplayNames: Record<string, string> = {
  "Município": "Município",
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia': "Refeições/dia",
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual': "Refeições/ano",
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual': "Valor anual",
  'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)': "Novo Tá na Mesa (Refeições/dia)",
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual': "Novo Tá na Mesa (Valor anual)",
  "Segurança Alimentar - Cartão Alimentação  (municípios)": "Municípios atendidos",
  "Segurança Alimentar - Cartão Alimentação  (beneficiários)": "Beneficiários",
  "Segurança Alimentar - Cartão Alimentação - valor por município": "Valor por município",
  "Segurança Alimentar - Restaurante Popular (municípios)": "Restaurante Popular (municípios)",
  "Segurança Alimentar - PAA LEITE (municípios)": "PAA Leite (municípios)",
  "Segurança Alimentar - PAA LEITE (beneficiários)": "PAA Leite (beneficiários)",
  "Segurança Alimentar - PAA LEITE (investimento)": "PAA Leite (investimento)",
  "Segurança Alimentar - PAA CDS (municípios)": "PAA CDS (municípios)",
  "Segurança Alimentar - PAA CDS (beneficiários)": "PAA CDS (beneficiários)",
  "Segurança Alimentar - PAA CDS (investimento anual)": "PAA CDS (investimento anual)",
  "Segurança Alimentar - Cisternas (quantidade no município)": "Cisternas (quantidade)",
  "Segurança Alimentar - Cisternas (valor investido em 2025": "Cisternas (valor investido)",
  "Segurança Alimentar - Insegurança Alimentar - Índice de INSAN": "Índice de INSAN",
  "Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN": "Categorias de INSAN",
};

const tabGroups: Record<string, string[]> = {
  "Tá na Mesa": [
    "Município",
    'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia',
    'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual',
    'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual',
    'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)',
    'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual',
  ],
  "Cartão Alimentação": [
    "Município",
    "Segurança Alimentar - Cartão Alimentação  (municípios)",
    "Segurança Alimentar - Cartão Alimentação  (beneficiários)",
    "Segurança Alimentar - Cartão Alimentação - valor por município",
  ],
  "Restaurante Popular": [
    "Município",
    "Segurança Alimentar - Restaurante Popular (municípios)",
  ],
  "PAA - Leite": [
    "Município",
    "Segurança Alimentar - PAA LEITE (municípios)",
    "Segurança Alimentar - PAA LEITE (beneficiários)",
    "Segurança Alimentar - PAA LEITE (investimento)",
  ],
  "PAA - CDS": [
    "Município",
    "Segurança Alimentar - PAA CDS (municípios)",
    "Segurança Alimentar - PAA CDS (beneficiários)",
    "Segurança Alimentar - PAA CDS (investimento anual)",
  ],
  "Cisternas": [
    "Município",
    "Segurança Alimentar - Cisternas (quantidade no município)",
    "Segurança Alimentar - Cisternas (valor investido em 2025",
  ],
  "INSAN": [
    "Município",
    "Segurança Alimentar - Insegurança Alimentar - Índice de INSAN",
    "Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN",
  ],
};

const programId = "seguranca-alimentar";

export default function SegurancaAlimentarPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [activeTab, setActiveTab] = useState<keyof typeof tabGroups>("Tá na Mesa");
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);

  const itemsPerPage = 5;
  const programTitle = programDisplayNames[programId] || "Programa";

  const toastShownRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        setIsVerifying(true);

        const localAllowed =
          ((user.unsafeMetadata as unknown) as { allowedTabs?: string[] } | undefined)?.allowedTabs || [];

        const res = await fetch(`/api/users/${user.id}/permissions`, { cache: "no-store" });
        const json = await res.json();
        const serverAllowed: string[] = Array.isArray(json?.allowedTabs) ? json.allowedTabs : [];

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
            toast.error("Acesso negado: Você não possui permissão para este programa!");
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
          } else {
            setHasPermission(false);
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast.error("Acesso negado: Você não possui permissão para este programa!");
            }
            if (!redirectedRef.current) {
              redirectedRef.current = true;
              router.push("/");
            }
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
    return data.filter((row) => String(row["Município"] ?? "").toLowerCase().includes(term));
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
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 overflow-auto">
          {hasPermission ? (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">{programTitle}</h1>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data.length > 0 ? (
                <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
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

                  {/* Abas */}
                  <div className="mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                      {Object.keys(tabGroups).map((tabName) => {
                        const permString = `${programId}_${tabName}`;
                        const canAccessTab = allowedTabs.includes(permString);
                        const isActive = activeTab === (tabName as keyof typeof tabGroups);
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
                              isActive ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
                            } ${!canAccessTab ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {tabName}
                          </button>
                        );
                      })}
                    </div>
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
                                key === "Município" ? "font-semibold" : "text-gray-900"
                              }`}
                            >
                              {String(row[key] ?? "")}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenUpdateModal(row)}>
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
                <p className="text-center text-gray-500">Nenhum dado encontrado para este programa.</p>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {selectedRow && hasPermission && (
        <Dialog open={isUpdateModalOpen} onOpenChange={handleCloseUpdateModal}>
          <DialogContent>
            <DialogHeader />
            <SegurancaAlimentarUpdateModalContent
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
