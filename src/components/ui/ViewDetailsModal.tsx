// components/ui/ViewDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Loader2 } from "lucide-react";
import CustomAuditTable from "./CustomAuditTable";

interface ViewDetailsModalProps {
  open: boolean;
  onClose: () => void;
  logEntry: any;
}

interface AuditDetailsItem {
  campo: string;
  valorAntigo: string;
  novoValor: string;
}

const parseLogDetails = (logEntry: any): AuditDetailsItem[] => {
  if (!logEntry || !logEntry.campo) {
    return [];
  }
  
  const details: AuditDetailsItem[] = [];
  const regex = /Campo '([^']+)' de '([^']+)' para '([^']+)'/;
  const match = String(logEntry.campo).match(regex);

  if (match) {
    details.push({
      campo: match[1],
      valorAntigo: match[2],
      novoValor: match[3],
    });
  }

  // Fallback para logs antigos ou diferentes
  if (details.length === 0 && logEntry.summary) {
    const summaryRegex = /(.+): (.+) -> (.+)/;
    const summaryMatch = String(logEntry.summary).match(summaryRegex);
    if (summaryMatch) {
      details.push({
        campo: summaryMatch[1].trim(),
        valorAntigo: summaryMatch[2].trim(),
        novoValor: summaryMatch[3].trim(),
      });
    }
  }

  return details;
};

const programDisplayNames: Record<string, string> = {
  'bolsa-familia': 'Bolsa Família', 
  'cadastro-unico': 'Cadastro Único', 
  "protecao-basica": "Proteção Social Básica",
  "seguranca-alimentar": "Segurança Alimentar",
  "casa-da-cidadania-e-sine": "Casa da Cidadania e SINE",
  "bpc-rmv": "BPC/RMV",
  "saude": "Saúde",
};

export default function ViewDetailsModal({ open, onClose, logEntry }: ViewDetailsModalProps) {
  const [details, setDetails] = useState<AuditDetailsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setDetails([]);
      return;
    }
    setLoading(true);
    setDetails(parseLogDetails(logEntry));
    setLoading(false);
  }, [open, logEntry]);

  if (!open || !logEntry) {
    return null;
  }

  const programTitle = programDisplayNames[logEntry.programa] || logEntry.programa;
  const timestamp = format(new Date(logEntry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Detalhes da Alteração</DialogTitle>
          <div className="text-sm text-gray-500">
            Programa: {programTitle} | Município: {logEntry.municipio}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Data: {timestamp}
          </div>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : details.length > 0 ? (
          <CustomAuditTable details={details} />
        ) : (
          <div className="text-center text-gray-500 p-4">
            Nenhum detalhe de alteração encontrado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}