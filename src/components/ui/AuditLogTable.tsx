// components/ui/AuditLogTable.tsx
"use client";

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/Button';

// A interface foi declarada aqui para evitar problemas de importação.
export interface TableData {
  [key: string]: string | number;
  timestamp: string;
  userId: string;
  programa: string;
  municipio: string;
  campo: string; // Adicionado o campo "campo" na interface
  summary: string;
}

interface AuditLogTableProps {
  headers: string[];
  currentItems: TableData[];
  columnDisplayNames: Record<string, string>;
  programDisplayNames: Record<string, string>;
  getUserName: (id: string) => string;
  handleOpenModal: (logEntry: TableData) => void;
}

const columnDisplayNames: Record<string, string> = {
'Município': 'Município',
  'CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ': 'Famílias em Pobreza',
  'CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ':'Famílias Baixa Renda',
  'CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ': 'Famílias Renda Acima de 1/2 S.M.',
  'CADASTRO ÚNICO - Total de Familias CadÚnico': 'Quantidade de Famílias Inscritas',
  'CADASTRO ÚNICO - Total de Pessoas CadÚnico': 'Quantidade de Pessoas Inscritas',
  'CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ': 'Pessoas em Pobreza',
  'CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ': 'Pessoas em Baixa Renda',
  'CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ': 'Pessoas com renda acima de meio salário mínino',
  'CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico': 'Famílias UNIPESSOAIS',
  'CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos': 'Pessoas com 0 a 6 anos',
  'CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais': 'Pessoas com 60 ou mais anos',
  'CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único': 'Pessoas com deficiência',
  'CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único': 'Famílias Indígenas',
  'CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único': 'Famílias Quilombolas',
  'CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único': 'Famílias em situação de rua',
  'CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único': 'Famílias GPTE',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)': 'Ensino Fundamental (Incompleto/Completo)',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)': 'Ensino Médio (Incompleto/Completo)',
  'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)': 'Ensino Superior (Incompleto/Completo)',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que não exerceram trabalho remunerado nos últimos 12 meses': 'Sem Trabalho Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que Exerceram trabalho remunerado nos últimos 12 meses': 'Com Trabalho Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico  por função principal - Trabalhador por conta própria': 'Trabalhador Autônomo',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural': 'Trabalhador Rural Temporário',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada': 'Empregado Sem Carteira',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada': 'Empregado Com Carteira',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada': 'Trabalhador Doméstico',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado': 'Trabalhador Não-Remunerado',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público': 'Militar/Servidor Público',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador': 'Empregador',
  'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz': 'Estagiário/Aprendiz',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias Indígenas beneficiárias do Programa Bolsa Família': 'Famílias Indígenas',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias Quilombolas beneficiárias do Programa Bolsa Família': 'Famílias Quilombolas',
  'PROGRAMA BOLSA FAMÍLIA - Famílias em Situação de rua beneficiárias do Programa Bolsa Família': 'Famílias em situação de rua',
  'PROGRAMA BOLSA FAMÍLIA -  Famílias em GPTE beneficiárias do Programa Bolsa Família': 'Famílias GPTE',
   "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024":
    "Total Famílias",
  "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024":
    "Famílias em Pobreza",
  "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024":
    "Famílias Baixa Renda",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024":
    "Total de Pessoas",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218":
    "Pessoas em Pobreza",
  "PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024":
    "Pessoas Baixa Renda",
    "Proteção Social Básica - Unidade de CRAS": "Unidade de CRAS",
    'Segurança Alimentar - Programa "Tá na mesa" (municípios)': 'Municípios atendidos',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia': 'Refeições/dia',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual': 'Refeições/ano',
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual': 'Valor anual',
  'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)': 'Novo Tá na Mesa (Refeições/dia)',
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual': 'Novo Tá na Mesa (Valor anual)',
  'Segurança Alimentar - Cartão Alimentação  (municípios)': 'Municípios atendidos',
  'Segurança Alimentar - Cartão Alimentação  (beneficiários)': 'Beneficiários',
  'Segurança Alimentar - Cartão Alimentação - valor por município': 'Valor por município',
  'Segurança Alimentar - Restaurante Popular (municípios)': 'Restaurante Popular (municípios)',
  'Segurança Alimentar - PAA LEITE (municípios)': 'PAA Leite (municípios)',
  'Segurança Alimentar - PAA LEITE (beneficiários)': 'PAA Leite (beneficiários)',
  'Segurança Alimentar - PAA LEITE (investimento)': 'PAA Leite (investimento)',
  'Segurança Alimentar - PAA CDS (municípios)': 'PAA CDS (municípios)',
  'Segurança Alimentar - PAA CDS (beneficiários)': 'PAA CDS (beneficiários)',
  'Segurança Alimentar - PAA CDS (investimento anual)': 'PAA CDS (investimento anual)',
  'Segurança Alimentar - Cisternas (quantidade no município)': 'Cisternas (quantidade)',
  'Segurança Alimentar - Cisternas (valor investido em 2025': 'Cisternas (valor investido)',
  'Segurança Alimentar - Insegurança Alimentar - Índice de INSAN': 'Índice de INSAN',
  'Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN': 'Categorias de INSAN',
  "Quantidade de Casa da Cidadania": "Quantidade de Casa da Cidadania",
  "Posto do SINE": "Posto do SINE",
  "BPC/RMV  - Total de beneficiários BPC/RMV": "Total de Beneficiários BPC/RMV",
  "BPC/RMV  - Total de beneficiários BPC/RMV no Cadastro Único": "Total de Beneficiários no CadÚnico",
  "Saúde - Vacinas (doses aplicadas)": "Doses de Vacinas Aplicadas",
  "Saúde - Hospital Geral": "Hospital Geral",
  "Saúde - Centro de Saúde/Unidade Básica de Saúde": "Centro de Saúde/UBS",
  "Saúde - Posto de Saúde": "Posto de Saúde",
};


export default function AuditLogTable({
  headers,
  currentItems,
  columnDisplayNames,
  programDisplayNames,
  getUserName,
  handleOpenModal,
}: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((key) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {columnDisplayNames[key] || key}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentItems.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((key, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    key === 'municipio' ? 'font-semibold' : 'text-gray-900'
                  }`}
                >
                  {key === 'timestamp'
                    ? format(new Date(row[key]), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : key === 'userId' ? getUserName(String(row[key]))
                    : key === 'programa' ? programDisplayNames[String(row[key])] || String(row[key])
                    : String(row[key])}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(row)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}