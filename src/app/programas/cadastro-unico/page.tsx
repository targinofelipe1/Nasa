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
import UpdateProgramModal from "@/components/ui/UpdateProgramModal";
import { useUser } from "@clerk/nextjs";

export interface TableData {
  [key: string]: any;
}

const programDisplayNames: Record<string, string> = {
  "cadastro-unico": "Cadastro Único",
};

const columnDisplayNames: Record<string, string> = {
  "Município": "Município",
  'CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ': "Famílias em Pobreza",
  'CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ':
    "Famílias Baixa Renda",
  "CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ": "Famílias Renda Acima de 1/2 S.M.",
  "CADASTRO ÚNICO - Total de Familias CadÚnico": "Quantidade de Famílias Inscritas",
  "CADASTRO ÚNICO - Total de Pessoas CadÚnico": "Quantidade de Pessoas Inscritas",
  "CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ": "Pessoas em Pobreza",
  'CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ':
    "Pessoas em Baixa Renda",
  "CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ": "Pessoas com renda acima de meio salário mínino",
  "CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico": "Famílias UNIPESSOAIS",
  "CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos": "Pessoas com 0 a 6 anos",
  "CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais": "Pessoas com 60 ou mais anos",
  "CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único": "Pessoas com deficiência",
  "CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único": "Famílias Indígenas",
  "CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único": "Famílias Quilombolas",
  "CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único": "Famílias em situação de rua",
  "CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único": "Famílias GPTE",
  "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)":
    "Ensino Fundamental (Incompleto/Completo)",
  "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)":
    "Ensino Médio (Incompleto/Completo)",
  "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)":
    "Ensino Superior (Incompleto/Completo)",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que não exerceram trabalho remunerado nos últimos 12 meses":
    "Sem Trabalho Remunerado",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que Exerceram trabalho remunerado nos últimos 12 meses":
    "Com Trabalho Remunerado",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico  por função principal - Trabalhador por conta própria":
    "Trabalhador Autônomo",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural":
    "Trabalhador Rural Temporário",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada":
    "Empregado Sem Carteira",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada":
    "Empregado Com Carteira",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada":
    "Trabalhador Doméstico",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado":
    "Trabalhador Não-Remunerado",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público":
    "Militar/Servidor Público",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador": "Empregador",
  "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz":
    "Estagiário/Aprendiz",
};

const tabGroups = {
  "Famílias": [
    "Município",
    "CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ",
    "CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ",
    "CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ",
    "CADASTRO ÚNICO - Total de Familias CadÚnico",
    "CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico",
    "CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único",
  ],
  "Pessoas e Idade": [
    "Município",
    "CADASTRO ÚNICO - Total de Pessoas CadÚnico",
    "CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ",
    "CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ",
    "CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ",
    "CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos",
    "CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais",
    "CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único",
  ],
  "Instrução": [
    "Município",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)",
  ],
  "Trabalho": [
    "Município",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que não exerceram trabalho remunerado nos últimos 12 meses",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que Exerceram trabalho remunerado nos últimos 12 meses",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico  por função principal - Trabalhador por conta própria",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador",
    "Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz",
  ],
};

const programId = "cadastro-unico";

export default function CadastroUnicoPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [activeTab, setActiveTab] = useState<keyof typeof tabGroups>("Famílias");
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
      <div className="flex bg-white min-h-screen">
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

                  <div className="relative mb-6">
                    <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide">
                      {Object.keys(tabGroups).map((tabName) => {
                        const permString = `${programId}_${tabName}`;
                        const canAccessTab = allowedTabs.includes(permString);
                        return (
                          <div key={tabName} className="relative flex-shrink-0">
                            <button
                              onClick={() => {
                                if (canAccessTab) {
                                  setActiveTab(tabName as keyof typeof tabGroups);
                                  setCurrentPage(1);
                                }
                              }}
                              disabled={!canAccessTab}
                              className={`px-4 py-2 text-sm font-medium ${
                                activeTab === tabName ? "text-primary" : "text-gray-500 hover:text-gray-700"
                              } ${!canAccessTab ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                              {tabName}
                            </button>
                            {activeTab === tabName && (
                              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-primary rounded-t-lg transition-all duration-300"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200 -z-10"></div>
                  </div>

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
                                key.includes("Município") ? "font-semibold" : "text-gray-900"
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
