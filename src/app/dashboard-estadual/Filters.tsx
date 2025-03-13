import { FC } from "react";
import RegionalFilter from "@/components/ui/RegionalFilter";

interface FiltersProps {
  data: { RGA: string }[];
  onFilterChange: (selectedRegionals: string[]) => void;
}

const Filters: FC<FiltersProps> = ({ data, onFilterChange }) => {
  return (
    <div className="mb-6 p-4 bg-white shadow rounded-lg">
      <RegionalFilter data={data} onFilterChange={onFilterChange} />
    </div>
  );
};

export default Filters;
