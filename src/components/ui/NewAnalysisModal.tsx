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
import { BarChart, LineChart, PieChart, Search } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { columnDisplayNames } from "@/lib/column-display-names";
import { GroupingIcon } from "./GroupingIcon";

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
  { id: "paa", label: "PAA" },
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
  'Segurança Alimentar - Cartão Alimentação  (municípios)',
  'Segurança Alimentar - Cartão Alimentação  (beneficiários)',
  'Segurança Alimentar - Cartão Alimentação - valor por município',
  'Segurança Alimentar - Restaurante Popular (municípios)',
  'Segurança Alimentar - PAA LEITE (municípios)',
  'Segurança Alimentar - PAA LEITE (beneficiários)',
  'Segurança Alimentar - PAA LEITE (investimento)',
  'Segurança Alimentar - PAA CDS (municípios)',
  'Segurança Alimentar - PAA CDS (beneficiários)',
  'Segurança Alimentar - PAA CDS (investimento anual)',
  'Segurança Alimentar - Cisternas (quantidade no município)',
  'Segurança Alimentar - Cisternas (valor investido em 2025',
  'Segurança Alimentar - Insegurança Alimentar - Índice de INSAN',
  ],

  
  "paa": [
    "MUNICÍPIO",
    "ENTIDADE CADASTRADA",
    "BENEFICIADOS",
    "PAA 2023 – Recurso Federal (Quantidade Kg de alimentos)",
    "PAA 2024 – Recurso Federal (Quantidade Kg de alimentos)",
    "PAA 2024 – Recurso Estadual (Quantidade Kg de alimentos)",
    "PAA 2024 – Recurso Estadual e Federal (Quantidade Kg de alimentos)",
    "PAA VALOR TOTAL INVESTIDO (COMPRAS)",
  ],
};

