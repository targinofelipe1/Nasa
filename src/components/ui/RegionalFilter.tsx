// src/components/ui/RegionalFilter.tsx
import { FC } from 'react';
import Select, { MultiValue } from 'react-select';

interface RegionalFilterProps {
  data: { RGA: string }[];
  onFilterChange: (selectedRegionals: string[]) => void;
  selectedRegionals: string[]; // ➡️ Adiciona a nova prop
}

const RegionalFilter: FC<RegionalFilterProps> = ({ data, onFilterChange, selectedRegionals }) => {

  const uniqueRegionals = [...new Set(data.map((row: { RGA: string }) => row.RGA).filter(Boolean))]
    .map((regional) => ({ value: regional, label: regional }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));

  // Formata o valor para o componente Select
  const selectedValues = uniqueRegionals.filter(option => selectedRegionals.includes(option.value));

  const handleChange = (newValue: MultiValue<{ value: string; label: string }>) => {
    const selectedValues = newValue ? newValue.map(item => item.value) : [];
    onFilterChange(selectedValues);
  };

  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg w-full">
      <h2 className="text-lg font-semibold mb-2">Filtrar por Regional</h2>
      <Select
        isMulti
        options={uniqueRegionals}
        value={selectedValues} // ➡️ Usa a prop para controlar o valor do Select
        onChange={handleChange}
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