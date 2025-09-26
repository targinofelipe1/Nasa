"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, SquarePen } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog"; // Ajuste o caminho conforme sua estrutura
import { Button } from "@/components/ui/Button"; // Ajuste o caminho conforme sua estrutura
import { Input } from "@/components/ui/Input"; // Ajuste o caminho conforme sua estrutura
// Assumindo que você tem um componente TextArea para Critérios/Avaliação
// Se você não tiver, use um <textarea> HTML simples.
// import { Textarea } from "@/components/ui/Textarea"; 


interface TableData {
  [key: string]: any;
}

interface UpdatePAAModalProps {
  rowData: TableData;
  onUpdate: () => void;
  onClose: () => void;
}

// ⚠️ CHAVES EDITÁVEIS FIXAS PARA O PAA-INSCRIÇÃO
const PAA_EDITABLE_KEYS = ["Quantidade de Filhos","Pontuação", "Critérios", "Avaliação"];

export default function UpdatePAAModal({
  rowData,
  onUpdate,
  onClose,
}: UpdatePAAModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<TableData>(rowData);

  // Use useMemo para inicializar os valores que serão editados
  const initialValues = useMemo(() => {
    const subset: TableData = {};
    PAA_EDITABLE_KEYS.forEach(key => {
      subset[key] = rowData[key] ?? "";
    });
    return subset;
  }, [rowData]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);

    try {
      // Cria o payload de updates APENAS com as chaves permitidas
      const updates = PAA_EDITABLE_KEYS.map((key) => ({
        key,
        // É crucial passar o número da linha para a API saber qual registro atualizar
        row: rowData.__rowNumber || rowData.rowIndex + 2, // Use a linha correta
        originalValue: rowData[key],
        value: values[key],
      }));

      const payload = {
        updates,
        programa: "paa-inscricao", // ⚠️ CHAVE DO PROGRAMA CORRETA PARA A API
        userId,
        municipio: rowData["Município"], // Mantendo contexto
      };

      // ⚠️ Ajuste a rota da API se for diferente (ex: '/api/paa')
      const response = await fetch(`/api/paa-inscricao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar os dados do PAA.");

      toast.success("Pontuação e Avaliação atualizadas com sucesso!");
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("❌ Erro ao atualizar o PAA:", error);
      toast.error(error.message || "Erro ao salvar as alterações do PAA.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <DialogHeader className="p-4 border-b">
        <DialogTitle>Atualizar Pontuação e Avaliação PAA</DialogTitle>
        <DialogDescription>
          Produtor(a): <strong>{rowData["Nome"]}</strong> | 
          Município: <strong>{rowData["Município"]}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="p-4 space-y-6">
        {PAA_EDITABLE_KEYS.map((key) => (
          <div key={key}>
            <label 
              htmlFor={key.toLowerCase()} 
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              {key}
            </label>

            {/* Renderização condicional para o tipo de input */}
            {key === "Pontuação" ? (
              <Input
                id={key.toLowerCase()}
                type="number"
                value={values[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={loading}
                placeholder="Insira a pontuação..."
              />
            ) : (
              // Use um <textarea> ou um componente Textarea (se você o tiver) 
              // para Critérios e Avaliação, que geralmente são textos longos.
              <textarea
                id={key.toLowerCase()}
                rows={key === "Critérios" ? 3 : 5}
                value={values[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={loading}
                placeholder={`Detalhe o campo ${key.toLowerCase()}...`}
                className="mt-1 w-full border rounded-md p-2 text-sm focus:ring-primary focus:border-primary transition duration-150"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end p-4 border-t gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <SquarePen className="mr-2 h-4 w-4" /> Salvar Avaliação
            </>
          )}
        </Button>
      </div>
    </>
  );
}