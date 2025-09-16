import React from "react";

interface CustomSelectProps {
  options: { id: string; label: string; value: string }[];
  onChange: (selectedValue: string) => void;
  defaultValue?: string;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, onChange, defaultValue, placeholder }) => {
  return (
    <select
      className="mt-2 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      onChange={(e) => onChange(e.target.value)}
      value={defaultValue}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.id} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default CustomSelect;