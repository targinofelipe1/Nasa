// components/ui/OdeActionsTable.tsx
"use client";

import React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface TableData {
  [key: string]: string | number | undefined;
  NOME?: string;
  Município?: string;
  "Programa/Projeto/Entidade"?: string;
  Status?: string;
  Ano?: string | number;
  Valor?: string | number;
}


interface OdeActionsTableProps {
  headers: string[];
  currentItems: TableData[];
  columnDisplayNames: Record<string, string>;
  handleOpenModal: (action: TableData) => void;
}

export default function OdeActionsTable({
  headers,
  currentItems,
  columnDisplayNames,
  handleOpenModal,
}: OdeActionsTableProps) {
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
                    key === "Município" ? "font-semibold" : "text-gray-900"
                  }`}
                >
                  {String(row[key] ?? "")}
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
