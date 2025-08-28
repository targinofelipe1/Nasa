// src/components/ui/ProgramFilter.tsx
"use client";

import { useState, useEffect } from "react";
import Select, { MultiValue } from "react-select";

interface ProgramFilterProps {
  data: any[];
  onFilterChange: (selectedData: { selectedPrograms: { value: string; label: string }[], municipalities: string[] }) => void;
}

const ProgramFilter: React.FC<ProgramFilterProps> = ({ data, onFilterChange }) => {
  const [selectedPrograms, setSelectedPrograms] = useState<{ value: string; label: string }[]>([]);
  const [totalMunicipalities, setTotalMunicipalities] = useState<number>(0);

  // ℹ️ Função auxiliar para encontrar a chave exata nos dados da API,
  // ℹ️ ignorando espaços e case-sensitive.
  const findKey = (columnName: string) => {
    if (!data || data.length === 0 || !data[0]) return "";
    return Object.keys(data[0]).find(
      (key) => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.replace(/\s+/g, " ").trim().toLowerCase()
    ) || "";
  };
  
  // Mantenha a lista de programas com as chaves "limpas" para serem usadas no findKey
  const programOptions = [
    { value: "Proteção Social Básica - Unidade de CRAS", label: "CRAS" },
    { value: "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe", label: "Órfãos do Programa" },
    { value: "Proteção Social Básica - Primeira Infância no SUAS", label: "Primeira Infância no SUAS" },
    { value: "Proteção Social Básica - Acessuas Trabalho", label: "Acessuas Trabalho" },
    { value: "Proteção Social Básica - Residenciais Cidade Madura", label: "Residenciais Cidade Madura" },
    { value: "Proteção Social Básica - Centros Sociais Urbanos - CSUs", label: "CSUs" },
    { value: "Proteção Social Básica - Centros de Convivência", label: "Centros de Convivência" },
    { value: "Proteção Social Especial - Unidade de CREAS", label: "CREAS" },
    { value: "Proteção Social Especial - Unidade de Centro Pop", label: "Centro Pop" },
    { value: "Proteção Social Especial - Unidade de Centro Dia", label: "Centro Dia" },
    { value: "Proteção Social Especial - Unidades de Acolhimento (Estadual)", label: "Acolhimento Estadual" },
    { value: "Proteção Social Especial - Unidades de Acolhimento (Municipal)", label: "Acolhimento Municipal" },
    { value: "Proteção Social Especial - Municípios com Serviço de Família Acolhedora", label: "Família Acolhedora" },
    { value: "Proteção Social Especial - Projeto Acolher (municípios)", label: "Projeto Acolher" },
    { value: 'Segurança Alimentar - Programa "Tá na mesa" (municípios)', label: "Tá na Mesa" },
    { value: "Segurança Alimentar - Cartão Alimentação (municípios)", label: "Cartão Alimentação" },
    { value: "Segurança Alimentar - Restaurante Popular (municípios)", label: "Restaurante Popular" },
    { value: "Segurança Alimentar - PAA LEITE (municípios)", label: "PAA Leite" },
    { value: "Segurança Alimentar - PAA CDS (municípios)", label: "PAA CDS" },
    { value: "Quantidade de Casa da Cidadania", label: "Casa da Cidadania" },
    { value: "Posto do SINE", label: "Posto do SINE" },

  ];

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
  
  const parseNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    if (selectedPrograms.length === 0) {
      onFilterChange({ selectedPrograms: [], municipalities: [] });
      setTotalMunicipalities(0);
      return;
    }

    const filteredMunicipalities = Array.from(new Set(
      data.filter(row =>
        selectedPrograms.some(program => {
          const key = findKey(program.value); // 🆕 Use findKey para obter a chave correta
          if (!key) return false; // Se a chave não for encontrada, pule para o próximo programa

          const value = row[key];

          // Lógica ajustada para o programa "Casa da Cidadania"
          if (key.toLowerCase().includes("casa da cidadania")) {
            return parseNumber(value) > 0;
          }

          // Lógica padrão para todos os outros programas
          return normalizeValue(value) === "Sim";
        })
      ).map(row => row["Município"])
    ));

    setTotalMunicipalities(filteredMunicipalities.length);

    onFilterChange({
      selectedPrograms,
      municipalities: filteredMunicipalities,
    });

  }, [selectedPrograms, data, onFilterChange]);

  return (
    <div>
      <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Filtrar por Programa</h2>
        <Select
          isMulti
          options={programOptions}
          value={selectedPrograms}
          onChange={(newValue: MultiValue<{ value: string; label: string }>) => {
            setSelectedPrograms(newValue as any);
          }}
          placeholder="Selecione um ou mais programas"
          className="w-full text-sm border-gray-300 rounded-lg"
        />
      </div>

      <div className="p-4 bg-white shadow-lg rounded-lg text-center flex flex-col items-center">
        <p className="text-xl font-bold text-blue-600">{totalMunicipalities}</p>
        <span className="text-sm text-gray-600">Municípios destacados no mapa</span>
      </div>
    </div>
  );
};

export default ProgramFilter;