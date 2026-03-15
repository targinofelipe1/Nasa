import { getSheetData } from "@/services/sheetService";

export type UsuarioRow = {
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

const SPREADSHEET_ID_COMUNIDADE = "1C34kNM6MErZp-e7MBUwc-8vDCW35R68EDVHRyt9SnAo";
const SPREADSHEET_ID_CONTRIBUICOES = "1sOFnVuBrUVXPqDPDgSQq9iyvlYF2D6622Cg7t6yBuI0";
const SPREADSHEET_ID_RECOMPENSAS = "1CjcvmV8Hy5NnSvzFOvOHmUclD6IKVVtBLDc4qWshs0I";

const SHEET_USUARIOS = "usuarios!A:N";

function rowToObject<T = Record<string, string>>(headers: string[], row: string[]): T {
  const obj: Record<string, string> = {};

  headers.forEach((header, index) => {
    obj[header] = row[index] ?? "";
  });

  return obj as T;
}

function toNumber(value: string | undefined, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getUsuarioFromSpreadsheet(
  spreadsheetId: string,
  userId: string
): Promise<UsuarioRow | null> {
  const data = await getSheetData(spreadsheetId, SHEET_USUARIOS);

  if (!data || data.length === 0) return null;

  const headers = data[0];
  const rows = data.slice(1).map((row) => rowToObject<UsuarioRow>(headers, row));

  return rows.find((row) => row.userId === userId) || null;
}

export async function getUsuarioConsolidado(userId: string) {
  const [usuarioComunidade, usuarioContribuicoes, usuarioRecompensas] =
    await Promise.all([
      getUsuarioFromSpreadsheet(SPREADSHEET_ID_COMUNIDADE, userId),
      getUsuarioFromSpreadsheet(SPREADSHEET_ID_CONTRIBUICOES, userId),
      getUsuarioFromSpreadsheet(SPREADSHEET_ID_RECOMPENSAS, userId),
    ]);

  const base =
    usuarioRecompensas || usuarioComunidade || usuarioContribuicoes || null;

  if (!base) return null;

  return {
    userId: base.userId,
    nome: base.nome,
    email: base.email,
    cidade: base.cidade,
    avatar: base.avatar,
    coins:
      toNumber(usuarioComunidade?.coins) +
      toNumber(usuarioContribuicoes?.coins) +
      toNumber(usuarioRecompensas?.coins),
    pontos:
      toNumber(usuarioComunidade?.pontos) +
      toNumber(usuarioContribuicoes?.pontos) +
      toNumber(usuarioRecompensas?.pontos),
    totalRelatos:
      toNumber(usuarioComunidade?.totalRelatos) +
      toNumber(usuarioContribuicoes?.totalRelatos) +
      toNumber(usuarioRecompensas?.totalRelatos),
    totalComentarios:
      toNumber(usuarioComunidade?.totalComentarios) +
      toNumber(usuarioContribuicoes?.totalComentarios) +
      toNumber(usuarioRecompensas?.totalComentarios),
    totalCurtidasFeitas:
      toNumber(usuarioComunidade?.totalCurtidasFeitas) +
      toNumber(usuarioContribuicoes?.totalCurtidasFeitas) +
      toNumber(usuarioRecompensas?.totalCurtidasFeitas),
    totalCurtidasRecebidas:
      toNumber(usuarioComunidade?.totalCurtidasRecebidas) +
      toNumber(usuarioContribuicoes?.totalCurtidasRecebidas) +
      toNumber(usuarioRecompensas?.totalCurtidasRecebidas),
    status: base.status,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}