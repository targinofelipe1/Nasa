// components/ui/CartaoMetrica.tsx
import React from 'react';

interface CartaoMetricaProps { // Nome da interface em português
  title: string; // Título do cartão (ex: "Eleitores Aptos")
  value: number | string; // Valor da métrica (pode ser número ou string formatada)
  unit?: string; // Opcional: unidade da métrica (ex: '%', 'eleitores')
  description?: string; // Opcional: descrição adicional ou contexto
  colorClass?: string; // Opcional: classe CSS do Tailwind para a cor do texto do valor (ex: 'text-blue-600')
  icon?: React.ReactNode; // Opcional: um elemento React para um ícone
  isLoading?: boolean; // Opcional: indica se a métrica está carregando, exibindo um esqueleto
}

const CartaoMetrica: React.FC<CartaoMetricaProps> = ({ // Nome do componente em português
  title,
  value,
  unit,
  description,
  colorClass = 'text-gray-900',
  icon,
  isLoading = false,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-700">{title}</h3>
        {icon && <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>}
      </div>
      {isLoading ? (
        // Efeito de carregamento (esqueleto)
        <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <p className={`text-3xl font-bold ${colorClass}`}>
          {/* Formatação de número para o padrão brasileiro */}
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          {unit && <span className="text-xl font-normal ml-1">{unit}</span>}
        </p>
      )}
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};

export default CartaoMetrica; 