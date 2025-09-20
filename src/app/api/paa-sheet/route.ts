import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, appendSheetData } from '@/services/sheetService';

const SPREADSHEET_ID = '1qIviaXEOoVFL94VvygRdKh1i6aGOeCZjWcBbN_GlA6o';

const SHEET_RANGE = 'dados!A:J';
const AUDIT_LOG_SHEET = 'log-auditoria!A:G';

const programColumnsMap = {
  'paa': [
    'MUNICÍPIO', // ✅ Corrigido para o singular
    'SISAN',
    'ENTIDADE CADASTRADA',
    'BENEFICIADOS',
    'EQUIPAMENTO',
    'PAA 2023 – Recurso Federal (Quantidade Kg de alimentos)',
    'PAA 2024 – Recurso Federal (Quantidade Kg de alimentos)',
    'PAA 2024 – Recurso Estadual (Quantidade Kg de alimentos)',
    'PAA 2024 – Recurso Estadual e Federal (Quantidade Kg de alimentos)',
    'PAA VALOR TOTAL INVESTIDO (COMPRAS)'
  ],
  'auditoria': [ 
    'timestamp',
    'userId',
    'programa',
    'municipio',
    'campo',
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