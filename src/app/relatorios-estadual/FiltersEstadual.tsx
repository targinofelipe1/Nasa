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

  const handleRegionalChange = (regionais: string[]) => {
    setSelectedRegional(regionais);
    onRegionalChange(regionais);

    const municipios = data
      .filter(row => regionais.includes(row.RGA))
      .map(row => row.Município)
      .sort();

    setMunicipiosFiltrados(municipios);
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg mb-12">
      <RegionalFilter data={data} onFilterChange={handleRegionalChange} selectedRegionals={selectedRegional}/>

      {selectedRegional.length > 0 && (
        <div className="mt-4 p-3 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold">Municípios da Regional Selecionada:</h3>
          {municipiosFiltrados.length > 0 ? (
            <>
              <ul className="mt-2 text-sm text-gray-700">
                {municipiosFiltrados.map((municipio, index) => {
                  const rga = data.find(row => row.Município === municipio)?.RGA;

                  return (
                    <li key={index} className="border-b py-1">
                      {municipio}
                      {selectedRegional.length > 1 && rga && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({rga} Regional)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="h-8" />
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Nenhum município encontrado para essa regional.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltersEstadual;
