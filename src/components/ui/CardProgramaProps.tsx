'use client';

import { ReactNode } from 'react';

interface CardProgramaProps {
  value: number | string;
  label: string;
  icon: ReactNode;
  bgColor: string;
  iconBg: string;
}

export default function CardPrograma({ value, label, icon, bgColor, iconBg }: CardProgramaProps) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg ${bgColor}`}>
      <div className={`p-3 rounded-full ${iconBg} text-white text-xl mb-2`}>
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </h2>
      <p className="text-sm text-gray-600 text-center mt-1">{label}</p>
    </div>
  );
}
