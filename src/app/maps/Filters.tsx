// src/components/ui/Filters.tsx
import ProgramFilter from "@/components/ui/ProgramFilter";
import { FC } from "react";

// ➡️ A interface foi ajustada para que a propriedade 'onFilterChange'
// ➡️ espere 'selectedPrograms' em vez de 'programs'.
interface FiltersProps {
  data: any[];
  onFilterChange: (selectedData: { selectedPrograms: { value: string; label: string }[]; municipalities: string[] }) => void;
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg w-full">
      {/* 🔹 Agora a função onFilterChange em Filters e ProgramFilter estão tipadas de forma compatível */}
      <ProgramFilter data={data} onFilterChange={onFilterChange} />
    </div>
  );
};

export default Filters;