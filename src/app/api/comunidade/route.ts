import { NextResponse } from "next/server";
import {
  getSheetData,
  appendSheetData,
  updateSheetData,
} from "@/services/sheetService";
import { getUsuarioConsolidado } from "@/lib/usuario-consolidado";

const SPREADSHEET_ID = "1C34kNM6MErZp-e7MBUwc-8vDCW35R68EDVHRyt9SnAo";

const SHEET_USUARIOS = "usuarios!A:N";
const SHEET_RELATOS = "relatos!A:N";
const SHEET_COMENTARIOS = "comentarios!A:I";
const SHEET_CURTIDAS = "curtidas!A:E";
const SHEET_AUDITORIA = "auditoria-comunidade!A:H";

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

type RelatoRow = {
  relatoId: string;
  userId: string;
  usuarioNome: string;
  usuarioCidade: string;
  usuarioAvatar: string;
  conteudo: string;
  categoria: string;
  localizacao: string;
  imagemUrl: string;
  likesCount: string;
  comentariosCount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ComentarioRow = {
  comentarioId: string;
  relatoId: string;
  userId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  conteudo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CurtidaRow = {
  curtidaId: string;
  relatoId: string;
  userId: string;
  tipo: string;
  createdAt: string;
};

type AuditoriaRow = {
  logId: string;
  userId: string;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  createdAt: string;
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

async function getAllRows<T>(range: string): Promise<{ headers: string[]; rows: T[]; raw: string[][] }> {
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

async function appendAuditoria(entry: Omit<AuditoriaRow, "logId" | "createdAt">) {
  const now = new Date().toISOString();

  const logRow = [
    generateId("log"),
    entry.userId,
    entry.usuarioNome,
    entry.acao,
    entry.entidade,
    entry.entidadeId,
    entry.detalhes,
    now,
  ];

  await appendSheetData(SPREADSHEET_ID, SHEET_AUDITORIA, [logRow]);
}

async function findUsuarioById(userId: string) {
  const { rows, raw, headers } = await getAllRows<UsuarioRow>(SHEET_USUARIOS);
  const index = rows.findIndex((u) => u.userId === userId);
  if (index === -1) return null;

  return {
    user: rows[index],
    rowNumber: index + 2,
    headers,
    rawRow: raw[index],
  };
}

async function updateUsuarioMetricas(
  userId: string,
  changes: Partial<{
    coins: number;
    pontos: number;
    totalRelatos: number;
    totalComentarios: number;
    totalCurtidasFeitas: number;
    totalCurtidasRecebidas: number;
  }>
) {
  const found = await findUsuarioById(userId);
  if (!found) return;

  const { user, headers, rowNumber } = found;
  const updates: Array<{ key: keyof UsuarioRow; value: string }> = [];

  const numericKeys: Array<keyof typeof changes> = [
    "coins",
    "pontos",
    "totalRelatos",
    "totalComentarios",
    "totalCurtidasFeitas",
    "totalCurtidasRecebidas",
  ];

  for (const key of numericKeys) {
    if (changes[key] !== undefined) {
      const current = Number(user[key as keyof UsuarioRow] || 0);
      const next = current + Number(changes[key] || 0);
      updates.push({ key: key as keyof UsuarioRow, value: String(next) });
    }
  }

  updates.push({ key: "updatedAt", value: new Date().toISOString() });

  for (const update of updates) {
    const colIndex = headers.indexOf(update.key);
    if (colIndex === -1) continue;

    const colLetter = getColumnLetter(colIndex);
    const sheetName = SHEET_USUARIOS.split("!")[0];
    const range = `${sheetName}!${colLetter}${rowNumber}`;

    await updateSheetData(SPREADSHEET_ID, range, [[update.value]]);
  }
}

async function updateRelatoCounts(relatoId: string, changes: Partial<{ likesCount: number; comentariosCount: number }>) {
  const { rows, headers } = await getAllRows<RelatoRow>(SHEET_RELATOS);
  const index = rows.findIndex((r) => r.relatoId === relatoId);
  if (index === -1) return null;

  const row = rows[index];
  const rowNumber = index + 2;
  const updates: Array<{ key: keyof RelatoRow; value: string }> = [];

  if (changes.likesCount !== undefined) {
    updates.push({
      key: "likesCount",
      value: String(Math.max(0, Number(row.likesCount || 0) + changes.likesCount)),
    });
  }

  if (changes.comentariosCount !== undefined) {
    updates.push({
      key: "comentariosCount",
      value: String(Math.max(0, Number(row.comentariosCount || 0) + changes.comentariosCount)),
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
    const sheetName = SHEET_RELATOS.split("!")[0];
    const range = `${sheetName}!${colLetter}${rowNumber}`;

    await updateSheetData(SPREADSHEET_ID, range, [[update.value]]);
  }

  return row;
}

/**
 * GET /api/comunidade
 * ?userId=xxx
 *
 * Retorna:
 * - relatos
 * - comentários agrupados
 * - liked pelo usuário logado
 * - métricas do usuário
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    const [
      usuarioConsolidado,
      relatosData,
      comentariosData,
      curtidasData,
    ] = await Promise.all([
      userId ? getUsuarioConsolidado(userId) : Promise.resolve(null),
      getAllRows<RelatoRow>(SHEET_RELATOS),
      getAllRows<ComentarioRow>(SHEET_COMENTARIOS),
      getAllRows<CurtidaRow>(SHEET_CURTIDAS),
    ]);

    const comentariosAtivos = comentariosData.rows.filter((c) => c.status !== "excluido");
    const curtidasAtivas = curtidasData.rows.filter((c) => c.tipo === "relato");

    const relatos = relatosData.rows
      .filter((r) => r.status !== "excluido")
      .map((relato) => {
        const comentarios = comentariosAtivos
          .filter((c) => c.relatoId === relato.relatoId)
          .map((comentario) => ({
            id: comentario.comentarioId,
            usuario: comentario.usuarioNome,
            avatar: comentario.usuarioAvatar,
            conteudo: comentario.conteudo,
            createdAt: comentario.createdAt,
          }));

        const likes = curtidasAtivas.filter((c) => c.relatoId === relato.relatoId);
        const liked = !!likes.find((l) => l.userId === userId);

        return {
          id: relato.relatoId,
          userId: relato.userId,
          usuario: relato.usuarioNome,
          avatar: relato.usuarioAvatar,
          cidade: relato.usuarioCidade,
          conteudo: relato.conteudo,
          categoria: relato.categoria,
          localizacao: relato.localizacao,
          imagem: relato.imagemUrl,
          likes: likes.length,
          liked,
          comentarios,
          createdAt: relato.createdAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
              contribuicoes: 0,
            }
          : null,
        relatos,
      },
    });
  } catch (error: any) {
    console.error("Erro GET /api/comunidade:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar comunidade." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comunidade
 *
 * body.action:
 * - criar_relato
 * - comentar_relato
 * - curtir_relato
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: "Ação não informada." },
        { status: 400 }
      );
    }

    if (action === "criar_relato") {
      const {
        userId,
        usuarioNome,
        usuarioCidade,
        usuarioAvatar,
        conteudo,
        categoria,
        localizacao,
        imagemUrl,
      } = body;

      if (!userId || !usuarioNome || !conteudo?.trim()) {
        return NextResponse.json(
          { success: false, message: "Dados insuficientes para criar relato." },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const relatoId = generateId("rel");

      const newRow = [
        relatoId,
        userId,
        usuarioNome,
        usuarioCidade || "",
        usuarioAvatar || "",
        conteudo.trim(),
        categoria || "Geral",
        localizacao || "",
        imagemUrl || "",
        "0",
        "0",
        "ativo",
        now,
        now,
      ];

      await appendSheetData(SPREADSHEET_ID, SHEET_RELATOS, [newRow]);

      await updateUsuarioMetricas(userId, {
        coins: 5,
        pontos: 10,
        totalRelatos: 1,
      });

      await appendAuditoria({
        userId,
        usuarioNome,
        acao: "criou_relato",
        entidade: "relato",
        entidadeId: relatoId,
        detalhes: `Novo relato publicado na categoria ${categoria || "Geral"}.`,
      });

      return NextResponse.json({
        success: true,
        message: "Relato publicado com sucesso.",
        relatoId,
      });
    }

    if (action === "comentar_relato") {
      const {
        relatoId,
        userId,
        usuarioNome,
        usuarioAvatar,
        conteudo,
      } = body;

      if (!relatoId || !userId || !usuarioNome || !conteudo?.trim()) {
        return NextResponse.json(
          { success: false, message: "Dados insuficientes para comentar." },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const comentarioId = generateId("com");

      const comentarioRow = [
        comentarioId,
        relatoId,
        userId,
        usuarioNome,
        usuarioAvatar || "",
        conteudo.trim(),
        "ativo",
        now,
        now,
      ];

      await appendSheetData(SPREADSHEET_ID, SHEET_COMENTARIOS, [comentarioRow]);
      const relato = await updateRelatoCounts(relatoId, { comentariosCount: 1 });

      await updateUsuarioMetricas(userId, {
        coins: 2,
        pontos: 4,
        totalComentarios: 1,
      });

      await appendAuditoria({
        userId,
        usuarioNome,
        acao: "comentou_relato",
        entidade: "comentario",
        entidadeId: comentarioId,
        detalhes: `Comentou no relato ${relatoId}.`,
      });

      return NextResponse.json({
        success: true,
        message: "Comentário adicionado com sucesso.",
        comentarioId,
        relatoDonoUserId: relato?.userId || null,
      });
    }

    if (action === "curtir_relato") {
      const { relatoId, userId, usuarioNome } = body;

      if (!relatoId || !userId || !usuarioNome) {
        return NextResponse.json(
          { success: false, message: "Dados insuficientes para curtir." },
          { status: 400 }
        );
      }

      const curtidas = await getAllRows<CurtidaRow>(SHEET_CURTIDAS);
      const curtidaExistente = curtidas.rows.find(
        (c) => c.relatoId === relatoId && c.userId === userId && c.tipo === "relato"
      );

      if (curtidaExistente) {
        return NextResponse.json(
          { success: false, message: "Usuário já curtiu este relato." },
          { status: 409 }
        );
      }

      const curtidaId = generateId("cur");
      const now = new Date().toISOString();

      const newCurtida = [
        curtidaId,
        relatoId,
        userId,
        "relato",
        now,
      ];

      await appendSheetData(SPREADSHEET_ID, SHEET_CURTIDAS, [newCurtida]);

      const relato = await updateRelatoCounts(relatoId, { likesCount: 1 });

      await updateUsuarioMetricas(userId, {
        coins: 1,
        pontos: 1,
        totalCurtidasFeitas: 1,
      });

      if (relato?.userId) {
        await updateUsuarioMetricas(relato.userId, {
          totalCurtidasRecebidas: 1,
        });
      }

      await appendAuditoria({
        userId,
        usuarioNome,
        acao: "curtiu_relato",
        entidade: "curtida",
        entidadeId: curtidaId,
        detalhes: `Curtiu o relato ${relatoId}.`,
      });

      return NextResponse.json({
        success: true,
        message: "Relato curtido com sucesso.",
        curtidaId,
      });
    }

    return NextResponse.json(
      { success: false, message: "Ação inválida." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Erro POST /api/comunidade:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao processar ação." },
      { status: 500 }
    );
  }
}