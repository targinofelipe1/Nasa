// src/components/ui/Filters.tsx
import { FC } from "react";
import RegionalFilter from "@/components/ui/RegionalFilter";

interface FiltersProps {
  data: { RGA: string }[];
  onFilterChange: (selectedRegionals: string[]) => void;
  selectedRegionals: string[]; // ➡️ Adiciona a nova prop
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange, selectedRegionals }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg w-full">
      <RegionalFilter 
        data={data} 
        onFilterChange={onFilterChange} 
        selectedRegionals={selectedRegionals} 
      />
    </div>
  );
};

export default Filters;