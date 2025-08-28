// components/ui/SimpleTable.tsx
import React from 'react';

interface SimpleTableProps {
  headers: string[];
  data: any[];
}

export default function SimpleTable({ headers, data }: SimpleTableProps) {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          {headers.map((header, index) => (
            <th key={index} className="border border-gray-300 px-4 py-2">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="text-center">
            {Object.values(row).map((value: any, colIndex) => (
              <td key={colIndex} className="border border-gray-300 px-4 py-2">
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}