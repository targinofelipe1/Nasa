"use client";

import { FC, useState, useEffect } from "react";
import RegionalFilter from "./RegionalFilter";
import MunicipalFilter from "./MunicipalFilter";

interface CombinedFiltersProps {
  data: { RGA: string; "Município": string }[];
  onFilterChange: (selectedRegionals: string[], selectedMunicipalities: string[]) => void;
}

const CombinedFilters: FC<CombinedFiltersProps> = ({ data, onFilterChange }) => {
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<{ "Município": string; RGA: string }[]>([]);

  useEffect(() => {
    if (selectedRegionals.length > 0) {
      const filtered = data.filter(row => selectedRegionals.includes(row.RGA));
      setAvailableMunicipalities(filtered);
    } else {
      setAvailableMunicipalities(data);
    }
  }, [selectedRegionals, data]);

  const handleRegionalChange = (regionals: string[]) => {
    setSelectedRegionals(regionals);
    // Não limpa selectedMunicipalities.
    // Apenas envia o novo estado de filtros para o componente pai.
    onFilterChange(regionals, selectedMunicipalities);
  };

  const handleMunicipalChange = (municipalities: string[]) => {
    setSelectedMunicipalities(municipalities);
    // Não limpa selectedRegionals.
    // Apenas envia o novo estado de filtros para o componente pai.
    onFilterChange(selectedRegionals, municipalities);
  };

  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg w-full">
      <h3 className="text-lg font-bold mb-2">Filtros</h3>
      <RegionalFilter
        data={data}
        onFilterChange={handleRegionalChange}
        selectedRegionals={selectedRegionals}
      />
      <div className="mt-4">
        <MunicipalFilter
          data={availableMunicipalities}
          onFilterChange={handleMunicipalChange}
          selectedMunicipals={selectedMunicipalities}
        />
      </div>
    </div>
  );
};

export default CombinedFilters;