import MunicipalFilter from "@/components/ui/MunicipalFilter";
import { FC } from "react";

interface FiltersProps {
  data: { Município: string; RGA?: string }[];
  onFilterChange: (selectedMunicipals: string[]) => void;
  selectedMunicipalities: string[];
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange, selectedMunicipalities }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg">
      <MunicipalFilter
        data={data}
        onFilterChange={onFilterChange}
        selectedMunicipals={selectedMunicipalities} // ✅ corrigido aqui
      />
    </div>
  );
};

export default Filters;
