// components/ui/FilterDropdown.tsx
import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  id: string; // ID único para o elemento select
  label: string; // Rótulo visível para o dropdown (ex: "Município")
  value: string; // Valor atualmente selecionado
  options: Option[]; // Array de objetos { value: string, label: string }
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Função para lidar com a mudança de seleção
  disabled?: boolean; // Opcional: desabilita o dropdown
  placeholder?: string; // Opcional: texto da primeira opção (ex: "Selecione uma opção")
}

const FiltroDropdown: React.FC<FilterDropdownProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Selecione uma opção',
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}:
      </label>
      <div className="relative">
        <select
          id={id}
          className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          {/* Ícone de seta para baixo */}
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default FiltroDropdown;