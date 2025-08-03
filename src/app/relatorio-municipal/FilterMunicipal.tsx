"use client";

import { useState } from "react";
import MunicipalFilter from "@/components/ui/MunicipalFilter";

interface FiltersProps {
  data: { Município: string; RGA?: string }[]; // ✅ RGA opcional
  onMunicipalChange: (selectedMunicipals: string[]) => void;
}

const FiltersMunicipal: React.FC<FiltersProps> = ({ data, onMunicipalChange }) => {
  const [selectedMunicipals, setSelectedMunicipals] = useState<string[]>([]);
  const [regionaisAssociadas, setRegionaisAssociadas] = useState<string[]>([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<string[]>([]);

  const handleMunicipalChange = (municipals: string[]) => {
    setSelectedMunicipals(municipals);
    onMunicipalChange(municipals);

    if (municipals.length > 0) {
      const uniqueRegionais = [...new Set(
        data
          .filter((row) => municipals.includes(row.Município))
          .map((row) => row.RGA)
          .filter(Boolean) as string[]
      )];
      setRegionaisAssociadas(uniqueRegionais.sort());
      setMunicipiosFiltrados(municipals.sort());
    } else {
      setRegionaisAssociadas([]);
      setMunicipiosFiltrados([]);
    }
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg mb-12">
      <MunicipalFilter
        data={data}
        onFilterChange={handleMunicipalChange}
        selectedMunicipals={selectedMunicipals}
      />

      {selectedMunicipals.length > 0 && (
        <div className="mt-4 p-3 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold">Municípios Selecionados:</h3>
          <ul className="mt-2 text-sm text-gray-700">
            {municipiosFiltrados.map((municipio, index) => {
              const rga = data.find((row) => row.Município === municipio)?.RGA;

              return (
                <li key={index} className="border-b py-1">
                  {municipio}
                  {regionaisAssociadas.length > 1 && rga && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({rga} Regional)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {regionaisAssociadas.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Pertencem à(s) Regional(is): <strong>{regionaisAssociadas.join(", ")}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltersMunicipal;
