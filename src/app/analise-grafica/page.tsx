"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import NewAnalysisModal from "@/components/ui/NewAnalysisModal";
import ChartCard from "@/components/ui/ChartCard";
import { useUser } from "@clerk/nextjs";

const programId = "analise-grafica";
const requiredTab = "Geral";

export default function AnaliseGraficaPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedCharts, setGeneratedCharts] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [allHeaders, setAllHeaders] = useState<string[]>([]);

  const toastShownRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!isLoaded || !isSignedIn || !user) return;
      try {
        setIsVerifying(true);
        const res = await fetch(`/api/users/${user.id}/permissions`, { cache: "no-store" });
        const json = await res.json();
        const serverAllowed: string[] = Array.isArray(json?.allowedTabs) ? json.allowedTabs : [];
        const finalHas = serverAllowed.includes(`${programId}_${requiredTab}`);
        if (!cancelled) setHasPermission(finalHas);

        if (!finalHas) {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.error("Acesso negado: Você não possui permissão para esta página!");
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
          toast.error("Não foi possível verificar suas permissões.");
        }
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, user, router, pathname]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!hasPermission) return;
      setLoading(true);
      try {
        const response = await fetch("/api/sheets");
        const result = await response.json();
        const apiData = result.data || result.values;

        if (result.success && Array.isArray(apiData) && apiData.length > 0) {
          const headers = apiData[0];
          setAllHeaders(headers);
          const formattedData = apiData.slice(1).map((row: any[]) =>
            headers.reduce((acc: any, key: string, index: number) => {
              acc[key] = row[index]?.toString() || "";
              return acc;
            }, {})
          );
          setAllData(formattedData);
        } else {
          console.error("Erro ao carregar todos os dados:", result.message || "Formato de dados inesperado.");
          toast.error("Erro ao carregar dados da planilha.");
          setAllData([]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        toast.error("Erro ao carregar dados da planilha.");
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [hasPermission]);

  const handleGenerateChart = (data: any[], headers: string[], options: any) => {
    const newChart = {
      title: options.programName,
      subtitle: `Eixos: ${options.xAxis} vs. ${options.yAxis}`,
      data,
      xAxis: options.xAxis,
      yAxis: options.yAxis,
      chartType: options.chartType,
      isRegionalSelected: options.isRegionalSelected,
      selectedRegional: options.selectedRegional || "",
    };
    setGeneratedCharts(prev => [...prev, newChart]);
    toast.success("Gráfico gerado com sucesso!");
  };

  const handleChartTypeChange = (index: number, type: "bar-vertical" | "bar-horizontal" | "line" | "pie") => {
    setGeneratedCharts(prev =>
      prev.map((chart, i) => i === index ? { ...chart, chartType: type } : chart)
    );
  };

  const handleRegionalChange = (index: number, regional: string) => {
    setGeneratedCharts(prev =>
      prev.map((chart, i) =>
        i === index
          ? { ...chart, selectedRegional: regional, isRegionalSelected: regional !== "" && regional !== "Todas as Regionais" }
          : chart
      )
    );
  };

  if (!isLoaded || isVerifying) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen overflow-hidden">
        <div style={{ zoom: "80%" }} className="h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 overflow-auto">
          {hasPermission ? (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Análise Gráfica</h1>
                {generatedCharts.length > 0 && (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Análise
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="mt-8">
                  {generatedCharts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pronto para a Análise!</h2>
                      <p className="text-gray-600 mb-6">Clique no botão abaixo para selecionar as variáveis e gerar seu primeiro gráfico.</p>
                      <p className="text-gray-600 mb-6">Lembre-se: os gráficos são estáticos e serão apagados a cada atualização da página.</p>
                      <Button onClick={() => setIsModalOpen(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" /> Gerar Gráfico
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {generatedCharts.map((chart, index) => (
                        <ChartCard
                          key={`generated-${index}`}
                          title={chart.title}
                          subtitle={chart.subtitle}
                          data={chart.data}
                          xAxis={chart.xAxis}
                          yAxis={chart.yAxis}
                          chartType={chart.chartType}
                          isRegionalSelected={chart.isRegionalSelected}
                          selectedRegional={chart.selectedRegional}
                          onRegionalChange={(regional) => handleRegionalChange(index, regional)}
                          onChartTypeChange={(type) => handleChartTypeChange(index, type)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      <NewAnalysisModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerateChart}
        allData={allData}
        allHeaders={allHeaders}
      />
    </ProtectedRoute>
  );
}
