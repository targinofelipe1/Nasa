"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, SquarePen, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/app/components-antigo/Button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Input } from "@/app/components-antigo/Input";

interface TableData {
  [key: string]: any;
}

interface UpdateProgramModalProps {
  rowData: TableData;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  programName: string;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const columnDisplayNames: Record<string, string> = {
  Município: "Município",
  'CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ': 'Famílias em Pobreza',
  'CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ':'Famílias Baixa Renda',
  'CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ': 'Famílias Renda Acima de 1/2 S.M.',
  'CADASTRO ÚNICO - Total de Familias CadÚnico': 'Quantidade de Famílias Inscritas',
  'CADASTRO ÚNICO - Total de Pessoas CadÚnico': 'Quantidade de Pessoas Inscritas',
  'CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ': 'Pessoas em Pobreza',
  'CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ': 'Pessoas em Baixa Renda',
  'CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ': 'Pessoas com renda acima de meio salário mínino',
  'CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico': 'Famílias UNIPESSOAIS',
  'CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos': 'Pessoas com 0 a 6 anos',
  'CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais': 'Pessoas com 60 ou mais anos',
  'CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único': 'Pessoas com deficiência',
  'CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único': 'Famílias Indígenas',
  'CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único': 'Famílias Quilombolas',
  'CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único': 'Famílias em situação de rua',
  'CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único': 'Famílias GPTE',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)': 'Ensino Fundamental (Incompleto/Completo)',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)': 'Ensino Médio (Incompleto/Completo)',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)': 'Ensino Superior (Incompleto/Completo)',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que não exerceram trabalho remunerado nos últimos 12 meses': 'Sem Trabalho Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que Exerceram trabalho remunerado nos últimos 12 meses': 'Com Trabalho Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico  por função principal - Trabalhador por conta própria': 'Trabalhador Autônomo',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural': 'Trabalhador Rural Temporário',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada': 'Empregado Sem Carteira',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada': 'Empregado Com Carteira',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada': 'Trabalhador Doméstico',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado': 'Trabalhador Não-Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público': 'Militar/Servidor Público',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador': 'Empregador',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz': 'Estagiário/Aprendiz',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias Indígenas beneficiárias do Programa Bolsa Família': 'Famílias Indígenas',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias Quilombolas beneficiárias do Programa Bolsa Família': 'Famílias Quilombolas',
  'PROGRAMA BOLSA FAMÍLIA - Famílias em Situação de rua beneficiárias do Programa Bolsa Família': 'Famílias em situação de rua',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias em GPTE beneficiárias do Programa Bolsa Família': 'Famílias GPTE',
   "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024":
    "Total Famílias",
  "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024":
    "Famílias em Pobreza",
  "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024":
    "Famílias Baixa Renda",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024":
    "Total de Pessoas",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218":
    "Pessoas em Pobreza",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024":
    "Pessoas Baixa Renda",
    "Proteção Social Básica - Unidade de CRAS": "Unidade de CRAS",
    'Segurança Alimentar - Programa "Tá na mesa" (municípios)': 'Municípios atendidos',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia': 'Refeições/dia',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual': 'Refeições/ano',
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual': 'Valor anual',
  'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)': 'Novo Tá na Mesa (Refeições/dia)',
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual': 'Novo Tá na Mesa (Valor anual)',
  'Segurança Alimentar - Cartão Alimentação  (municípios)': 'Municípios atendidos',
  'Segurança Alimentar - Cartão Alimentação  (beneficiários)': 'Beneficiários',
  'Segurança Alimentar - Cartão Alimentação - valor por município': 'Valor por município',
  'Segurança Alimentar - Restaurante Popular (municípios)': 'Restaurante Popular (municípios)',
  'Segurança Alimentar - PAA LEITE (municípios)': 'PAA Leite (municípios)',
  'Segurança Alimentar - PAA LEITE (beneficiários)': 'PAA Leite (beneficiários)',
  'Segurança Alimentar - PAA LEITE (investimento)': 'PAA Leite (investimento)',
  'Segurança Alimentar - PAA CDS (municípios)': 'PAA CDS (municípios)',
  'Segurança Alimentar - PAA CDS (beneficiários)': 'PAA CDS (beneficiários)',
  'Segurança Alimentar - PAA CDS (investimento anual)': 'PAA CDS (investimento anual)',
  'Segurança Alimentar - Cisternas (quantidade no município)': 'Cisternas (quantidade)',
  'Segurança Alimentar - Cisternas (valor investido em 2025': 'Cisternas (valor investido)',
  'Segurança Alimentar - Insegurança Alimentar - Índice de INSAN': 'Índice de INSAN',
  'Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN': 'Categorias de INSAN',
  "Quantidade de Casa da Cidadania": "Quantidade de Casa da Cidadania",
  "Posto do SINE": "Posto do SINE",
  "BPC/RMV  - Total de beneficiários BPC/RMV": "Total de Beneficiários BPC/RMV",
  "BPC/RMV  - Total de beneficiários BPC/RMV no Cadastro Único": "Total de Beneficiários no CadÚnico",
  "Saúde - Vacinas (doses aplicadas)": "Doses de Vacinas Aplicadas",
  "Saúde - Hospital Geral": "Hospital Geral",
  "Saúde - Centro de Saúde/Unidade Básica de Saúde": "Centro de Saúde/UBS",
  "Saúde - Posto de Saúde": "Posto de Saúde",
};



