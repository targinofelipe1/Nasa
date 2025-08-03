"use client";

import { FC } from 'react';
import Select, { MultiValue } from 'react-select';

interface MunicipalFilterProps {
  data: { Município: string; RGA: string }[];
  onFilterChange: (selectedMunicipals: string[]) => void;
  selectedMunicipals: string[];
}

const MunicipalFilter: FC<MunicipalFilterProps> = ({ data, onFilterChange, selectedMunicipals }) => {

  const uniqueMunicipals = [...new Set(data.map((row: { Município: string }) => row.Município).filter(Boolean))]
    .map((municipio) => ({ value: municipio, label: municipio }))
    .sort((a, b) => a.value.localeCompare(b.value));

  // Filtra as opções para corresponder aos municípios selecionados
  const selectedValues = uniqueMunicipals.filter(option => selectedMunicipals.includes(option.value));

  const handleChange = (newValue: MultiValue<{ value: string; label: string }>) => {
    const selectedValues = newValue ? newValue.map(item => item.value) : [];
    onFilterChange(selectedValues);
  };

  return (
    <div className="mb-6 p-4 bg-white shadow-lg rounded-lg w-full">
      <h2 className="text-lg font-semibold mb-2">Filtrar por Município</h2>
      <Select
        isMulti={true} // ➡️ AQUI: Habilita a seleção múltipla
        options={uniqueMunicipals}
        value={selectedValues}
        onChange={handleChange}
        placeholder="Selecione um ou mais municípios"
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