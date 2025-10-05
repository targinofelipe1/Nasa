"use client";

import ChartDisplay from "@/components/ui/ChartDisplay";

import { Download, FileDown, BarChart2, LineChart, PieChart } from "lucide-react";
import { useRef, useCallback, useMemo } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { columnDisplayNames } from "@/lib/column-display-names";
import { Button } from "@/app/components-antigo/Button";

interface ChartCardProps {
  title: string;
  subtitle: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  yAxis2?: string; // 🔹 adiciona
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  isRegionalSelected: boolean;
  onChartTypeChange: (type: "bar-vertical" | "bar-horizontal" | "line" | "pie") => void;
  selectedRegional: string;
  onRegionalChange: (regional: string) => void;
  showGeneral?: boolean;
}


export default function ChartCard({
  title,
  subtitle,
  data,
  xAxis,
  yAxis,
  yAxis2, // 🔹 adiciona aqui
  chartType,
  isRegionalSelected,
  onChartTypeChange,
  selectedRegional,
  onRegionalChange,
  showGeneral = false, 
}: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 🔹 Lista fixa de todas as Regionais
  const ALL_REGIONALS = [
    "1ª", "2ª", "3ª", "4ª", "5ª",
    "6ª", "7ª", "8ª", "9ª", "10ª",
    "11ª", "12ª", "13ª", "14ª",
  ];

  const availableRegionals = useMemo(() => {
    return ["", ...ALL_REGIONALS]; // "" = Todas as Regionais
  }, []);

  const handleExportPng = useCallback(() => {
    if (chartRef.current === null) return;

    toast.info("Exportando gráfico para PNG...");
    toPng(chartRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${title.toLowerCase().replace(/\s/g, "-")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Gráfico exportado com sucesso!");
      })
      .catch((err) => {
        console.error("Erro ao exportar como PNG:", err);
        toast.error("Erro ao exportar o gráfico.");
      });
  }, [title]);

  const handleExportPdf = useCallback(() => {
    if (chartRef.current === null) return;

    toast.info("Exportando gráfico para PDF...");
    toPng(chartRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })
      .then((dataUrl) => {
        const pdf = new jsPDF("l", "pt", "a4");
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${title.toLowerCase().replace(/\s/g, "-")}.pdf`);
        toast.success("Gráfico exportado com sucesso!");
      })
      .catch((err) => {
        console.error("Erro ao exportar como PDF:", err);
        toast.error("Erro ao exportar o gráfico.");
      });
  }, [title]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {/* 🔹 Cabeçalho com título/subtítulo e botões */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex space-x-2 items-center">
          {/* Alternar tipo de gráfico */}
          <div className="flex space-x-1 border rounded p-1">
            <Button
              variant={chartType === "bar-vertical" ? "default" : "ghost"}
              size="icon"
              onClick={() => onChartTypeChange("bar-vertical")}
              className="w-8 h-8"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "bar-horizontal" ? "default" : "ghost"}
              size="icon"
              onClick={() => onChartTypeChange("bar-horizontal")}
              className="w-8 h-8"
            >
              <BarChart2 className="h-4 w-4" style={{ transform: "rotate(90deg)" }} />
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "ghost"}
              size="icon"
              onClick={() => onChartTypeChange("line")}
              className="w-8 h-8"
            >
              <LineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "pie" ? "default" : "ghost"}
              size="icon"
              onClick={() => onChartTypeChange("pie")}
              className="w-8 h-8"
            >
              <PieChart className="h-4 w-4" />
            </Button>
          </div>

          {/* Exportações */}
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleExportPng}>
              <Download className="h-4 w-4 mr-2" /> PNG
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportPdf}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 🔹 Gráfico */}
      <div ref={chartRef} className="p-4">
      <ChartDisplay
          data={data}
          xAxis={xAxis}
          yAxis={yAxis}
          yAxis2={yAxis2}
          chartType={chartType}
          columnDisplayNames={columnDisplayNames}
          programTitle={title}
          selectedRegional={selectedRegional}
          showGeneral={showGeneral} // 🔹 acrescentar
        />
      </div>
    </div>
  );
}
