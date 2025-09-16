"use client";

import { Label } from "./Label";
import { BarChart, LineChart, PieChart } from "lucide-react";
import CustomSelect from "./CustomSelect";
import CustomRadioGroup from "./CustomRadioGroup";

interface ChartOptionsProps {
  headers: string[];
  chartType: "bar-vertical" | "bar-horizontal" | "line" | "pie";
  setChartType: (type: "bar-vertical" | "bar-horizontal" | "line" | "pie") => void;
  xAxis: string;
  setXAxis: (axis: string) => void;
  yAxis: string;
  setYAxis: (axis: string) => void;
  availableRegionals: string[];
  availableMunicipalities: string[];
  selectedRegional: string;
  setSelectedRegional: (regional: string) => void;
  selectedMunicipality: string;
  setSelectedMunicipality: (municipality: string) => void;
}

export default function ChartOptions({
  headers,
  chartType,
  setChartType,
  xAxis,
  setXAxis,
  yAxis,
  setYAxis,
  availableRegionals,
  availableMunicipalities,
  selectedRegional,
  setSelectedRegional,
  selectedMunicipality,
  setSelectedMunicipality,
}: ChartOptionsProps) {

  const numericHeaders = headers.filter(header => {
    return !["Município", "RGA", "Programa", "Unidade"].includes(header);
  });
  const categoricalHeaders = headers.filter(header => {
    return ["Município", "RGA", "Programa", "Unidade"].includes(header);
  });

  const chartTypeOptions = [
    { value: "bar-vertical" as const, label: "Barra Vertical", icon: <BarChart className="h-4 w-4" /> },
    { value: "bar-horizontal" as const, label: "Barra Horizontal", icon: <BarChart className="h-4 w-4" style={{ transform: 'rotate(90deg)' }} /> },
    { value: "line" as const, label: "Linha", icon: <LineChart className="h-4 w-4" /> },
    { value: "pie" as const, label: "Pizza", icon: <PieChart className="h-4 w-4" /> },
  ];
  
  const xAxisOptions = categoricalHeaders.map(header => ({ id: header, label: header, value: header }));
  const yAxisOptions = numericHeaders.map(header => ({ id: header, label: header, value: header }));
  const regionalOptions = availableRegionals.map(regional => ({ id: regional, label: regional === "" ? "Todas as Regionais" : regional, value: regional }));
  const municipalityOptions = availableMunicipalities.map(municipality => ({ id: municipality, label: municipality === "" ? "Todos os Municípios" : municipality, value: municipality }));
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Tipo de Gráfico</Label>
        <CustomRadioGroup
          options={chartTypeOptions}
          value={chartType}
          onValueChange={setChartType}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="xAxis">Eixo X (Variável Categórica)</Label>
          <CustomSelect
            options={xAxisOptions}
            onChange={setXAxis}
            defaultValue={xAxis}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yAxis">Eixo Y (Variável Numérica)</Label>
          <CustomSelect
            options={yAxisOptions}
            onChange={setYAxis}
            defaultValue={yAxis}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="regional-filter">Filtrar por Regional</Label>
          <CustomSelect
            options={regionalOptions}
            onChange={setSelectedRegional}
            defaultValue={selectedRegional}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="municipality-filter">Filtrar por Município</Label>
          <CustomSelect
            options={municipalityOptions}
            onChange={setSelectedMunicipality}
            defaultValue={selectedMunicipality}
          />
        </div>
      </div>
    </div>
  );
}