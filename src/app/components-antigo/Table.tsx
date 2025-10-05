interface TableProps {
    data: { rank: number; city: string; region: string; percentage: string }[];
  }
  
  export default function Table({ data }: TableProps) {
    return (
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2">Ranking</th>
            <th className="border border-gray-300 px-4 py-2">Município</th>
            <th className="border border-gray-300 px-4 py-2">Região</th>
            <th className="border border-gray-300 px-4 py-2">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-300 px-4 py-2">{row.rank}</td>
              <td className="border border-gray-300 px-4 py-2">{row.city}</td>
              <td className="border border-gray-300 px-4 py-2">{row.region}</td>
              <td className="border border-gray-300 px-4 py-2">{row.percentage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  