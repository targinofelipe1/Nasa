// components/ui/CustomAuditTable.tsx
import React from 'react';

interface AuditDetailsItem {
  campo: string;
  valorAntigo: string;
  novoValor: string;
}

interface CustomAuditTableProps {
  details: AuditDetailsItem[];
}

export default function CustomAuditTable({ details }: CustomAuditTableProps) {
  return (
    <div className="p-4 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Campo</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Valor Antigo</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Novo Valor</th>
          </tr>
        </thead>
        <tbody>
          {details.map((item, index) => (
            <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.campo}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{item.valorAntigo}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{item.novoValor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}