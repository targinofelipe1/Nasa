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
import { useUser } from "@clerk/nextjs";
import UpdatePAAModal from "@/components/ui/UpdatePAAModal";

export interface TableData {
  [key: string]: any;
}

const programId = "paa-inscricao";
const programTitle = "PAA - Inscrições e Pontuação";
const screenId = "paa-inscricao_Todos";

// nomes amigáveis
const columnDisplayNames: Record<string, string> = {
  "Nº. Processo": "Nº. Processo",
  "Solicitante": "Solicitante",
  "Data": "Data",
  "Nome": "Nome",
  "CPF": "CPF",
  "Data de Nascimento": "Data de Nascimento",
  "RG": "RG",
  "Órgão Expedidor": "Órgão Expedidor",
  "Data da Expedição": "Data da Expedição",
  "Nome da Mãe": "Nome da Mãe",
  "E-mail": "E-mail",
  "Telefone": "Telefone",
  "Produtos": "Produtos",
  "Quais são os produtos que serão fornecidos?": "Quais são os produtos que serão fornecidos?",
  "Município": "Município",
  "CEP": "CEP",
  "Endereço": "Endereço",
  "Número da DAP/CAF": "Número da DAP/CAF",
  "Data de Emissão": "Data de Emissão",
  "Data de Validade": "Data de Validade",
  "CadÚnico ou NIS": "CadÚnico ou NIS",
  "Você se identifica como mulher?": "Você se identifica como mulher?",
  "Você tem entre 18 e 29 anos?": "Você tem entre 18 e 29 anos?",
  "Você se considera uma pessoa negra?": "Você se considera uma pessoa negra?",
  "Você pertence a um povo indígena?": "Você pertence a um povo indígena?",
  "Você pertence a uma comunidade quilombola?": "Você pertence a uma comunidade quilombola?",
  "Você atua como pescador(a)?": "Você atua como pescador(a)?",
  "Você é assentado(a) da reforma agrária?": "Você é assentado(a) da reforma agrária?",
  "Você pertence a uma comunidade tradicional?": "Você pertence a uma comunidade tradicional?",
  "Pontuação": "Pontuação",
  "Critérios": "Critérios",
  "Quantidade de Filhos": "Quantidade de Filhos",
  "Avaliação": "Avaliação",
};

