"use client";

import { useState, useEffect } from "react";
import Select, { MultiValue } from "react-select";

interface ProgramFilterProps {
  data: any[];
  onFilterChange: (selectedMunicipalities: string[]) => void;
}

const ProgramFilter: React.FC<ProgramFilterProps> = ({ data, onFilterChange }) => {
  const [selectedPrograms, setSelectedPrograms] = useState<{ value: string; label: string }[]>([]);
  const [totalMunicipalities, setTotalMunicipalities] = useState<number>(0);

  // 🔹 Opções combinadas de Programas e Proteção Social
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
    { value: "Quantidade de Casa da Cidadania", label: "Casa da Cidadania" }
  ];

  // Função para encontrar a chave correta na planilha
  const findKey = (columnName: string) => {
    if (!data || data.length === 0) return "";
    return Object.keys(data[0]).find(
      key => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.trim().toLowerCase()
    ) || "";
  };

  // Converte valores numéricos para "Sim" ou "Não"
  const normalizeValue = (value: any) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim().toLowerCase();
      if (trimmedValue === "sim" || trimmedValue === "não") {
        return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1); // Mantém "Sim" e "Não"
      }
    }
  
    const num = Number(value);
    return num > 0 ? "Sim" : "Não"; // Converte valores numéricos
  };

  useEffect(() => {
    if (selectedPrograms.length === 0) {
      onFilterChange([]);
      setTotalMunicipalities(0);
      return;
    }

    const filteredMunicipalities = data
      .filter(row =>
        selectedPrograms.some(program => {
          const key = findKey(program.value);
          return key && normalizeValue(row[key]) === "Sim";
        })
      )
      .map(row => row["Município"])
      .filter(Boolean);

    console.log("🔹 Municípios filtrados:", filteredMunicipalities);
    setTotalMunicipalities(filteredMunicipalities.length);
    onFilterChange(filteredMunicipalities);
  }, [selectedPrograms, data]);

  return (
    <div>
      {/* 🔹 Filtro de Programas */}
      <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Filtrar por Programa</h2>
        <Select
          isMulti
          options={programOptions}
          value={selectedPrograms}
          onChange={(newValue: MultiValue<{ value: string; label: string }>) => {
            console.log("🔹 Programas selecionados:", newValue);
            setSelectedPrograms(newValue as any);
          }}
          placeholder="Selecione um ou mais programas"
          className="w-full text-sm border-gray-300 rounded-lg"
        />
      </div>

      {/* 🔹 Indicador: Total de Municípios Destacados */}
      <div className="p-4 bg-white shadow-lg rounded-lg text-center flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2">Indicadores</h2>
        <p className="text-xl font-bold text-blue-600">{totalMunicipalities}</p>
        <span className="text-sm text-gray-600">Municípios destacados no mapa</span>
      </div>
    </div>
  );
};

export default ProgramFilter;
