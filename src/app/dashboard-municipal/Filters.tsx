// src/components/ui/Filters.tsx
import MunicipalFilter from "@/components/ui/MunicipalFilter";
import { FC } from "react";

interface FiltersProps {
  data: { Município: string }[];
  onFilterChange: (selectedMunicipals: string[]) => void;
  selectedMunicipalities: string[]; // ➡️ Adiciona a nova prop
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange, selectedMunicipalities }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg">
      <MunicipalFilter
        data={data}
        onFilterChange={onFilterChange}
        selectedMunicipalities={selectedMunicipalities} // ➡️ Passa a prop para o componente filho
      />
    </div>
  );
};

export default Filters;