// 🔹 Normalizador igual ao backend
const normalize = (str: string) =>
  str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

export default function UpdateProgramModal({
  rowData,
  rowIndex,
  onUpdate,
  onClose,
  programName,
  activeTab,
  tabGroups,
}: UpdateProgramModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);

  // Campos editáveis da aba atual
  const editableKeys = useMemo(() => {
    const currentTabKeys = tabGroups[activeTab] || [];
    return currentTabKeys.filter(
      (key) => key !== "CÓDIGO IBGE" && key !== "Município"
    );
  }, [activeTab, tabGroups]);

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<TableData>(rowData);

  const handleUpdate = async (shouldClose: boolean) => {
    setLoading(true);

    if (!userId) {
      toast.error("Erro: Usuário não autenticado.");
      setLoading(false);
      return;
    }

    // Linha real na planilha (headers estão na linha 1 → +2)
    const sheetRowIndex = rowIndex + 2;

    try {
      const updates = editableKeys.map((key) => {
        let sheetKey = key;

        // 🔹 Para ODE: casar pelo header real da planilha
        if (programName === "ode") {
          sheetKey =
            Object.keys(rowData).find(
              (h) => normalize(h) === normalize(key)
            ) || key;
        }

        const updateObj = {
          key: sheetKey, // agora garantimos que casa com o header da planilha
          normalizedKey: normalize(sheetKey),
          displayName: columnDisplayNames[key] || key,
          row: sheetRowIndex,
          originalValue: rowData[sheetKey],
          value: values[key],
        };

        console.log("🔹 Campo preparado para update:", updateObj);
        return updateObj;
      });

      const payload = {
        updates,
        programa: programName,
        userId,
        municipio: rowData["Município"],
      };

      console.log("📌 Payload enviado para a API (/api/sheets):", payload);

      const response = await fetch(`/api/sheets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro da API:", errorData);
        throw new Error(errorData.message || "Erro ao atualizar a planilha.");
      }

      toast.success("Dados atualizados com sucesso!");
      onUpdate();
      if (shouldClose) onClose();
    } catch (error: any) {
      console.error("❌ Erro ao atualizar a planilha:", error);
      toast.error(error.message || "Erro ao atualizar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Caso não tenha nada editável na aba
  if (editableKeys.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Não há campos editáveis nesta aba.</p>
        <Button onClick={onClose} className="mt-4">
          Fechar
        </Button>
      </div>
    );
  }

  const currentKey = editableKeys[currentStep];
  const currentDisplayName = columnDisplayNames[currentKey] || currentKey;

  return (
    <>
      <DialogHeader className="p-4 border-b">
        <DialogTitle>Atualizar Dados do Município</DialogTitle>
        <DialogDescription>
          Município: <strong>{rowData["Município"]}</strong>
        </DialogDescription>
      </DialogHeader>

      {/* Campo de edição */}
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium">
            {currentDisplayName}
          </label>
          <Input
            type="text"
            value={values[currentKey] || ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [currentKey]: e.target.value }))
            }
            disabled={loading}
            className="mt-2"
          />
        </div>
      </div>

      {/* Navegação e botões */}
      <div className="flex justify-between p-4 border-t gap-2 items-center">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <div className="flex space-x-2">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          )}

          <Button onClick={() => handleUpdate(true)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <SquarePen className="mr-2 h-4 w-4" /> Salvar
              </>
            )}
          </Button>

          {currentStep < editableKeys.length - 1 && (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={loading}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
