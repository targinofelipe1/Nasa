import { useState, useEffect, useCallback } from 'react';
import Select, { MultiValue } from 'react-select';

interface RegionalFilterProps {
  data: { RGA: string }[];
  onFilterChange: (selectedRegionals: string[]) => void;
}

const RegionalFilter: React.FC<RegionalFilterProps> = ({ data, onFilterChange }) => {
  const [selectedRegionals, setSelectedRegionals] = useState<{ value: string; label: string }[]>([]);

  // Extrai as regionais únicas da coluna "RGA" e ordena numericamente
  const uniqueRegionals = [...new Set(data.map((row: { RGA: string }) => row.RGA).filter(Boolean))]
    .map((regional) => ({ value: regional, label: regional }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));

  // Memoriza a função para evitar re-renderizações desnecessárias
  const handleFilterChange = useCallback(() => {
    onFilterChange(selectedRegionals.map(r => r.value));
  }, [selectedRegionals]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Filtrar por Regional</h2>
      <Select
        isMulti
        options={uniqueRegionals}
        value={selectedRegionals}
        onChange={(newValue: MultiValue<{ value: string; label: string }>) => setSelectedRegionals(newValue as { value: string; label: string }[])}
        placeholder="Selecione uma ou mais regionais"
        className="w-full text-sm border-gray-300 rounded-lg"
        styles={{
          control: (provided) => ({
            ...provided,
            padding: '6px',
            borderRadius: '8px',
            borderColor: '#ddd',
            boxShadow: 'none',
            '&:hover': { borderColor: '#aaa' }
          }),
          menu: (provided) => ({
            ...provided,
            borderRadius: '8px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
          })
        }}
      />
    </div>
  );
};

export default RegionalFilter;
