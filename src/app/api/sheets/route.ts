// src/app/api/sheets/route.ts
import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, appendSheetData } from '@/services/sheetService';

// ID da Planilha permanece o mesmo
const SPREADSHEET_ID = '1uypGmBtki6qSKcF_jEpv_0jpLHVyPsYtFlJYoX0aswU';

// Definição dos RANGES usando os nomes das abas da imagem
const SHEET_DETALHADOS = 'Dados_Detalhados!A:AU';
const SHEET_MUNICIPIOS = 'Municipios_Consolidado!A:BE'; 
const SHEET_ESTADOS = 'Resumo_Estados!A:AN';
const AUDIT_LOG_SHEET = 'log-auditoria!A:G'; 

// Colunas dos anos para reuso
const YEAR_COLUMNS = [
  '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1495', 
  '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', 
  '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', 
  '2018', '2019', '2020', '2021', '2022', '2023'
];

// Mapa de colunas para os novos programas/abas
const programColumnsMap = {
  'dados-detalhados': [
    'pais', 'estado', 'cidade', 'codigo_ibge', 'nivel_1', 'nivel_2', 'transicao', 
    ...YEAR_COLUMNS
  ],
  'municipios-consolidado': [
    'estado', 'cidade', 
    'População (1985)', 'População (1991)', 'População (2000)', 
    'População (2010)', 'População (2022)', 'População (2024)', 
    'População residente (1985)', 'População residente (2010)', 'População residente (2022)', 
    'Área Territorial (1985)', 'Área Territorial (2010)', 'Área Territorial (2022)', 
    'Densidade Demográfica (1985)', 'Densidade Demográfica (2010)', 'Densidade Demográfica (2022)', 
    'codigo_ibge',
    ...YEAR_COLUMNS
  ],
  'resumo-estados': [
    'estado',
    ...YEAR_COLUMNS
  ],
  'auditoria': [ 
    'timestamp',
    'userId',
    'programa',
    'municipio',
    'campo',
  ],
  // NOVO PROGRAMA: Comunidade (Não usa planilha)
  'comunidade': [
    'postId', 'usuario', 'conteudo', 'curtidas', 'comentarios'
  ]
};

// Mapeamento de programas para as abas (ranges)
const sheetRanges = {
    'dados-detalhados': SHEET_DETALHADOS,
    'municipios-consolidado': SHEET_MUNICIPIOS,
    'resumo-estados': SHEET_ESTADOS,
    'auditoria': AUDIT_LOG_SHEET,
    // Note: 'comunidade' não está aqui pois usa lógica interna
};

const getColumnLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

// --- SIMULAÇÃO DE DADOS DA COMUNIDADE ---
const mockCommunityData = [
    { postId: 1, usuario: 'Usuario_A', conteudo: 'Ótima análise dos dados florestais!', curtidas: 15, comentarios: 3, timestamp: '2025-05-01' },
    { postId: 2, usuario: 'Geo_Norte', conteudo: 'Alerta de crescimento urbano em Natal.', curtidas: 42, comentarios: 11, timestamp: '2025-05-02' },
    { postId: 3, usuario: 'Plan_PB', conteudo: 'Curioso sobre a variação populacional de João Pessoa.', curtidas: 8, comentarios: 2, timestamp: '2025-05-03' },
];

// ------------------------------------
// Função GET (Expandida para 'comunidade')
// ------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programName = searchParams.get('programa') as keyof typeof programColumnsMap;
    const spreadsheetId = SPREADSHEET_ID;

    // Lógica Específica para a Comunidade
    if (programName === 'comunidade') {
        // Retorna dados simulados de posts e engajamento
        return NextResponse.json({ 
            success: true, 
            data: mockCommunityData,
            message: 'Dados simulados da comunidade retornados com sucesso.'
        });
    }

    // Lógica Padrão para Planilhas
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, message: 'ID da planilha não configurado.' }, { status: 500 });
    }
    
    const sheetRange = sheetRanges[programName];

    if (!sheetRange) {
        return NextResponse.json({ success: false, message: 'Programa ou aba não encontrado.' }, { status: 404 });
    }
    
    console.log(`[GET] Tentando buscar dados do range: ${sheetRange} na planilha ${spreadsheetId}`);

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
    console.error("Erro CRÍTICO na API GET (Planilha):", error);
    return NextResponse.json({ 
        success: false, 
        message: error.message || 'Ocorreu um erro interno ao buscar os dados da planilha.' 
    }, { status: 500 });
  }
}

// ------------------------------------
// Função PATCH (Limpada e Expandida para 'comunidade')
// ------------------------------------
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { updates, programa, userId, municipio } = body;

    // Lógica Específica para a Comunidade (simula curtir/comentar)
    if (programa === 'comunidade') {
        const { postId, action } = body;
        
        if (!postId || !action) {
            return NextResponse.json({ success: false, message: 'Ação ou ID do post não fornecido.' }, { status: 400 });
        }

        // SIMULAÇÃO: Se a ação for 'curtir'
        if (action === 'curtir') {
            return NextResponse.json({ success: true, message: `Post ${postId} curtido com sucesso! (Simulação)` });
        }
        
        // SIMULAÇÃO: Se a ação for 'comentar'
        if (action === 'comentar') {
            return NextResponse.json({ success: true, message: `Novo comentário adicionado ao Post ${postId}. (Simulação)` });
        }
        
        return NextResponse.json({ success: false, message: 'Ação de comunidade não reconhecida.' }, { status: 400 });
    }

    // Lógica Padrão para Planilhas (Continuação do PATCH)
    if (!updates || !Array.isArray(updates) || !programa || !userId || !municipio) {
      return NextResponse.json({ success: false, message: 'Dados insuficientes para a atualização.' }, { status: 400 });
    }
    
    // ... (restante da lógica de Sheets, log de auditoria e retorno) ...
    const spreadsheetId = SPREADSHEET_ID;
    const sheetRange = sheetRanges[programa as keyof typeof sheetRanges];
    
    if (!sheetRange) {
        return NextResponse.json({ success: false, message: 'Programa ou aba não encontrado para atualização.' }, { status: 404 });
    }

    const data = await getSheetData(spreadsheetId, sheetRange);
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
      const range = `${sheetRange.split('!')[0]}!${columnLetter}${update.row}`;
      
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
    console.error("Erro na API de atualização (Planilha):", error);
    return NextResponse.json(
      { success: false, message: error.message || 'Ocorreu um erro interno na atualização.' },
      { status: 500 }
    );
  }
}