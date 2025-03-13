import React from "react";

interface SelectProps {
  options: { id: string; label: string; value: number }[];
  onChange: (selectedLabel: string) => void;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({ options, onChange, defaultValue }) => {
  return (
    <select
      className="mt-2 p-2 border rounded w-full"
      onChange={(e) => onChange(e.target.value)}
      value={defaultValue} // Define o valor inicial selecionado
    >
      {options.map((option) => (
        <option key={option.id} value={option.label}>
          {option.label} {/* Exibe apenas o nome do programa */}
        </option>
      ))}
    </select>
  );
};

export default Select;
