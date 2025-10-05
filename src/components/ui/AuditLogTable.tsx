// components/ui/AuditLogTable.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Button } from "@/app/components-antigo/Button";


// Interface de cada registro da tabela
export interface TableData {
  [key: string]: string | number;
  timestamp: string;
  userId: string;
  programa: string;
  municipio: string;
  campo: string;
  summary: string;
}

interface AuditLogTableProps {
  headers: string[];
  currentItems: TableData[];
  columnDisplayNames: Record<string, string>;
  programDisplayNames: Record<string, string>;
  getUserName: (id: string) => string; // ✅ já vem da page e retorna o nome do usuário
  handleOpenModal: (logEntry: TableData) => void;
}

export default function AuditLogTable({
  headers,
  currentItems,
  columnDisplayNames,
  programDisplayNames,
  getUserName,
  handleOpenModal,
}: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((key) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {columnDisplayNames[key] || key}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentItems.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((key, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    key === "municipio" ? "font-semibold" : "text-gray-900"
                  }`}
                >
                  {key === "timestamp"
                    ? format(new Date(row[key]), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : key === "userId"
                    ? getUserName(String(row[key])) // ✅ mostra o nome do usuário
                    : key === "programa"
                    ? programDisplayNames[String(row[key])] || String(row[key])
                    : String(row[key])}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(row)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
