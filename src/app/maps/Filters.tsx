// src/components/ui/Filters.tsx
import ProgramFilter from "@/components/ui/ProgramFilter";
import { FC } from "react";

interface FiltersProps {
  data: any[]; // Dados da API contendo os municípios e programas
  onFilterChange: (selectedMunicipals: string[]) => void;
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg w-full"> {/* ➡️ Adiciona w-full */}
      {/* 🔹 Filtro de Programas */}
      <ProgramFilter data={data} onFilterChange={onFilterChange} />
    </div>
  );
};

export default Filters;