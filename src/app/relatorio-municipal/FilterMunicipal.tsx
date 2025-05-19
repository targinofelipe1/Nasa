"use client";

import MunicipalFilter from "@/components/ui/MunicipalFilter";
import { useState } from "react";

interface FiltersProps {
  data: { Município: string; RGA: string }[];
  onMunicipalChange: (selectedMunicipals: string[]) => void;
}


const normalizeString = (str: string) => {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
};

const FiltersMunicipal: React.FC<FiltersProps> = ({ data, onMunicipalChange }) => {
  const [selectedMunicipal, setSelectedMunicipal] = useState<string[]>([]);

  
  const handleMunicipalChange = (municipios: string[]) => {
    setSelectedMunicipal(municipios);
    onMunicipalChange(municipios);
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg sticky top-4">
      
      <MunicipalFilter data={data} onFilterChange={handleMunicipalChange} />
    </div>
  );
};

export default FiltersMunicipal;
