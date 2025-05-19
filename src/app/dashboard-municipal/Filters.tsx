import MunicipalFilter from "@/components/ui/MunicipalFilter";
import { FC } from "react";

interface FiltersProps {
  data: { Município: string }[];
  onFilterChange: (selectedMunicipals: string[]) => void;
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg">
      <MunicipalFilter data={data} onFilterChange={onFilterChange} />
    </div>
  );
};

export default Filters;