/* ---------- impressão sem nova aba (iframe oculto) ---------- */
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
  const [nomeFilter, setNomeFilter] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // grade: colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    Object.keys(columnDisplayNames)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  // relatório (PDF) — WIZARD
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState<1 | 2 | 3>(1);

  const [reportOrderBy, setReportOrderBy] = useState<"Pontuação" | "Data">(
    "Pontuação"
  );
  const [reportOrderDir, setReportOrderDir] = useState<"desc" | "asc">("desc");

  // desempate (só vale se PONTUAÇÃO for igual)
  const [tieUseQtdFilhos, setTieUseQtdFilhos] = useState(true);
  const [tieUseData, setTieUseData] = useState(true);

  const [reportColumns, setReportColumns] = useState<string[]>(
    Object.keys(columnDisplayNames)
  );

  // seleção de município + vagas
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>("");
  const [vagasByMunicipio, setVagasByMunicipio] = useState<Record<string, number>>(
    {}
  );

  const redirectedRef = useRef(false);
  const toastShownRef = useRef(false);

  // mude para 5 se quiser 5 por página
  const itemsPerPage = 5;

  // fechar dropdown "Colunas" ao clicar fora/ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!columnMenuRef.current) return;
      if (!columnMenuRef.current.contains(e.target as Node))
        setShowColumnMenu(false);
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

  // buscar dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/paa-inscricao?programa=paa`);
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

  if (!programTitle) notFound();

  // colunas visíveis (grade)
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const selectAllColumns = () =>
    setVisibleColumns(Object.keys(columnDisplayNames));
  const clearAllColumns = () => setVisibleColumns([]);

  const displayedHeaders = useMemo(
    () => Object.keys(columnDisplayNames).filter((k) => visibleColumns.includes(k)),
    [visibleColumns]
  );

  // filtros
  const filteredData = useMemo(() => {
    const mun = municipioFilter.toLowerCase().trim();
    const nome = nomeFilter.toLowerCase().trim();
    return data.filter((row) => {
      const rowMun = String(row["Município"] ?? "").toLowerCase();
      const rowNome = String(row["Nome"] ?? "").toLowerCase();
      const matchMun = mun ? rowMun.includes(mun) : true;
      const matchNome = nome ? rowNome.includes(nome) : true;
      return matchMun && matchNome;
    });
  }, [data, municipioFilter, nomeFilter]);

  // permissões
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
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // -------- helpers relatório --------
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
    const s = String(v).replace(",", ".").replace(/[^\d.-]/g, "");
    const n = Number(s);
    return isNaN(n) ? NaN : n;
  };
  const normalizeScore = (n: number) => (isNaN(n) ? -Infinity : n);

  const parseDate = (v: any) => {
    if (!v) return new Date(NaN);
    const s = String(v).trim();
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    if (ddmmyyyy.test(s)) {
      const [, d, m, y] = s.match(ddmmyyyy) as RegExpMatchArray;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? new Date(NaN) : dt;
  };

  /** Ordena respeitando: 
   * - Primário por Pontuação (desc/asc) OU Data (desc/asc)
   * - Desempate **somente** se reportOrderBy === "Pontuação" **e** pontuações iguais:
   *     1) Quantidade de Filhos (desc) se marcado
   *     2) Data (asc) se marcado
   * - Fallback: Nome (asc)
   */
  const compareForReport = (a: TableData, b: TableData) => {
    if (reportOrderBy === "Pontuação") {
      const ap = normalizeScore(parseNumber(a["Pontuação"]));
      const bp = normalizeScore(parseNumber(b["Pontuação"]));
      if (ap !== bp) {
        // maior primeiro quando 'desc'
        return reportOrderDir === "asc" ? ap - bp : bp - ap;
      }

      // Pontuações iguais → aplicar critérios de desempate
      if (tieUseQtdFilhos) {
        const af = normalizeScore(parseNumber(a["Quantidade de Filhos"]));
        const bf = normalizeScore(parseNumber(b["Quantidade de Filhos"]));
        if (af !== bf) return bf - af; // mais filhos primeiro
      }
      if (tieUseData) {
        const ad = parseDate(a["Data"]).getTime();
        const bd = parseDate(b["Data"]).getTime();
        if (ad !== bd) return ad - bd; // mais antigo primeiro
      }

      // fallback
      return String(a["Nome"] ?? "").localeCompare(String(b["Nome"] ?? ""));
    } else {
      // Ordenar por DATA
      const ad = parseDate(a["Data"]).getTime();
      const bd = parseDate(b["Data"]).getTime();
      if (ad !== bd) return reportOrderDir === "asc" ? ad - bd : bd - ad;
      // sem desempate por filhos aqui (pedido do usuário)
      return String(a["Nome"] ?? "").localeCompare(String(b["Nome"] ?? ""));
    }
  };

  const buildReportHTML = (
    grupos: Array<{
      municipio: string;
      classificados: TableData[];
      espera: TableData[];
      cols: string[];
    }>
  ) => {
    const style = `
      <style>
        *{box-sizing:border-box}
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,"Apple Color Emoji","Segoe UI Emoji";color:#111827;padding:24px}
        h1{font-size:20px;margin:0 0 16px}
        h2{font-size:16px;margin:24px 0 8px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #e5e7eb;padding:8px;font-size:12px;text-align:left;vertical-align:top}
        th{background:#f9fafb;font-weight:600}
        .section{page-break-inside:avoid;margin-bottom:24px}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .badge{display:inline-block;padding:2px 6px;border-radius:9999px;border:1px solid #d1d5db;font-size:10px;color:#374151}
      </style>`;
    const renderTable = (title: string, rows: TableData[], cols: string[]) => {
      const thead = cols.map((c) => `<th>${columnDisplayNames[c] || c}</th>`).join("");
      const tbody =
        rows.length === 0
          ? `<tr><td colspan="${cols.length}" style="color:#6b7280">Sem registros</td></tr>`
          : rows.map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`).join("");
      return `<h2>${title}</h2><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
    };
    const generatedAt = new Date().toLocaleString();
    const content = grupos
      .map(
        (g) => `
        <div class="section">
          <div class="header">
            <h1>Município: ${g.municipio}</h1>
            <span class="badge">Gerado em ${generatedAt}</span>
          </div>
          ${renderTable("Classificados", g.classificados, g.cols)}
          ${renderTable("Lista de Espera", g.espera, g.cols)}
        </div>`
      )
      .join("");
    // sem window.print aqui; quem chama o print é o helper
    return `<!doctype html><html><head><meta charSet="utf-8" /><title>Relatório PAA</title>${style}</head><body>${content}</body></html>`;
  };

  /* ---------- reset do wizard ---------- */
  const resetReportState = () => {
    setReportStep(1);
    setSelectedMunicipio("");
    setVagasByMunicipio({});
    setReportOrderBy("Pontuação");
    setReportOrderDir("desc");
    setTieUseQtdFilhos(true);
    setTieUseData(true);
    setReportColumns(Object.keys(columnDisplayNames));
  };

  /* ---------- gerar PDF ---------- */
  const handleGeneratePDF = () => {
    try {
      if (!selectedMunicipio) {
        toast.error("Selecione um município.");
        setReportStep(1);
        return;
      }
      const vagas = vagasByMunicipio[selectedMunicipio];
      if (vagas === undefined || vagas < 0) {
        toast.error("Informe um número de vagas válido.");
        setReportStep(1);
        return;
      }

      const base = [...data];
      const cols = ["Classificação", ...reportColumns.filter((c) => c !== "Classificação")];

      const mun = selectedMunicipio;
      const rows = base.filter((r) => String(r["Município"] ?? "") === mun);

      // ordenação correta (maior pontuação na frente quando 'desc')
      rows.sort(compareForReport);

      const classificados: TableData[] = [];
      const espera: TableData[] = [];
      rows.forEach((row, idx) => {
        const clone = { ...row, Classificação: idx + 1 };
        if (idx < (vagas ?? 0)) classificados.push(clone);
        else espera.push(clone);
      });

      const html = buildReportHTML([
        { municipio: mun, classificados, espera, cols },
      ]);

      const ok = openPrintView(html);
      if (!ok) {
        toast.error("Não foi possível abrir/emitir o PDF. Verifique bloqueador de pop-ups.");
        return;
      }

      toast.success("Relatório aberto para impressão (Salvar como PDF).");
      setReportOpen(false);
      resetReportState();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar o PDF.");
    }
  };

  /* ---------- render ---------- */
  if (!isLoaded || isVerifying) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!hasPermission) return null;

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
                {/* filtros + ações */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* buscas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:max-w-2xl">
                    <div className="relative">
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
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={nomeFilter}
                        onChange={(e) => {
                          setNomeFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* ações direita */}
                  <div className="flex items-center gap-2">
                    {/* seletor de colunas */}
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
                                <label
                                  key={key}
                                  className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleColumn(key)}
                                    className="h-4 w-4"
                                  />
                                  <span className="truncate">
                                    {columnDisplayNames[key] || key}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* relatório (PDF) */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        resetReportState(); // zera tudo ao abrir
                        setReportOpen(true);
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                      Relatório (PDF)
                    </Button>
                  </div>
                </div>

                {/* tabela */}
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

                {/* paginação */}
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
                Nenhum dado encontrado para ODE.
              </p>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: Relatório (PDF) — wizard compacto */}
      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) resetReportState(); // zera ao fechar
        }}
      >
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle>Relatório (PDF)</DialogTitle>
          </DialogHeader>

          <div className="px-1 pb-2 text-sm text-gray-600">
            Etapa {reportStep} de 3
          </div>

          {/* STEP 1 — Município & Vagas */}
          {reportStep === 1 && (
            <div className="p-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Município
                </label>
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={selectedMunicipio}
                  onChange={(e) => {
                    const m = e.target.value;
                    setSelectedMunicipio(m);
                    setVagasByMunicipio({ [m]: 0 });
                  }}
                >
                  <option value="">Selecione…</option>
                  {uniqueMunicipios.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMunicipio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de vagas
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[120px] text-sm">{selectedMunicipio}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={String(vagasByMunicipio[selectedMunicipio] ?? 0)}
                      onChange={(e) =>
                        setVagasByMunicipio({
                          [selectedMunicipio]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    if (!selectedMunicipio) {
                      toast.error("Selecione um município.");
                      return;
                    }
                    const v = vagasByMunicipio[selectedMunicipio];
                    if (v === undefined || v < 0) {
                      toast.error("Informe um número de vagas válido.");
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

          {/* STEP 2 — Ordenação & desempate */}
          {reportStep === 2 && (
            <div className="p-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={reportOrderBy}
                    onChange={(e) =>
                      setReportOrderBy(e.target.value as "Pontuação" | "Data")
                    }
                  >
                    <option value="Pontuação">Pontuação</option>
                    <option value="Data">Data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direção
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={reportOrderDir}
                    onChange={(e) =>
                      setReportOrderDir(e.target.value as "asc" | "desc")
                    }
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Critérios de desempate
                  </label>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tieUseQtdFilhos}
                        onChange={(e) => setTieUseQtdFilhos(e.target.checked)}
                      />
                      Quantidade de Filhos
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tieUseData}
                        onChange={(e) => setTieUseData(e.target.checked)}
                      />
                      Data
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Desempate só vale se a <b>pontuação</b> for igual: filhos (maior) e depois data (mais antiga).
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setReportStep(1)}>
                  Voltar
                </Button>
                <Button onClick={() => setReportStep(3)}>Próximo</Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Colunas */}
          {reportStep === 3 && (
            <div className="p-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Colunas no PDF
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportColumns(Object.keys(columnDisplayNames))}
                  >
                    Selecionar tudo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportColumns([])}
                  >
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
                            prev.includes(key)
                              ? prev.filter((k) => k !== key)
                              : [...prev, key]
                          )
                        }
                        className="h-4 w-4"
                      />
                      <span className="truncate">
                        {columnDisplayNames[key] || key}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setReportStep(2)}>
                  Voltar
                </Button>
                <Button onClick={handleGeneratePDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Edição PAA */}
      {selectedRow && (
        <Dialog open={isUpdateModalOpen} onOpenChange={handleCloseUpdateModal}>
          <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Atualizar Pontuação e Avaliação
              </DialogTitle>
            </DialogHeader>
            <UpdatePAAModal
              rowData={selectedRow}
              onUpdate={fetchData}
              onClose={handleCloseUpdateModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </ProtectedRoute>
  );
}
