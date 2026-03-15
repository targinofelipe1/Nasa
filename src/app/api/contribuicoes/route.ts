import { NextResponse } from "next/server";
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "@/services/sheetService";
import { getUsuarioConsolidado } from "@/lib/usuario-consolidado";

const SPREADSHEET_ID = "1sOFnVuBrUVXPqDPDgSQq9iyvlYF2D6622Cg7t6yBuI0";

const SHEET_USUARIOS = "usuarios!A:N";
const SHEET_CONTRIBUICOES = "contribuicoes!A:L";
const SHEET_AUDITORIA = "auditoria-contribuicoes!A:H";

type UsuarioRow = {
  userId: string;
  nome: string;
  email: string;
  cidade: string;
  avatar: string;
  coins: string;
  pontos: string;
  totalRelatos: string;
  totalComentarios: string;
  totalCurtidasFeitas: string;
  totalCurtidasRecebidas: string;
  createdAt: string;
  updatedAt: string;
  status: string;
};

type ContribuicaoRow = {
  contribuicaoId: string;
  userId: string;
  usuarioNome: string;
  cidade: string;
  tipo: string;
  localizacao: string;
  descricao: string;
  quantidade: string;
  imagemUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToObject<T = Record<string, string>>(headers: string[], row: string[]): T {
  const obj: Record<string, string> = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] ?? "";
  });
  return obj as T;
}

function getColumnLetter(index: number): string {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

function toNumber(value: string | undefined, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getAllRows<T>(range: string): Promise<{
  headers: string[];
  rows: T[];
  raw: string[][];
}> {
  const data = await getSheetData(SPREADSHEET_ID, range);

  if (!data || data.length === 0) {
    return { headers: [], rows: [], raw: [] };
  }

  const headers = data[0];
  const rawRows = data.slice(1);

  return {
    headers,
    raw: rawRows,
    rows: rawRows.map((row) => rowToObject<T>(headers, row)),
  };
}

async function appendAuditoria(params: {
  userId: string;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
}) {
  const now = new Date().toISOString();

  const row = [
    generateId("log"),
    params.userId,
    params.usuarioNome,
    params.acao,
    params.entidade,
    params.entidadeId,
    params.detalhes,
    now,
  ];

  await appendSheetData(SPREADSHEET_ID, SHEET_AUDITORIA, [row]);
}

async function findUsuarioById(userId: string) {
  const { rows, headers } = await getAllRows<UsuarioRow>(SHEET_USUARIOS);
  const index = rows.findIndex((u) => u.userId === userId);

  if (index === -1) return null;

  return {
    user: rows[index],
    rowNumber: index + 2,
    headers,
  };
}

async function updateUsuarioMetricas(
  userId: string,
  changes: Partial<{
    coins: number;
    pontos: number;
  }>
) {
  const found = await findUsuarioById(userId);
  if (!found) return false;

  const { user, headers, rowNumber } = found;

  const updates: Array<{ key: keyof UsuarioRow; value: string }> = [];

  if (changes.coins !== undefined) {
    updates.push({
      key: "coins",
      value: String(toNumber(user.coins, 0) + changes.coins),
    });
  }

  if (changes.pontos !== undefined) {
    updates.push({
      key: "pontos",
      value: String(toNumber(user.pontos, 0) + changes.pontos),
    });
  }

  updates.push({
    key: "updatedAt",
    value: new Date().toISOString(),
  });

  for (const update of updates) {
    const colIndex = headers.indexOf(update.key);
    if (colIndex === -1) continue;

    const colLetter = getColumnLetter(colIndex);
    const range = `usuarios!${colLetter}${rowNumber}`;
    await updateSheetData(SPREADSHEET_ID, range, [[update.value]]);
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    const [contribuicoesData, usuarioConsolidado] = await Promise.all([
      getAllRows<ContribuicaoRow>(SHEET_CONTRIBUICOES),
      userId ? getUsuarioConsolidado(userId) : Promise.resolve(null),
    ]);

    const contribuicoes = contribuicoesData.rows
      .filter((item) => item.status !== "excluido")
      .map((item) => ({
        id: item.contribuicaoId,
        userId: item.userId,
        usuario: item.usuarioNome,
        cidade: item.cidade,
        tipo: item.tipo,
        localizacao: item.localizacao,
        descricao: item.descricao,
        quantidade: item.quantidade,
        imagemUrl: item.imagemUrl,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const rankingMap = new Map<
      string,
      {
        userId: string;
        nome: string;
        cidade: string;
        contribuicoes: number;
        pontos: number;
      }
    >();

    for (const item of contribuicoes) {
      const atual = rankingMap.get(item.userId);

      if (atual) {
        atual.contribuicoes += 1;
        atual.pontos += 10;
      } else {
        rankingMap.set(item.userId, {
          userId: item.userId,
          nome: item.usuario,
          cidade: item.cidade,
          contribuicoes: 1,
          pontos: 10,
        });
      }
    }

    const ranking = Array.from(rankingMap.values())
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        usuario: usuarioConsolidado
          ? {
              userId: usuarioConsolidado.userId,
              nome: usuarioConsolidado.nome,
              email: usuarioConsolidado.email,
              cidade: usuarioConsolidado.cidade,
              avatar: usuarioConsolidado.avatar,
              coins: usuarioConsolidado.coins,
              pontos: usuarioConsolidado.pontos,
            }
          : null,
        contribuicoes,
        ranking,
      },
    });
  } catch (error: any) {
    console.error("Erro GET /api/contribuicoes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar contribuições." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      userId,
      usuarioNome,
      cidade,
      tipo,
      localizacao,
      descricao,
      quantidade,
      imagemUrl,
    } = body;

    if (!userId || !usuarioNome || !cidade || !tipo || !descricao || !quantidade) {
      return NextResponse.json(
        { success: false, message: "Dados insuficientes para cadastrar contribuição." },
        { status: 400 }
      );
    }

    const usuarioFound = await findUsuarioById(userId);

    if (!usuarioFound) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado na aba usuarios." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const contribuicaoId = generateId("cont");

    const newRow = [
      contribuicaoId,
      userId,
      usuarioNome,
      cidade,
      tipo,
      localizacao || "",
      descricao,
      quantidade,
      imagemUrl || "",
      "ativo",
      now,
      now,
    ];

    await appendSheetData(SPREADSHEET_ID, SHEET_CONTRIBUICOES, [newRow]);

    await updateUsuarioMetricas(userId, {
      coins: 5,
      pontos: 10,
    });

    await appendAuditoria({
      userId,
      usuarioNome,
      acao: "criou_contribuicao",
      entidade: "contribuicao",
      entidadeId: contribuicaoId,
      detalhes: `Criou contribuição do tipo ${tipo} em ${cidade}.`,
    });

    return NextResponse.json({
      success: true,
      message: "Contribuição cadastrada com sucesso.",
      data: {
        contribuicaoId,
      },
    });
  } catch (error: any) {
    console.error("Erro POST /api/contribuicoes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao cadastrar contribuição." },
      { status: 500 }
    );
  }
}