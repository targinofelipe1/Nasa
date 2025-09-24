// src/app/api/ode/route.ts
import { NextResponse } from "next/server";
import {
  getSheetData,
  updateSheetData,
  appendSheetData,
} from "@/services/sheetService";

const SPREADSHEET_ID =
  "1eZwL4wrODi_nuE5IeLwWz3pXVFWiyuGt5Vl2bZVSqSQ"; // ✅ ID da planilha ODE
const SHEET_RANGE = "Página1!A:O"; // Colunas de A até O
const AUDIT_LOG_SHEET = "log-auditoria!A:E"; // timestamp, userId, programa, municipio, campo

// 🔹 Mapeamento de colunas permitidas por programa
const programColumnsMap: Record<"ode" | "auditoria", string[]> = {
  ode: [
    "NOME",
    "Setor de Trabalho",
    "Região",
    "Município",
    "Descrição",
    "Outro",
    "Obra",
    "Serviço",
    "Programa/Projeto/Entidade",
    "Ação",
    "Quantidade de Benefícios/Beneficiários",
    "Status",
    "Ano",
    "Valor",
    "Fonte de Recurso",
  ],
  auditoria: ["timestamp", "userId", "programa", "municipio", "campo"],
};

// 🔹 Função utilitária para converter índice em letra de coluna
const getColumnLetter = (index: number): string => {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

// 🔹 Normalizador de texto
const normalize = (str: string) =>
  str
    ? str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
    : "";

// ===================================================================
// 🔹 GET – Buscar dados
// ===================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 🔹 Normaliza o programa recebido
    let programName = searchParams.get("programa") || "";

    programName = programName.trim().toLowerCase();

    // 🔹 Permite usar "log-auditoria" como alias de "auditoria"
    if (programName === "log-auditoria") {
      programName = "auditoria";
    }


    if (!programName || !programColumnsMap[programName as keyof typeof programColumnsMap]) {
      console.error("❌ Programa inválido recebido:", programName);
      return NextResponse.json(
        { success: false, message: "Programa inválido." },
        { status: 400 }
      );
    }

    const spreadsheetId = SPREADSHEET_ID;
    const sheetRange =
      programName === "auditoria" ? AUDIT_LOG_SHEET : SHEET_RANGE;


    const data = await getSheetData(spreadsheetId, sheetRange);


    if (!data || data.length === 0) {
      console.warn("⚠️ Nenhum dado encontrado no range:", sheetRange);
      return NextResponse.json(
        { success: false, message: "Dados da planilha não encontrados." },
        { status: 404 }
      );
    }

    const headers = data[0];

    const programHeaders = programColumnsMap[programName as keyof typeof programColumnsMap];

    // Mapa header normalizado
    const headerMap = headers.reduce((map: any, h: string, i: number) => {
      map[normalize(h)] = i;
      return map;
    }, {});

    const filteredData = data.slice(1).map((row, i) => {
      const rowData: any = { __rowNumber: i + 2 };

      programHeaders.forEach((expectedHeader) => {
        const normalizedExpected = normalize(expectedHeader);
        const index = headerMap[normalizedExpected];

        if (index !== undefined) {
          rowData[expectedHeader] = row[index];
        } else {
          console.warn(
            `⚠️ Coluna '${expectedHeader}' não encontrada no headerMap (normalizado: ${normalizedExpected}).`
          );
        }
      });

      return rowData;
    });


    return NextResponse.json({
      success: true,
      data: filteredData,
      originalHeaders: headers,
    });
  } catch (error: any) {
    console.error("❌ Erro no GET ODE:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ===================================================================
// 🔹 POST – Inserir novo registro
// ===================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nome,
      setor,
      regiao,
      municipio,
      descricao,
      outro,
      obra,
      servico,
      programa,
      acao,
      qtdBeneficios,
      status,
      ano,
      valor,
      fonte,
      userId,
    } = body;

    if (!nome || !setor || !regiao || !municipio || !descricao || !programa || !acao || !status) {
      return NextResponse.json(
        { success: false, message: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const newRow = [
      nome,
      setor,
      regiao,
      municipio,
      descricao,
      outro || "",
      obra || "",
      servico || "",
      programa,
      acao,
      qtdBeneficios || "",
      status,
      ano || "",
      valor || "",
      fonte || "",
    ];

    await appendSheetData(SPREADSHEET_ID, SHEET_RANGE, [newRow]);

    // Log de auditoria
    const timestamp = new Date().toISOString();
    const logEntry = [timestamp, userId, programa, municipio, "Novo registro criado"];
    await appendSheetData(SPREADSHEET_ID, AUDIT_LOG_SHEET, [logEntry]);

    return NextResponse.json(
      { success: true, message: "Registro criado com sucesso!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Erro no POST ODE:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ===================================================================
// 🔹 PATCH – Atualizar dados + log
// ===================================================================
export async function PATCH(request: Request) {
  try {
    const { updates, programa, userId, municipio } = await request.json();

    if (!updates || !Array.isArray(updates) || !programa || !userId || !municipio) {
      return NextResponse.json(
        { success: false, message: "Dados insuficientes para a atualização." },
        { status: 400 }
      );
    }

    const spreadsheetId = SPREADSHEET_ID;
    const data = await getSheetData(spreadsheetId, SHEET_RANGE);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Dados da planilha não encontrados." },
        { status: 404 }
      );
    }

    const headers = data[0];
    const normalizedHeaderMap = headers.reduce((map: any, h: string, i: number) => {
      map[normalize(h)] = i;
      return map;
    }, {});

    const updatedFieldsSummary: string[] = [];

    for (const update of updates) {
      const columnIndex = normalizedHeaderMap[normalize(update.key)];

      if (columnIndex === undefined) {
        console.warn(`⚠️ Coluna '${update.key}' não encontrada no headerMap normalizado.`);
        continue;
      }

      if (!data[update.row - 1]) {
        console.warn(`⚠️ Linha ${update.row} não existe na planilha.`);
        continue;
      }

      const columnLetter = getColumnLetter(columnIndex);
      const range = `${SHEET_RANGE.split("!")[0]}!${columnLetter}${update.row}`;

      await updateSheetData(spreadsheetId, range, [[update.value]]);

      if (update.originalValue !== update.value) {
        updatedFieldsSummary.push(
          `Campo '${update.key}' de '${update.originalValue || ""}' para '${update.value}'`
        );
      }
    }

    if (updatedFieldsSummary.length > 0) {
      const timestamp = new Date().toISOString();

      for (const change of updatedFieldsSummary) {
        const logEntry = [timestamp, userId, programa, municipio, change];
        await appendSheetData(SPREADSHEET_ID, AUDIT_LOG_SHEET, [logEntry]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dados atualizados com sucesso!",
    });
  } catch (error: any) {
    console.error("❌ Erro no PATCH ODE:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
