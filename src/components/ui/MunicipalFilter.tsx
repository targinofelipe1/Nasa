import { useState, useEffect, useCallback } from 'react';
import Select, { MultiValue } from 'react-select';

interface MunicipalFilterProps {
  data: { Município: string }[];
  onFilterChange: (selectedMucicipals: string[]) => void;
}

const MunicipalFilter: React.FC<MunicipalFilterProps> = ({ data, onFilterChange }) => {
  const [selectedMunicipals, setSelectedMuncipls] = useState<{ value: string; label: string }[]>([]);

  // Extrai as regionais únicas da coluna "RGA" e ordena numericamente
  const uniqueMunicipals = [...new Set(data.map((row: { Município: string }) => row.Município).filter(Boolean))]
    .map((regional) => ({ value: regional, label: regional }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));

  // Memoriza a função para evitar re-renderizações desnecessárias
  const handleFilterChange = useCallback(() => {
    onFilterChange(selectedMunicipals.map(r => r.value));
  }, [selectedMunicipals]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
         <h2 className="text-lg font-semibold mb-2">Filtrar por Município</h2>
      <Select
        isMulti
        options={uniqueMunicipals}
        value={selectedMunicipals}
        onChange={(newValue: MultiValue<{ value: string; label: string }>) => setSelectedMuncipls(newValue as { value: string; label: string }[])}
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

export default MunicipalFilter;
