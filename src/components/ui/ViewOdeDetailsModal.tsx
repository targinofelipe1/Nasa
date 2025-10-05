"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChangeEntry {
  campo: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  timestamp: string;
  programa: string;
  municipio: string;
}

interface ViewOdeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  changes: ChangeEntry[];
}

export default function ViewOdeDetailsModal({
  open,
  onClose,
  changes,
}: ViewOdeDetailsModalProps) {
  if (!changes || changes.length === 0) return null;

  // 🔹 Usa o primeiro registro para cabeçalho
  const header = changes[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Detalhes da Alteração
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Programa: <span className="font-semibold">{header.programa}</span> |{" "}
            Município: <span className="font-semibold">{header.municipio}</span>
          </p>
          <p className="text-xs text-gray-500">
            Data:{" "}
            {format(new Date(header.timestamp), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </DialogHeader>

        {/* 🔹 Tabela de alterações */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-600">
                  Campo
                </th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase text-red-500">
                  Valor Antigo
                </th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase text-green-600">
                  Novo Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 text-sm font-medium text-gray-800">
                    {change.campo}
                  </td>
                  <td className="px-4 py-2 text-sm text-red-600">
                    {change.oldValue || "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-green-600">
                    {change.newValue || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
