"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, SquarePen, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TableData {
  [key: string]: any;
}

interface UpdateOdeModalProps {
  rowData: TableData;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

// 🔹 Display amigável só para ODE
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

// 🔹 Normalizador igual ao backend
const normalize = (str: string) =>
  str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

export default function UpdateOdeModal({
  rowData,
  rowIndex,
  onUpdate,
  onClose,
  activeTab,
  tabGroups,
}: UpdateOdeModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);

  // Campos editáveis da aba atual
  const editableKeys = useMemo(() => {
    const currentTabKeys = tabGroups[activeTab] || [];
    return currentTabKeys.filter(
        (key) => key !== "CÓDIGO IBGE" && key !== "Município" && key !== "NOME"

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

    try {
      const updates = editableKeys.map((key) => {
        // sempre casa pelo header real vindo da planilha
        const sheetKey =
          Object.keys(rowData).find((h) => normalize(h) === normalize(key)) || key;

        return {
          key: sheetKey, // header real da planilha
          row: rowData.__rowNumber || rowIndex + 2, // preferir __rowNumber se vier do GET
          originalValue: rowData[sheetKey],
          value: values[sheetKey],
        };
      });

      const payload = {
        updates,
        programa: "ode",
        userId,
        municipio: rowData["Município"],
      };

      console.log("📌 Payload enviado para a API (/api/ode):", payload);

      const response = await fetch(`/api/ode`, {
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
      console.error("❌ Erro ao atualizar a planilha ODE:", error);
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
          <label className="text-sm font-medium">{currentDisplayName}</label>
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
