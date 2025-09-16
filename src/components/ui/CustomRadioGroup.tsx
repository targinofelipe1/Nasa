import React, { ReactNode } from "react";
import { Label } from "./Label";

// A interface agora usa um tipo genérico T que estende string
interface CustomRadioGroupProps<T extends string> {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

// O componente usa o tipo genérico T
const CustomRadioGroup = <T extends string>({ options, value, onValueChange, className }: CustomRadioGroupProps<T>) => {
  return (
    <div className={`flex space-x-4 ${className}`}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`radio-${option.value}`}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            className="h-4 w-4"
          />
          <Label htmlFor={`radio-${option.value}`} className="flex items-center gap-1">
            {option.icon} {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
};

export default CustomRadioGroup;