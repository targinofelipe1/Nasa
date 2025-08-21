// src/components/ui/ProgramIndicators.tsx
import React, { FC } from 'react';
import CitiesModal from "./CitiesModal";

interface ProgramIndicatorsProps {
  programs: { value: string; label: string }[];
  apiData: any[];
  onOpenModal: (programName: string, municipalities: string[]) => void; // ➡️ Nova prop
}

const ProgramIndicators: FC<ProgramIndicatorsProps> = ({ programs, apiData, onOpenModal }) => {
  if (!programs || programs.length === 0) {
    return null;
  }

  const normalizeValue = (value: any) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim().toLowerCase();
      if (trimmedValue === "sim" || trimmedValue === "não") {
        return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
      }
    }
    const num = Number(value);
    return num > 0 ? "Sim" : "Não";
  };

  const findKey = (columnName: string) => {
    if (!apiData || apiData.length === 0 || !apiData[0]) return "";
    return Object.keys(apiData[0]).find(
      (key) => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.replace(/\s+/g, " ").trim().toLowerCase()
    ) || "";
  };

  const parseNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 gap-4">
          {programs.map((programOption, index) => {
            const municipalities = new Set<string>();
            const key = findKey(programOption.value); // Obtém a chave antes do loop

            if (!key) {
              return null; // Se a chave não for encontrada, pule este programa
            }

            apiData.forEach(row => {
              // 🆕 Lógica para o programa "Casa da Cidadania"
              if (key.toLowerCase().includes("casa da cidadania")) {
                if (parseNumber(row[key]) > 0 && row["Município"]) {
                  municipalities.add(row["Município"]);
                }
              } else {
                // 🆕 Lógica padrão para todos os outros programas
                if (normalizeValue(row[key]) === "Sim" && row["Município"]) {
                  municipalities.add(row["Município"]);
                }
              }
            });

            return (
              <div key={index} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200 flex flex-col items-center text-center">
                <h3 className="text-md font-semibold text-teal-600 mb-2">
                  {programOption.label}
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {municipalities.size}
                </p>
                <span className="text-sm text-gray-600 mb-3">Quantidade de municípios com este programa</span>
                <button
                  onClick={() => onOpenModal(programOption.label, Array.from(municipalities))}
                  className="w-full mt-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Ver Cidades
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ProgramIndicators;