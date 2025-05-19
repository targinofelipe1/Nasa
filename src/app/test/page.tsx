'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/sheets');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Erro ao buscar os dados.');
        console.error(err);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Dados da Planilha</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data.length > 0 ? (
        <table border={1} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {data[0].map((header: string, index: number) => (
                <th key={index} style={{ padding: '8px', border: '1px solid black', background: '#ddd' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell: string, cellIndex: number) => (
                  <td key={cellIndex} style={{ padding: '8px', border: '1px solid black' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Carregando dados...</p>
      )}
    </div>
  );
}
