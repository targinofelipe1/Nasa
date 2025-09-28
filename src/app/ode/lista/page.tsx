// app/ode/list/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  SquarePen,
  ChevronLeft,
  ChevronRight,
  Search,
  Columns3,
  FileDown,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import UpdateOdeModal from "@/components/ui/UpdateOdeModal";
import { useUser } from "@clerk/nextjs";

export interface TableData {
  [key: string]: any;
}

// Nome que vai aparecer no título
const programId = "ode";
const programTitle = "ODE - Obras, Serviços e Programas";
const screenId = "ode_ode_list";

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

/* ------------ impressão sem abrir nova aba (iframe) ------------ */
const openPrintView = (finalHTML: string) => {
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return false;
    }

    doc.open();
    doc.write(finalHTML);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 500);
      }
    }, 100);

    return true;
  } catch {
    return false;
  }
};

export default function OdeListPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // ---- seletor de colunas (grade)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    Object.keys(columnDisplayNames)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  // ---- relatório (wizard)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState<1 | 2 | 3>(1);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>("");
  const [orderBy, setOrderBy] = useState<"Nome" | "Ano" | "Valor">("Nome");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [reportColumns, setReportColumns] = useState<string[]>(
    Object.keys(columnDisplayNames)
  );

  const redirectedRef = useRef(false);
  const toastShownRef = useRef(false);

  const itemsPerPage = 10; // mude para 5 se quiser 5 por página

  // Fecha o menu de colunas ao clicar fora/ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!columnMenuRef.current) return;
      if (!columnMenuRef.current.contains(e.target as Node)) setShowColumnMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

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

  // Verificação de permissões
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

  const allHeaders = Object.keys(columnDisplayNames);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // ---- colunas visíveis
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const selectAllColumns = () => setVisibleColumns(Object.keys(columnDisplayNames));
  const clearAllColumns = () => setVisibleColumns([]);

  const displayedHeaders = useMemo(
    () => Object.keys(columnDisplayNames).filter((k) => visibleColumns.includes(k)),
    [visibleColumns]
  );

  // ---- helpers de relatório
  const uniqueMunicipios = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const m = String(r["Município"] ?? "").trim();
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const parseNumber = (v: any) => {
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? NaN : n;
  };

  const buildReportHTML = (titulo: string, rows: TableData[], cols: string[]) => {
   const style = `
      <style>
        /* Forçar PDF em paisagem */
        @page { size: A4 landscape; margin: 12mm; }

        /* Melhor impressão de cores (thead, etc.) */
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        body{
          font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,"Apple Color Emoji","Segoe UI Emoji";
          color:#111827;
          padding:24px;
        }

        h1{ font-size:20px; margin:0 0 16px; }
        h2{ font-size:16px; margin:24px 0 8px; }

        /* Tabela com grades (mesmo visual de antes) */
        table{
          width:100%;
          border-collapse:collapse;   /* grades contínuas */
          table-layout:fixed;         /* colunas estáveis no PDF */
          margin-top:8px;
        }
        thead{ display: table-header-group; } /* repete o cabeçalho a cada página */
        tr{ page-break-inside: avoid; }       /* evita quebrar linhas no meio */

        th, td{
          border:1px solid #e5e7eb;  /* <<< grades */
          padding:8px;
          font-size:12px;
          text-align:left;
          vertical-align:top;
          word-wrap:break-word;
        }
        th{
          background:#f9fafb;
          font-weight:600;
        }

        .header{
          display:flex;justify-content:space-between;align-items:center;margin-bottom:16px
        }
        .badge{
          display:inline-block;padding:2px 6px;border-radius:9999px;border:1px solid #d1d5db;font-size:10px;color:#374151
        }
      </style>`;


    const thead = cols.map((c) => `<th>${columnDisplayNames[c] || c}</th>`).join("");
    const tbody =
      rows.length === 0
        ? `<tr><td colspan="${cols.length}" style="color:#6b7280">Sem registros</td></tr>`
        : rows
            .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`)
            .join("");

    const generatedAt = new Date().toLocaleString();

    return `<!doctype html>
<html>
<head><meta charSet="utf-8" /><title>${titulo}</title>${style}</head>
<body>
  <div class="header">
    <h1>${titulo}</h1>
    <span class="badge">Gerado em ${generatedAt}</span>
  </div>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
</body>
</html>`;
  };

  const resetReport = () => {
    setReportStep(1);
    setSelectedMunicipio("");
    setOrderBy("Nome");
    setOrderDir("asc");
    setReportColumns(Object.keys(columnDisplayNames));
  };

  const handleGeneratePDF = () => {
    try {
      if (!selectedMunicipio) {
        toast.error("Selecione um município.");
        setReportStep(1);
        return;
      }

      const base = data.filter(
        (r) => String(r["Município"] ?? "") === selectedMunicipio
      );

      // ordenação
      base.sort((a, b) => {
        if (orderBy === "Valor") {
          const av = parseNumber(a["Valor"]);
          const bv = parseNumber(b["Valor"]);
          return orderDir === "asc" ? av - bv : bv - av;
        }
        if (orderBy === "Ano") {
          const aa = parseNumber(a["Ano"]);
          const ba = parseNumber(b["Ano"]);
          return orderDir === "asc" ? aa - ba : ba - aa;
        }
        // Nome (string)
        const an = String(a["NOME"] ?? "");
        const bn = String(b["NOME"] ?? "");
        return orderDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      });

      const cols = [...reportColumns];
      const html = buildReportHTML(
        `Município: ${selectedMunicipio}`,
        base,
        cols
      );

      const ok = openPrintView(html);
      if (!ok) {
        toast.error("Não foi possível abrir/emitir o PDF. Verifique bloqueador de pop-ups.");
        return;
      }

      toast.success("Relatório aberto para impressão (Salvar como PDF).");
      setReportOpen(false);
      resetReport();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar o PDF.");
    }
  };

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
                {/* Barra de filtros e ações */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Filtro Município */}
                  <div className="relative w-full sm:max-w-md">
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

                  {/* Ações à direita */}
                  <div className="flex items-center gap-2">
                    {/* Colunas */}
                    <div className="relative" ref={columnMenuRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setShowColumnMenu((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={showColumnMenu}
                      >
                        <Columns3 className="h-4 w-4" />
                        Colunas
                      </Button>
                      {showColumnMenu && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-2 w-72 rounded-md border bg-white p-3 shadow-lg z-10"
                        >
                          <div className="flex justify-between mb-2">
                            <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                              Selecionar tudo
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearAllColumns}>
                              Limpar
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-auto pr-1 space-y-1">
                            {Object.keys(columnDisplayNames).map((key) => {
                              const checked = visibleColumns.includes(key);
                              return (
                                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleColumn(key)}
                                    className="h-4 w-4"
                                  />
                                  <span className="truncate">{columnDisplayNames[key] || key}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Relatório */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        resetReport();
                        setReportOpen(true);
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                      Relatório (PDF)
                    </Button>
                  </div>
                </div>

                {/* Tabela completa sem abas */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {displayedHeaders.map((key) => (
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
                        {displayedHeaders.map((key, colIndex) => (
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

      {/* MODAL: Relatório (wizard compacto) */}
      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) resetReport();
        }}
      >
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle>Relatório (PDF)</DialogTitle>
          </DialogHeader>

          <div className="px-1 pb-2 text-sm text-gray-600">Etapa {reportStep} de 3</div>

          {/* Etapa 1 - Município */}
          {reportStep === 1 && (
            <div className="p-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={selectedMunicipio}
                  onChange={(e) => setSelectedMunicipio(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {uniqueMunicipios.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!selectedMunicipio) {
                      toast.error("Selecione um município.");
                      return;
                    }
                    setReportStep(2);
                  }}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 2 - Ordenação */}
          {reportStep === 2 && (
            <div className="p-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value as "Nome" | "Ano" | "Valor")}
                  >
                    <option value="Nome">Nome</option>
                    <option value="Ano">Ano</option>
                    <option value="Valor">Valor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direção</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={orderDir}
                    onChange={(e) => setOrderDir(e.target.value as "asc" | "desc")}
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setReportStep(1)}>Voltar</Button>
                <Button onClick={() => setReportStep(3)}>Próximo</Button>
              </div>
            </div>
          )}

          {/* Etapa 3 - Colunas */}
          {reportStep === 3 && (
            <div className="p-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Colunas no PDF</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setReportColumns(Object.keys(columnDisplayNames))}>
                    Selecionar tudo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReportColumns([])}>
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
                {Object.keys(columnDisplayNames).map((key) => {
                  const checked = reportColumns.includes(key);
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setReportColumns((prev) =>
                            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                          )
                        }
                        className="h-4 w-4"
                      />
                      <span className="truncate">{columnDisplayNames[key] || key}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setReportStep(2)}>Voltar</Button>
                <Button onClick={handleGeneratePDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      {selectedRow && (
        <Dialog open={isUpdateModalOpen} onOpenChange={handleCloseUpdateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="sr-only">Editar ODE</DialogTitle>
            </DialogHeader>
            <UpdateOdeModal
              rowData={selectedRow}
              rowIndex={data.indexOf(selectedRow)}
              onUpdate={fetchData}
              onClose={handleCloseUpdateModal}
              activeTab={"Todos"}
              tabGroups={{ Todos: Object.keys(columnDisplayNames) }}
            />
          </DialogContent>
        </Dialog>
      )}
    </ProtectedRoute>
  );
}
