"use client";

import { useEffect, useState } from "react";

type RankingItem = {
  rank: number;
  municipio: string;
  idh: number;
  taxaCrescimento: number;
  taxaAlfabetizacao: number;
  pibPerCapita: number;
  populacaoPobreza: number;
  indiceGini: number;
};

// ➡️ Novo tipo para chaves de ordenação, excluindo 'rank' e 'municipio'
type SortableRankingKeys = Exclude<keyof RankingItem, 'rank' | 'municipio'>;

export default function Ranking({ data = [] }: { data?: any[] }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ➡️ Usa o novo tipo para sortColumn
  const [sortColumn, setSortColumn] = useState<SortableRankingKeys>("idh");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const columns: { key: SortableRankingKeys; label: string }[] = [
    { key: "idh", label: "IDH-M" },
    { key: "taxaCrescimento", label: "Taxa de Crescimento (%)" },
    { key: "taxaAlfabetizacao", label: "Taxa de Alfabetização (%)" },
    { key: "pibPerCapita", label: "PIB Per Capita" },
    { key: "populacaoPobreza", label: "% da População em Pobreza" },
    { key: "indiceGini", label: "Índice de Gini" },
  ];

  const findKey = (columnName: string) => {
    if (!data || data.length === 0 || !data[0]) return "";
    return Object.keys(data[0]).find(
      (key) => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.trim().toLowerCase()
    ) as string;
  };

  const parseNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "number") return value;
    const cleanValue = value
      .toString()
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
      .trim();
    return parseFloat(cleanValue) || 0;
  };

  const formatNumber = (value: number | string, isCurrency = false): string => {
    if (typeof value === "string") {
      value = parseNumber(value);
    }
    if (isNaN(value) || value === 0) return "-";
    
    return isCurrency
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value)
      : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  useEffect(() => {
    if (!data || data.length === 0) {
      setRanking([]);
      return;
    }
    
    const municipioKey = findKey("Município");
    const idhKey = findKey("IDH_M (IBGE, 2010)");
    const taxaCrescimentoKey = findKey("Taxa de Crescimento da População (Censo 2010 x Censo 2022)");
    const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
    const pibPerCapitaKey = findKey("PIB Per Capita em R$ 1.000 - ano de 2021) (6)");
    const populacaoPobrezaKey = findKey("CADASTRO ÚNICO - Porcentagem de Pobreza de acordo com a população em situação de pobreza inscrita no CadÚnico x Censo 2022");
    const indiceGiniKey = findKey("Saúde - Índice de Gini (IBGE, 2010)");
    
    // ➡️ Mapeia os dados brutos para um formato de objeto
    let processedData = data
      .map((row) => ({
        municipio: row[municipioKey] || "Desconhecido",
        idh: parseNumber(row[idhKey]),
        taxaCrescimento: parseNumber(row[taxaCrescimentoKey]),
        taxaAlfabetizacao: parseNumber(row[taxaAlfabetizacaoKey]),
        pibPerCapita: parseNumber(row[pibPerCapitaKey]),
        populacaoPobreza: parseNumber(row[populacaoPobrezaKey]),
        indiceGini: parseNumber(row[indiceGiniKey]),
      }));
      
    // ➡️ Ordena os dados antes de adicionar a propriedade 'rank'
    processedData.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Adiciona o rank após a ordenação
    const finalRanking = processedData.map((item, index) => ({ ...item, rank: index + 1 }));

    setRanking(finalRanking);

  }, [data, sortColumn, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortColumn, sortOrder, data]);
  
  const paginatedRanking = ranking.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(ranking.length / itemsPerPage);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold">Ranking</h2>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <label className="text-lg">Ordenar por:</label>
        <select
          className="px-4 py-2 border rounded-lg bg-white shadow-sm w-full sm:w-auto"
          value={sortColumn}
          onChange={(e) => setSortColumn(e.target.value as SortableRankingKeys)}
        >
          {columns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>

        <button
          className="px-4 py-2 border rounded-lg shadow-sm transition-transform duration-200 hover:scale-105 bg-blue-500 text-white w-full sm:w-auto"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? "⬆ Crescente" : "⬇ Decrescente"}
        </button>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 whitespace-nowrap">Posição Geral</th>
              <th className="border border-gray-300 px-4 py-2 whitespace-nowrap">Município</th>
              {columns.map((col) => (
                <th key={col.key} className="border border-gray-300 px-4 py-2 whitespace-nowrap">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRanking.map((row) => (
              <tr key={`${row.rank}-${row.municipio}`} className="text-center">
                <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">
                  {row.rank}º
                </td>
                <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">{row.municipio}</td>
                {columns.map((col) => (
                  <td key={col.key} className="border border-gray-300 px-4 py-2 whitespace-nowrap">
                    {col.key === "pibPerCapita"
                      ? formatNumber(row[col.key], true)
                      : formatNumber(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-center mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          className={`px-4 py-2 rounded-md transition-all duration-300 ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
          }`}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ← Anterior
        </button>

        <span className="px-4 py-2 text-lg font-semibold">
          Página {currentPage} de {totalPages}
        </span>

        <button
          className={`px-4 py-2 rounded-md transition-all duration-300 ${
            currentPage * itemsPerPage >= ranking.length
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
          }`}
          disabled={currentPage * itemsPerPage >= ranking.length}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
}