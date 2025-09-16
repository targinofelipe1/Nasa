"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import CustomSelect from "@/components/ui/CustomSelect";
import CustomRadioGroup from "@/components/ui/CustomRadioGroup";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { columnDisplayNames } from '@/lib/column-display-names';

interface NewAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (data: any[], headers: string[], options: any) => void;
  allData: any[];
  allHeaders: string[];
}

const programs = [
  { id: "bolsa-familia", label: "Bolsa Família" },
  { id: "cadastro-unico", label: "Cadastro Único" },
  { id: "bpc-rmv", label: "BPC/RMV" },
  { id: "casa-da-cidadania-e-sine", label: "Casa da Cidadania e SINE" },
  { id: "protecao-basica", label: "Proteção Social Básica" },
  { id: "protecao-especial", label: "Proteção Social Especial" },
  { id: "saude", label: "Saúde" },
  { id: "seguranca-alimentar", label: "Segurança Alimentar" },

];

const programColumnsMap: Record<string, string[]> = {
  'bolsa-familia': [
    'Município', 'RGA',
    "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024",
    "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024",
    "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024",
    "PROGRAMA BOLSA FAMÍLIA -  Famílias Indígenas beneficiárias do Programa Bolsa Família",
    "PROGRAMA BOLSA FAMÍLIA -  Famílias Quilombolas beneficiárias do Programa Bolsa Família",
    "PROGRAMA BOLSA FAMÍLIA - Famílias em Situação de rua beneficiárias do Programa Bolsa Família",
    "PROGRAMA BOLSA FAMÍLIA -  Famílias em GPTE beneficiárias do Programa Bolsa Família",
    "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024",
    "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218",
    "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024",
  ],
  'cadastro-unico': [
    'Município', 'RGA',
    "CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ",
    'CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ',
    'CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ',
    "CADASTRO ÚNICO - Total de Familias CadÚnico",
    "CADASTRO ÚNICO - Total de Pessoas CadÚnico",
    "CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ",
    'CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ',
    "CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ",
    "CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico",
    "CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos",
    "CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais",
    "CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único",
    "CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único",
    "CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)",
    "Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)",
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
  'bpc-rmv': [
    'Município', 'RGA',
     "BPC/RMV  - Total de beneficiários BPC/RMV",
    "BPC/RMV  - Total de beneficiários BPC/RMV no Cadastro Único",
  ],
  'casa-da-cidadania-e-sine': [
    'Município', 'RGA',
     'Quantidade de Casa da Cidadania ',
    'Posto do SINE',
  ],
  'protecao-basica': [
    'Município', 'RGA',
    "Proteção Social Básica - Unidade de CRAS",
        "Proteção Social Básica - Primeira Infância no SUAS",
         "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe",
    "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe (valor investido em 2024/2025)",
        "Proteção Social Básica - Acessuas Trabalho",
         "Proteção Social Básica - Residenciais Cidade Madura",
    "Proteção Social Básica - Residenciais Cidade Madura (valor investido em 2025)",
    "Proteção Social Básica - Centros Sociais Urbanos - CSUs",
    "Proteção Social Básica -  Centros Sociais Urbanos - CSUs (valor investido em 2025)",
        "Proteção Social Básica - Centros de Convivência",
  ],
   'protecao-especial': [
    'Município', 'RGA',
     "Proteção Social Especial - Unidade de CREAS",
    "Proteção Social Especial - Tipo de CREAS",
     "Proteção Social Especial - Unidade de Centro Pop",
    "Proteção Social Especial - Unidade de Centro Dia",
     "Proteção Social Especial - Unidades de Acolhimento (Estadual )",
    "Proteção Social Especial - Unidades de Acolhimento (Municipal)",
        "Proteção Social Especial - Municípios com Serviço de Família Acolhedora",
        "Proteção Social Especial - Projeto Acolher (municípios)",
    "Proteção Social Especial - Projeto Acolher (valor investido em 2025)",
  ],
  'saude': [
    'Município', 'RGA',
     "Saúde - Hospital Geral",
    "Saúde - Centro de Saúde/Unidade Básica de Saúde",
    "Saúde - Posto de Saúde",
        "Saúde - Vacinas (doses aplicadas)",

  ],
  'seguranca-alimentar': [
    'Município', 'RGA',
     'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia',
    'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual',
    'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual',
    'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)',
    'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual',
       "Segurança Alimentar - Cartão Alimentação  (municípios)",
    "Segurança Alimentar - Cartão Alimentação  (beneficiários)",
    "Segurança Alimentar - Cartão Alimentação - valor por município",
        "Segurança Alimentar - Restaurante Popular (municípios)",
 "Segurança Alimentar - PAA LEITE (municípios)",
    "Segurança Alimentar - PAA LEITE (beneficiários)",
    "Segurança Alimentar - PAA LEITE (investimento)",
    "Segurança Alimentar - PAA CDS (municípios)",
    "Segurança Alimentar - PAA CDS (beneficiários)",
    "Segurança Alimentar - PAA CDS (investimento anual)",
    "Segurança Alimentar - Cisternas (quantidade no município)",
    "Segurança Alimentar - Cisternas (valor investido em 2025",
      "Segurança Alimentar - Insegurança Alimentar - Índice de INSAN",
    "Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN",
  ],
};


export default function NewAnalysisModal({ open, onClose, onGenerate, allData, allHeaders }: NewAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [currentProgramData, setCurrentProgramData] = useState<any[]>([]);
  
  const [chartType, setChartType] = useState<"bar-vertical" | "bar-horizontal" | "line" | "pie">("bar-vertical");
  // Removendo Eixo X, ele será sempre Município
  const [yAxis, setYAxis] = useState("");
  const [selectedRegional, setSelectedRegional] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  
  const chartTypeOptions = [
    { value: "bar-vertical" as const, label: "Barra Vertical", icon: <BarChart className="h-4 w-4" /> },
    { value: "bar-horizontal" as const, label: "Barra Horizontal", icon: <BarChart className="h-4 w-4" style={{ transform: 'rotate(90deg)' }} /> },
    { value: "line" as const, label: "Linha", icon: <LineChart className="h-4 w-4" /> },
    { value: "pie" as const, label: "Pizza", icon: <PieChart className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (selectedProgramId && allData.length > 0) {
      setLoading(true);
      const requiredHeaders = programColumnsMap[selectedProgramId] || [];
      const filteredData = allData.map(row => {
        const newRow: any = {};
        requiredHeaders.forEach(header => {
          if (row.hasOwnProperty(header)) {
            newRow[header] = row[header];
          }
        });
        return newRow;
      }).filter(row => Object.keys(row).length > 1);
      
      setCurrentProgramData(filteredData);
      setYAxis(""); // Limpa o eixo Y ao mudar de programa
      setLoading(false);
    } else {
      setCurrentProgramData([]);
      setYAxis("");
    }
  }, [selectedProgramId, allData]);
  
  const filteredData = useMemo(() => {
    return currentProgramData.filter(item => {
      const regionalMatch = selectedRegional === "" || item.RGA === selectedRegional;
      const municipalityMatch = selectedMunicipality === "" || item["Município"] === selectedMunicipality;
      return regionalMatch && municipalityMatch;
    });
  }, [currentProgramData, selectedRegional, selectedMunicipality]);

  const availableRegionals = useMemo(() => ["", ...new Set(currentProgramData.map(item => item.RGA).filter(Boolean))], [currentProgramData]);
  const availableMunicipalities = useMemo(() => ["", ...new Set(currentProgramData.filter(item => selectedRegional === "" || item.RGA === selectedRegional).map(item => item["Município"]).filter(Boolean))], [currentProgramData, selectedRegional]);

  const numericHeaders = useMemo(() => {
    const currentProgramHeaders = programColumnsMap[selectedProgramId] || [];
    return currentProgramHeaders.filter(header => !["Município", "RGA", "Programa", "Unidade"].includes(header));
  }, [selectedProgramId]);
  
  const yAxisOptions = numericHeaders.map(header => ({ id: header, label: columnDisplayNames[header] || header, value: header }));
  const regionalOptions = availableRegionals.map(regional => ({ id: regional, label: regional === "" ? "Todas as Regionais" : regional, value: regional }));
  const municipalityOptions = availableMunicipalities.map(municipality => ({ id: municipality, label: municipality === "" ? "Todos os Municípios" : municipality, value: municipality }));

  const handleGenerateClick = () => {
    if (!selectedProgramId || !yAxis) {
      toast.error("Selecione um programa e a variável numérica.");
      return;
    }
    const programName = programs.find(p => p.id === selectedProgramId)?.label || "";
    // Passa a informação se uma regional foi selecionada
    const isRegionalSelected = selectedRegional !== "";
    onGenerate(filteredData, allHeaders, { xAxis: 'Município', yAxis, chartType, programName, isRegionalSelected });
    onClose();
  };
  
  useEffect(() => {
    if (open) {
      setSelectedProgramId("");
      setYAxis("");
      setSelectedRegional("");
      setSelectedMunicipality("");
      setCurrentProgramData([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Análise Gráfica</DialogTitle>
          <DialogDescription>
            Selecione um programa e as variáveis para gerar um novo gráfico.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Programa</Label>
            <CustomSelect
              options={programs.map(p => ({ id: p.id, label: p.label, value: p.id }))}
              onChange={setSelectedProgramId}
              defaultValue={selectedProgramId}
              placeholder="Selecione um programa..."
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currentProgramData.length > 0 && selectedProgramId ? (
            <div className="space-y-4">            
              <div className="space-y-2">
                <Label>Variável para o Eixo Y</Label>
                <CustomSelect
                  options={yAxisOptions}
                  onChange={setYAxis}
                  defaultValue={yAxis}
                  placeholder="Selecione a variável numérica..."
                />
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Regional</Label>
                <CustomSelect
                  options={regionalOptions}
                  onChange={setSelectedRegional}
                  defaultValue={selectedRegional}
                  placeholder="Todas as Regionais"
                />
              </div>

                <div className="space-y-4">
                  <Label className="mb-6">Tipo de Gráfico</Label>
                <CustomRadioGroup
                  options={chartTypeOptions}
                  value={chartType}
                  onValueChange={setChartType}
                />
              </div>
            </div>
          ) : (
            selectedProgramId && <p className="text-center text-gray-500">Nenhum dado encontrado para este programa.</p>
          )}
        </div>

        <Button
          onClick={handleGenerateClick}
          disabled={!selectedProgramId || !yAxis || loading}
          className="w-full mt-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Gerar Gráfico
        </Button>
      </DialogContent>
    </Dialog>
  );
}