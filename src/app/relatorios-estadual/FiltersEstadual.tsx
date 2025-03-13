"use client";

import RegionalFilter from "@/components/ui/RegionalFilter";
import { useState } from "react";

interface FiltersProps {
  data: { Município: string; RGA: string }[];
  onRegionalChange: (selectedRegionals: string[]) => void;
}

const FiltersEstadual: React.FC<FiltersProps> = ({ data, onRegionalChange }) => {
  const [selectedRegional, setSelectedRegional] = useState<string[]>([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<string[]>([]);

  // Atualiza a lista de municípios ao selecionar uma regional
  const handleRegionalChange = (regionais: string[]) => {
    setSelectedRegional(regionais);
    onRegionalChange(regionais);

    // Filtra os municípios pertencentes à(s) regional(is) selecionada(s)
    const municipios = data
      .filter(row => regionais.includes(row.RGA)) // Filtra por RGA selecionado
      .map(row => row.Município) // Obtém os nomes dos municípios
      .sort(); // Ordena em ordem alfabética

    setMunicipiosFiltrados(municipios);
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg sticky top-4">
      {/* Filtro de Regional */}
      <RegionalFilter data={data} onFilterChange={handleRegionalChange} />

      {/* Lista de municípios pertencentes à regional selecionada */}
      {selectedRegional.length > 0 && (
        <div className="mt-4 p-3 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold">Municípios da Regional Selecionada:</h3>
          {municipiosFiltrados.length > 0 ? (
            <ul className="mt-2 text-sm text-gray-700">
              {municipiosFiltrados.map((municipio, index) => (
                <li key={index} className="border-b py-1">{municipio}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Nenhum município encontrado para essa regional.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltersEstadual;
