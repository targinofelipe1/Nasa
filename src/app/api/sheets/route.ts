// src/app/api/sheets/route.ts
import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, appendSheetData } from '@/services/sheetService';

const SPREADSHEET_ID = '1leIjFeNdyyXmhCedOHhGnZaYSM7K7G9ima2Qxr3YEE0';

const SHEET_RANGE = 'dados!A:DT';
const AUDIT_LOG_SHEET = 'log-auditoria!A:G';

const programColumnsMap = {
  'paa-cds': ['CÓDIGO IBGE', 'Município', 'Segurança Alimentar - PAA CDS (municípios)'],
  'bolsa-familia': [
    'Município',
    'PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024',
    'PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024',
    'PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024',
    'PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024',
    'PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218',
    'PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024',
    'PROGRAMA BOLSA FAMÍLIA -  Famílias Indígenas beneficiárias do Programa Bolsa Família',
    'PROGRAMA BOLSA FAMÍLIA -  Famílias Quilombolas beneficiárias do Programa Bolsa Família',
    'PROGRAMA BOLSA FAMÍLIA - Famílias em Situação de rua beneficiárias do Programa Bolsa Família',
    'PROGRAMA BOLSA FAMÍLIA -  Famílias em GPTE beneficiárias do Programa Bolsa Família',

  ],
  'cadastro-unico': [
    'Município',
    'CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ',
    'CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ',
    'CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo ',
    'CADASTRO ÚNICO - Total de Familias CadÚnico',
    'CADASTRO ÚNICO - Total de Pessoas CadÚnico',
    'CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00 ',
    'CADASTRO ÚNICO - Pessoas em em situação de Baixa Renda - Renda per capita (R$) de  218,01 até 1/2 S.M. ',
    'CADASTRO ÚNICO - Pessoas com Renda mensal acima de Meio Salário Mínimo ',
    'CADASTRO ÚNICO - Famílias UNIPESSOAIS no CadÚnico',
    'CADASTRO ÚNICO - Pessoas no Cadastro  Único de 0 a 6 anos',
    'CADASTRO ÚNICO - Pessoas no Cadastro  Único com 60 anos ou mais',
    'CADASTRO ÚNICO - Pessoas Com deficiência no Cadastro Único',
    'CADASTRO ÚNICO - Famílias Indígenas inscritas no Cadastro Único',
    'CADASTRO ÚNICO - Famílias Quilombolas inscritas no Cadastro Único',
    'CADASTRO ÚNICO - Famílias em Situação de rua inscritas no Cadastro Único',
    'CADASTRO ÚNICO - Famílias em GPTE no Cadastro Único',
    'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)',
    'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)',
    'Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que não exerceram trabalho remunerado nos últimos 12 meses',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico que Exerceram trabalho remunerado nos últimos 12 meses',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico  por função principal - Trabalhador por conta própria',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador',
    'Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz'
  ],
  'auditoria': [ 
    'timestamp',
    'userId',
    'programa',
    'municipio',
    'campo',
  ],
  'protecao-basica': [
    'Município',
    'Proteção Social Básica - Unidade de CRAS',
    'Proteção Social Básica - Primeira Infância no SUAS',
    'Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe',
    'Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe (valor investido em 2024/2025)',
    'Proteção Social Básica - Acessuas Trabalho',
    'Proteção Social Básica - Residenciais Cidade Madura',
    'Proteção Social Básica - Residenciais Cidade Madura (valor investido em 2025)',
    'Proteção Social Básica - Centros Sociais Urbanos - CSUs',
    'Proteção Social Básica -  Centros Sociais Urbanos - CSUs (valor investido em 2025)',
    'Proteção Social Básica - Centros de Convivência',
  ],
  'protecao-especial': [
    'Município',
    'Proteção Social Especial - Unidade de CREAS',
    'Proteção Social Especial - Tipo de CREAS',
    'Proteção Social Especial - Unidade de Centro Pop',
    'Proteção Social Especial - Unidade de Centro Dia',
    'Proteção Social Especial - Unidades de Acolhimento (Estadual )',
    'Proteção Social Especial - Unidades de Acolhimento (Municipal)',
    'Proteção Social Especial - Municípios com Serviço de Família Acolhedora',
    'Proteção Social Especial - Projeto Acolher (municípios)',
    'Proteção Social Especial - Projeto Acolher (valor investido em 2025)',
],
'seguranca-alimentar': [
  'Município',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/dia',
  'Segurança Alimentar -  Programa "Tá na mesa" - Quant de refeição/anual',
  'Segurança Alimentar - Programa "Tá na mesa" - Valor por município anual',
  'Segurança Alimentar - Programa "Novo Tá na mesa"  (Quant de refeição/dia)',
  'Segurança Alimentar - Programa "Novo Tá na mesa" - Valor por município anual',
  'Segurança Alimentar - Cartão Alimentação  (municípios)',
  'Segurança Alimentar - Cartão Alimentação  (beneficiários)',
  'Segurança Alimentar - Cartão Alimentação - valor por município',
  'Segurança Alimentar - Restaurante Popular (municípios)',
  'Segurança Alimentar - PAA LEITE (municípios)',
  'Segurança Alimentar - PAA LEITE (beneficiários)',
  'Segurança Alimentar - PAA LEITE (investimento)',
  'Segurança Alimentar - PAA CDS (municípios)',
  'Segurança Alimentar - PAA CDS (beneficiários)',
  'Segurança Alimentar - PAA CDS (investimento anual)',
  'Segurança Alimentar - Cisternas (quantidade no município)',
  'Segurança Alimentar - Cisternas (valor investido em 2025',
  'Segurança Alimentar - Insegurança Alimentar - Índice de INSAN',
  'Segurança Alimentar - Insegurança Alimentar - Categorias de INSAN',
],
"casa-da-cidadania-e-sine": [
  'Município',
  'Quantidade de Casa da Cidadania ',
  'Posto do SINE',
],
"bpc-rmv": [
  'Município',
  'BPC/RMV  - Total de beneficiários BPC/RMV',
  'BPC/RMV  - Total de beneficiários BPC/RMV no Cadastro Único',
],
"saude": [
  'Município',
  'Saúde - Vacinas (doses aplicadas)',
  'Saúde - Hospital Geral',
  'Saúde - Centro de Saúde/Unidade Básica de Saúde',
   'Saúde - Posto de Saúde',


],


};

const getColumnLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programName = searchParams.get('programa') as keyof typeof programColumnsMap;
    const spreadsheetId = SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, message: 'Programa não encontrado.' },
        { status: 404 }
      );
    }

    // ✅ Lógica corrigida para buscar a aba correta
    const sheetRange = programName === 'auditoria' ? AUDIT_LOG_SHEET : SHEET_RANGE;
    const data = await getSheetData(spreadsheetId, sheetRange);

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: 'Dados da planilha não encontrados.' }, { status: 404 });
    }

    if (programName && programColumnsMap[programName]) {
      const headers = data[0];
      const programHeaders = programColumnsMap[programName];

      const headerIndices = programHeaders.map(h => headers.indexOf(h)).filter(index => index !== -1);
      
      const filteredData = data.slice(1).map(row => {
        const rowData: any = {};
        headerIndices.forEach((index, i) => {
          rowData[programHeaders[i]] = row[index];
        });
        return rowData;
      });

      return NextResponse.json({ success: true, data: filteredData, originalHeaders: headers });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { updates, programa, userId, municipio } = await request.json();

    if (!updates || !Array.isArray(updates) || !programa || !userId || !municipio) {
      return NextResponse.json(
        { success: false, message: 'Dados insuficientes para a atualização.' },
        { status: 400 }
      );
    }
    
    const spreadsheetId = SPREADSHEET_ID;
    
    const data = await getSheetData(spreadsheetId, SHEET_RANGE);
    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: 'Dados da planilha não encontrados.' }, { status: 404 });
    }
    const headers = data[0];

    const updatedFieldsSummary: string[] = [];

    for (const update of updates) {
      const columnIndex = headers.indexOf(update.key);
      if (columnIndex === -1) {
        console.warn(`Aviso: A coluna com a chave '${update.key}' não foi encontrada.`);
        continue;
      }
      
      const columnLetter = getColumnLetter(columnIndex);
      const range = `${SHEET_RANGE.split('!')[0]}!${columnLetter}${update.row}`;
      
      await updateSheetData(spreadsheetId, range, [[update.value]]);

      if (update.originalValue !== update.value) {
        updatedFieldsSummary.push(
          `Campo '${update.key}' de '${update.originalValue || ''}' para '${update.value}'`
        );
      }
    }
    
    if (updatedFieldsSummary.length > 0) {
      const timestamp = new Date().toISOString();
      const logEntry = [
        timestamp,
        userId,
        programa,
        municipio,
        updatedFieldsSummary.join('; '),
      ];
      await appendSheetData(spreadsheetId, AUDIT_LOG_SHEET, [logEntry]);
    }

    return NextResponse.json({ success: true, message: 'Dados atualizados com sucesso!' });
  } catch (error: any) {
    console.error("Erro na API de atualização:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}