export default function NewAnalysisModal({
  open,
  onClose,
  onGenerate,
  allData,
  allHeaders,
}: NewAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [currentProgramData, setCurrentProgramData] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [showGeneral, setShowGeneral] = useState(false);



  const [chartType, setChartType] = useState<
    "bar-vertical" | "bar-horizontal" | "line" | "pie"
  >("bar-vertical");
  const [yAxis, setYAxis] = useState("");
  const [yAxis2, setYAxis2] = useState("");
  const [groupingAxis, setGroupingAxis] = useState<"municipio" | "ano">(
    "municipio"
  );

  const [selectedRegional, setSelectedRegional] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  const chartTypeOptions = [
    {
      value: "bar-vertical" as const,
      label: "Barra Vertical",
      icon: <BarChart className="h-4 w-4" />,
    },
    {
      value: "bar-horizontal" as const,
      label: "Barra Horizontal",
      icon: (
        <BarChart
          className="h-4 w-4"
          style={{ transform: "rotate(90deg)" }}
        />
      ),
    },
    { value: "line" as const, label: "Linha", icon: <LineChart className="h-4 w-4" /> },
    { value: "pie" as const, label: "Pizza", icon: <PieChart className="h-4 w-4" /> },
  ];

  // Função utilitária para normalizar
  const normalizeKey = (key: string) =>
    key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  useEffect(() => {
    const fetchPaaData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/paa-sheet?programa=paa`);
        const json = await res.json();
        if (json.success) {
          setCurrentProgramData(json.data);
        } else {
          setCurrentProgramData([]);
        }
      } catch (e) {
        console.error("Erro ao buscar dados do PAA:", e);
        setCurrentProgramData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedProgramId === "paa") {
      fetchPaaData();
    } else if (selectedProgramId && allData.length > 0) {
      // 👉 lógica atual para os outros programas
      setLoading(true);
      const requiredHeaders = (programColumnsMap[selectedProgramId] || []).map(normalizeKey);
      const normalizedData = allData.map((row) => {
        const newRow: any = {};
        for (const key in row) {
          newRow[normalizeKey(key)] = row[key];
        }
        return newRow;
      });
      const filteredData = normalizedData
        .map((row) => {
          const newRow: any = {};
          (programColumnsMap[selectedProgramId] || []).forEach((header) => {
            const normHeader = normalizeKey(header);
            if (row.hasOwnProperty(normHeader)) {
              newRow[header] = row[normHeader];
            }
          });
          return newRow;
        })
        .filter((row) => Object.keys(row).length > 1);

      setCurrentProgramData(filteredData);
      setYAxis("");
      setYAxis2("");
      setGroupingAxis("municipio");
      setLoading(false);
    } else {
      setCurrentProgramData([]);
      setYAxis("");
    }
  }, [selectedProgramId, allData]);


 const filteredData = useMemo(() => {
    return currentProgramData.filter((item) => {
      const regionalMatch = selectedRegional === "" || item["RGA"] === selectedRegional;
      const municipalityMatch =
        selectedMunicipality === "" || item["MUNICÍPIO"] === selectedMunicipality;
      const entityMatch =
        selectedEntity === "" || item["ENTIDADE CADASTRADA"] === selectedEntity;
      return regionalMatch && municipalityMatch && entityMatch;
    });
  }, [currentProgramData, selectedRegional, selectedMunicipality, selectedEntity]);


  const availableRegionals = useMemo(
    () => ["", ...new Set(currentProgramData.map((item) => item["RGA"]).filter(Boolean))],
    [currentProgramData]
  );

  const availableEntities = useMemo(
    () => ["", ...new Set(currentProgramData.map((item) => item["ENTIDADE CADASTRADA"]).filter(Boolean))],
    [currentProgramData]
  );

  const entityOptions = availableEntities.map((entidade) => ({
    id: entidade,
    label: entidade === "" ? "Todas as Entidades" : entidade,
    value: entidade,
  }));

  const availableMunicipalities = useMemo(
    () => [
      "",
      ...new Set(
        currentProgramData
          .filter(
            (item) => selectedRegional === "" || item["RGA"] === selectedRegional
          )
          .map((item) => item["MUNICÍPIO"])
          .filter(Boolean)
      ),
    ],
    [currentProgramData, selectedRegional]
  );

const numericHeaders = useMemo(() => {
  const currentProgramHeaders = programColumnsMap[selectedProgramId] || [];

  // 🔹 Se for o PAA e estiver agrupando por ano, mostra só as colunas que têm ano no nome
  if (selectedProgramId === "paa" && groupingAxis === "ano") {
    return currentProgramHeaders.filter(
      (header) =>
        header.includes("2023") || header.includes("2024") // só variáveis anuais
    );
  }

  // 🔹 Caso contrário, todas as colunas numéricas (menos chaves fixas)
  return currentProgramHeaders.filter(
    (header) =>
      !["Município", "MUNICÍPIO", "RGA", "Programa", "Unidade"].includes(header)
  );
}, [selectedProgramId, groupingAxis]);



  const yAxisOptions = numericHeaders.map((header) => ({
    id: header,
    label: columnDisplayNames[header] || header,
    value: header,
  }));

  const regionalOptions = availableRegionals.map((regional) => ({
    id: regional,
    label: regional === "" ? "Todas as Regionais" : regional,
    value: regional,
  }));

  const municipalityOptions = availableMunicipalities.map((municipio) => ({
    id: municipio,
    label: municipio === "" ? "Todos os Municípios" : municipio,
    value: municipio,
  }));

  const handleGenerateClick = () => {
    if (selectedProgramId === "paa") {
      if (!yAxis || !yAxis2 || !groupingAxis) {
        toast.error("Selecione as duas variáveis e o tipo de agrupamento para o PAA.");
        return;
      }
    } else if (!selectedProgramId || !yAxis) {
      toast.error("Selecione um programa e a variável numérica.");
      return;
    }

    const programName =
      programs.find((p) => p.id === selectedProgramId)?.label || "";
    const isRegionalSelected = selectedRegional !== "";

    const options =
      selectedProgramId === "paa"
        ? {
            xAxis: groupingAxis,
            yAxis: yAxis,
            yAxis2: yAxis2,
            chartType: chartType,
            programName: programName,
            isRegionalSelected: isRegionalSelected,
            selectedRegional: selectedRegional,
            showGeneral: showGeneral,
          }
        : {
            xAxis: "MUNICÍPIO",
            yAxis: yAxis,
            chartType: chartType,
            programName: programName,
            isRegionalSelected: isRegionalSelected,
            selectedRegional: selectedRegional,
          };

    onGenerate(filteredData, allHeaders, options);
    onClose();
  };

  useEffect(() => {
    if (open) {
      setSelectedProgramId("");
      setYAxis("");
      setYAxis2("");
      setGroupingAxis("municipio");
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
              options={programs.map((p) => ({
                id: p.id,
                label: p.label,
                value: p.id,
              }))}
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
              {selectedProgramId === "paa" && (
                <>
                 <div className="space-y-2">
                  <div className="space-y-2">
                      <Label>Filtrar por Entidade (opcional)</Label>
                      <CustomSelect
                        options={entityOptions}
                        onChange={setSelectedEntity}
                        defaultValue={selectedEntity}
                        placeholder="Todas as Entidades"
                      />
                    </div>
                    <Label>Agrupar por</Label>
                    <CustomRadioGroup
                      options={[
                        {
                          value: "municipio" as const,
                          label: "Município",
                          icon: <Search className="h-4 w-4" />,
                        },
                        {
                          value: "ano" as const,
                          label: "Ano",
                          icon: <GroupingIcon className="h-4 w-4" />,
                        },
                      ]}
                      value={groupingAxis}
                      onValueChange={setGroupingAxis}
                    />
                    {groupingAxis === "ano" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="showGeneral"
                        checked={showGeneral}
                        onChange={(e) => setShowGeneral(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <label htmlFor="showGeneral" className="text-sm cursor-pointer">
                        Exibir Geral (soma total por ano)
                      </label>
                    </div>
                  )}
                  </div>
                  <div className="space-y-2">
                    <Label>Variável para o Eixo Y (1ª)</Label>
                    <CustomSelect
                      options={yAxisOptions.filter(opt => opt.value !== yAxis2)} // 🔹 exclui a já escolhida no 2º
                      onChange={setYAxis}
                      defaultValue={yAxis}
                      placeholder="Selecione a 1ª variável numérica..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Variável para o Eixo Y (2ª)</Label>
                    <CustomSelect
                        options={yAxisOptions.filter(opt => opt.value !== yAxis)} // 🔹 exclui a já escolhida no 1º
                        onChange={setYAxis2}
                        defaultValue={yAxis2}
                        placeholder="Selecione a 2ª variável numérica..."
                      />
                  </div>
                </>
              )}

              {selectedProgramId !== "paa" && (
                <>
                  <div className="space-y-2">
                    <Label>Variável para o Eixo Y</Label>
                   <CustomSelect
                      options={yAxisOptions.filter(opt => opt.value !== yAxis2)} // 🔹 exclui a já escolhida no 2º
                      onChange={setYAxis}
                      defaultValue={yAxis}
                      placeholder="Selecione a 1ª variável numérica..."
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
                </>
              )}

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
            selectedProgramId && (
              <p className="text-center text-gray-500">
                Nenhum dado encontrado para este programa.
              </p>
            )
          )}
        </div>

        <Button
          onClick={handleGenerateClick}
          disabled={
            !selectedProgramId ||
            (selectedProgramId === "paa" ? !yAxis || !yAxis2 : !yAxis) ||
            loading
          }
          className="w-full mt-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Gerar Gráfico
        </Button>
      </DialogContent>
    </Dialog>
  );
}
