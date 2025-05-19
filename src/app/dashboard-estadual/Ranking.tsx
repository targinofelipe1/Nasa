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

export default function Ranking({ data = [] }: { data?: any[] }) {
  const [fullRanking, setFullRanking] = useState<RankingItem[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [sortColumn, setSortColumn] = useState<keyof RankingItem>("idh");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const columns: { key: keyof RankingItem; label: string }[] = [
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
    return parseFloat(
      value
        .toString()
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
        .trim()
    ) || 0;
  };

  const formatNumber = (value: number | string, isCurrency = false): string => {
    if (typeof value === "string") {
      value = parseFloat(value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
    }
    if (isNaN(value) || value === 0) return "-";
    
    return isCurrency
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
      : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const calculateCompleteRanking = (data: any[]): RankingItem[] => {
    const municipioKey = findKey("Município");
    const idhKey = findKey("IDH_M (IBGE, 2010)");
    const taxaCrescimentoKey = findKey("Taxa de Crescimento da População (Censo 2010 x Censo 2022)");
    const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
    const pibPerCapitaKey = findKey("PIB Per Capita em R$ 1.000 - ano de 2021) (6)");
    const populacaoPobrezaKey = findKey("CADASTRO ÚNICO - Porcentagem de Pobreza de acordo com a população em situação de pobreza inscrita no CadÚnico x Censo 2022");
    const indiceGiniKey = findKey("Saúde - Índice de Gini (IBGE, 2010)");

    return data
      .map((row) => ({
        municipio: row[municipioKey] || "Desconhecido",
        idh: parseNumber(row[idhKey]),
        taxaCrescimento: parseNumber(row[taxaCrescimentoKey]),
        taxaAlfabetizacao: parseNumber(row[taxaAlfabetizacaoKey]),
        pibPerCapita: parseNumber(row[pibPerCapitaKey]),
        populacaoPobreza: parseNumber(row[populacaoPobrezaKey]),
        indiceGini: parseNumber(row[indiceGiniKey]),
      }))
      .sort((a, b) => b.idh - a.idh) // Ordena por IDH por padrão
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    const completeRanking = calculateCompleteRanking(data);
    setFullRanking(completeRanking);

    const municipioKey = findKey("Município");
    const idhKey = findKey("IDH_M (IBGE, 2010)");
    const taxaCrescimentoKey = findKey("Taxa de Crescimento da População (Censo 2010 x Censo 2022)");
    const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
    const pibPerCapitaKey = findKey("PIB Per Capita em R$ 1.000 - ano de 2021) (6)");
    const populacaoPobrezaKey = findKey("CADASTRO ÚNICO - Porcentagem de Pobreza de acordo com a população em situação de pobreza inscrita no CadÚnico x Censo 2022");
    const indiceGiniKey = findKey("Saúde - Índice de Gini (IBGE, 2010)");

    const filteredData = data
      .map((row) => {
        const municipio = row[municipioKey] || "Desconhecido";
        const globalItem = completeRanking.find(item => item.municipio === municipio);
        
        return {
          rank: globalItem?.rank || 0,
          municipio,
          idh: parseNumber(row[idhKey]),
          taxaCrescimento: parseNumber(row[taxaCrescimentoKey]),
          taxaAlfabetizacao: parseNumber(row[taxaAlfabetizacaoKey]),
          pibPerCapita: parseNumber(row[pibPerCapitaKey]),
          populacaoPobreza: parseNumber(row[populacaoPobrezaKey]),
          indiceGini: parseNumber(row[indiceGiniKey]),
        };
      })
      .sort((a, b) => (sortOrder === "asc" ? a[sortColumn] - b[sortColumn] : b[sortColumn] - a[sortColumn]));

    setRanking(filteredData);
  }, [data, sortColumn, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortColumn, sortOrder, data]);

  const paginatedRanking = ranking.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold">Ranking</h2>

      {/* Ordenação */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-lg">Ordenar por:</label>
        <select
          className="px-4 py-2 border rounded-lg bg-white shadow-sm"
          value={sortColumn}
          onChange={(e) => setSortColumn(e.target.value as keyof RankingItem)}
        >
          {columns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>

        {/* Botão para alternar ordem */}
        <button
          className="px-4 py-2 border rounded-lg shadow-sm transition-transform duration-200 hover:scale-105 bg-blue-500 text-white"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? "⬆ Crescente" : "⬇ Decrescente"}
        </button>
      </div>

      {/* Tabela */}
      <table className="w-full border-collapse border border-gray-300 mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2">Posição Geral</th>
            <th className="border border-gray-300 px-4 py-2">Município</th>
            {columns.map((col) => (
              <th key={col.key} className="border border-gray-300 px-4 py-2">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRanking.map((row) => (
            <tr key={`${row.rank}-${row.municipio}`} className="text-center">
              <td className="border border-gray-300 px-4 py-2">
                {row.rank}º
                {ranking.length < fullRanking.length && (
                  <span className="text-xs text-gray-500 block">de {fullRanking.length}</span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2">{row.municipio}</td>
              {columns.map((col) => (
                <td key={col.key} className="border border-gray-300 px-4 py-2">
                  {col.key === "pibPerCapita"
                    ? formatNumber(row[col.key], true)
                    : formatNumber(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="flex justify-center mt-4 space-x-2">
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
          Página {currentPage} de {Math.ceil(ranking.length / itemsPerPage)}
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