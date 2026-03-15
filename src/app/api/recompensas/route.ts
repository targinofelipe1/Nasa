import { NextResponse } from "next/server";
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "@/services/sheetService";
import { getUsuarioConsolidado } from "@/lib/usuario-consolidado";

const SPREADSHEET_ID = "1CjcvmV8Hy5NnSvzFOvOHmUclD6IKVVtBLDc4qWshs0I";

const SHEET_USUARIOS = "usuarios!A:N";
const SHEET_RECOMPENSAS = "recompensas!A:L";
const SHEET_RESGATES = "resgates-recompensas!A:H";
const SHEET_AUDITORIA = "auditoria-recompensas!A:H";
const SHEET_CONFIG = "config-recompensas!A:C";

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

type RecompensaRow = {
  recompensaId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  custo: string;
  imagemUrl: string;
  disponivel: string;
  estoque: string;
  nivelMinimo: string;
  createdAt: string;
  updatedAt: string;
  status: string;
};

type ResgateRow = {
  resgateId: string;
  recompensaId: string;
  userId: string;
  usuarioNome: string;
  coinsGastos: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ConfigRow = {
  chave: string;
  valor: string;
  descricao: string;
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

function toBool(value: string | undefined) {
  return String(value || "").trim().toLowerCase() === "true";
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
  const raw = data.slice(1);

  return {
    headers,
    raw,
    rows: raw.map((row) => rowToObject<T>(headers, row)),
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

  await appendSheetData(SPREADSHEET_ID, SHEET_AUDITORIA, [[
    generateId("log"),
    params.userId,
    params.usuarioNome,
    params.acao,
    params.entidade,
    params.entidadeId,
    params.detalhes,
    now,
  ]]);
}

async function findUsuarioById(userId: string) {
  const { headers, rows } = await getAllRows<UsuarioRow>(SHEET_USUARIOS);
  const index = rows.findIndex((u) => u.userId === userId);

  if (index === -1) return null;

  return {
    headers,
    rowNumber: index + 2,
    user: rows[index],
  };
}

async function findRecompensaById(recompensaId: string) {
  const { headers, rows } = await getAllRows<RecompensaRow>(SHEET_RECOMPENSAS);
  const index = rows.findIndex((r) => r.recompensaId === recompensaId);

  if (index === -1) return null;

  return {
    headers,
    rowNumber: index + 2,
    recompensa: rows[index],
  };
}

async function updateUsuarioCoins(userId: string, deltaCoins: number) {
  const found = await findUsuarioById(userId);
  if (!found) return false;

  const { headers, rowNumber, user } = found;
  const currentCoins = toNumber(user.coins, 0);
  const nextCoins = Math.max(0, currentCoins + deltaCoins);
  const now = new Date().toISOString();

  const updates: Array<{ key: keyof UsuarioRow; value: string }> = [
    { key: "coins", value: String(nextCoins) },
    { key: "updatedAt", value: now },
  ];

  for (const update of updates) {
    const colIndex = headers.indexOf(update.key);
    if (colIndex === -1) continue;

    const colLetter = getColumnLetter(colIndex);
    await updateSheetData(
      SPREADSHEET_ID,
      `usuarios!${colLetter}${rowNumber}`,
      [[update.value]]
    );
  }

  return true;
}

async function updateRecompensaAfterResgate(
  recompensaId: string,
  options?: { marcarIndisponivelSeSemEstoque?: boolean }
) {
  const found = await findRecompensaById(recompensaId);
  if (!found) return false;

  const { headers, rowNumber, recompensa } = found;
  const currentEstoque = toNumber(recompensa.estoque, 0);
  const nextEstoque = Math.max(0, currentEstoque - 1);
  const now = new Date().toISOString();

  const updates: Array<{ key: keyof RecompensaRow; value: string }> = [
    { key: "estoque", value: String(nextEstoque) },
    { key: "updatedAt", value: now },
  ];

  if (options?.marcarIndisponivelSeSemEstoque && nextEstoque <= 0) {
    updates.push({ key: "disponivel", value: "false" });
  }

  for (const update of updates) {
    const colIndex = headers.indexOf(update.key);
    if (colIndex === -1) continue;

    const colLetter = getColumnLetter(colIndex);
    await updateSheetData(
      SPREADSHEET_ID,
      `recompensas!${colLetter}${rowNumber}`,
      [[update.value]]
    );
  }

  return true;
}

function calcularNivel(pontos: number) {
  if (pontos >= 3000) return "Eco Legend";
  if (pontos >= 1500) return "Verde Master";
  if (pontos >= 500) return "Eco Warrior";
  if (pontos >= 100) return "Verde Expert";
  return "Iniciante Verde";
}

function nivelParaOrdem(nome: string) {
  const mapa: Record<string, number> = {
    "Iniciante Verde": 0,
    "Verde Expert": 1,
    "Eco Warrior": 2,
    "Verde Master": 3,
    "Eco Legend": 4,
  };
  return mapa[nome] ?? 0;
}

async function getConfigMap() {
  const { rows } = await getAllRows<ConfigRow>(SHEET_CONFIG);
  const map = new Map<string, string>();

  for (const row of rows) {
    if (row.chave) map.set(row.chave, row.valor ?? "");
  }

  return map;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    const [usuarioConsolidado, recompensasData, resgatesData, configMap] = await Promise.all([
    userId ? getUsuarioConsolidado(userId) : Promise.resolve(null),
    getAllRows<RecompensaRow>(SHEET_RECOMPENSAS),
    getAllRows<ResgateRow>(SHEET_RESGATES),
    getConfigMap(),
  ]);

  const pontosUsuario = usuarioConsolidado?.pontos || 0;
  const coinsUsuario = usuarioConsolidado?.coins || 0;

    const nivelAtual = calcularNivel(pontosUsuario);
    const limiteEstoqueZeroTornaIndisponivel =
      configMap.get("esgotar_desativa_recompensa") !== "false";

    const resgatesUsuario = resgatesData.rows
      .filter((r) => r.userId === userId && r.status !== "cancelado" && r.status !== "excluido")
      .map((r) => ({
        id: r.resgateId,
        recompensaId: r.recompensaId,
        coinsGastos: toNumber(r.coinsGastos, 0),
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const recompensas = recompensasData.rows
      .filter((r) => r.status !== "excluido")
      .map((r) => {
        const custo = toNumber(r.custo, 0);
        const estoque = toNumber(r.estoque, 0);
        const disponivelSheet = toBool(r.disponivel);
        const nivelMinimo = r.nivelMinimo || "Iniciante Verde";
        const podePorNivel =
          nivelParaOrdem(nivelAtual) >= nivelParaOrdem(nivelMinimo);

        const disponivelCalculado = limiteEstoqueZeroTornaIndisponivel
          ? disponivelSheet && estoque > 0
          : disponivelSheet;

        return {
          id: r.recompensaId,
          titulo: r.titulo,
          descricao: r.descricao,
          categoria: r.categoria,
          custo,
          imagem: r.imagemUrl,
          disponivel: disponivelCalculado,
          estoque,
          nivelMinimo,
         podeResgatar:
          !!usuarioConsolidado &&
          r.status !== "excluido" &&
          disponivelCalculado &&
          coinsUsuario >= custo &&
          podePorNivel,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          status: r.status,
        };
      })
      .sort((a, b) => a.custo - b.custo);

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
            coins: coinsUsuario,
            pontos: pontosUsuario,
            nivelAtual,
          }
        : null,
        recompensas,
        resgates: resgatesUsuario,
      },
    });
  } catch (error: any) {
    console.error("Erro GET /api/recompensas:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar recompensas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action !== "resgatar_recompensa") {
      return NextResponse.json(
        { success: false, message: "Ação inválida." },
        { status: 400 }
      );
    }

    const { userId, usuarioNome, recompensaId } = body;

    if (!userId || !usuarioNome || !recompensaId) {
      return NextResponse.json(
        { success: false, message: "Dados insuficientes para resgatar recompensa." },
        { status: 400 }
      );
    }

    const [usuarioFound, usuarioConsolidado, recompensaFound, configMap] = await Promise.all([
      findUsuarioById(userId),
      getUsuarioConsolidado(userId),
      findRecompensaById(recompensaId),
      getConfigMap(),
    ]);

    if (!usuarioFound) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado na planilha de recompensas." },
        { status: 404 }
      );
    }

    if (!usuarioConsolidado) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado nas planilhas consolidadas." },
        { status: 404 }
      );
    }

    if (!recompensaFound) {
      return NextResponse.json(
        { success: false, message: "Recompensa não encontrada." },
        { status: 404 }
      );
    }

   const usuario = usuarioFound.user;
    const recompensa = recompensaFound.recompensa;

    const coinsUsuarioLocal = toNumber(usuario.coins, 0);
    const coinsUsuarioConsolidado = usuarioConsolidado.coins || 0;
    const pontosUsuario = usuarioConsolidado.pontos || 0;
    const custo = toNumber(recompensa.custo, 0);
    const estoque = toNumber(recompensa.estoque, 0);
    const disponivel = toBool(recompensa.disponivel);

    if (recompensa.status === "excluido") {
      return NextResponse.json(
        { success: false, message: "Esta recompensa foi removida." },
        { status: 409 }
      );
    }

    const nivelAtual = calcularNivel(pontosUsuario);
    const nivelMinimo = recompensa.nivelMinimo || "Iniciante Verde";
    const podePorNivel =
      nivelParaOrdem(nivelAtual) >= nivelParaOrdem(nivelMinimo);

    if (!disponivel) {
      return NextResponse.json(
        { success: false, message: "Esta recompensa não está disponível." },
        { status: 409 }
      );
    }

    if (estoque <= 0) {
      return NextResponse.json(
        { success: false, message: "Recompensa esgotada." },
        { status: 409 }
      );
    }

    if (!podePorNivel) {
      return NextResponse.json(
        {
          success: false,
          message: `Seu nível atual não permite resgatar esta recompensa. Nível mínimo: ${nivelMinimo}.`,
        },
        { status: 403 }
      );
    }

    if (coinsUsuarioConsolidado < custo) {
      return NextResponse.json(
        { success: false, message: "Coins insuficientes para resgatar esta recompensa." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const resgateId = generateId("res");

    await appendSheetData(SPREADSHEET_ID, SHEET_RESGATES, [[
      resgateId,
      recompensaId,
      userId,
      usuarioNome,
      String(custo),
      "resgatado",
      now,
      now,
    ]]);

    const usuarioAtualizado = await updateUsuarioCoins(userId, -custo);
    if (!usuarioAtualizado) {
      return NextResponse.json(
        { success: false, message: "Erro ao atualizar coins do usuário." },
        { status: 500 }
      );
    }

    const esgotarDesativa =
      configMap.get("esgotar_desativa_recompensa") !== "false";

    const recompensaAtualizada = await updateRecompensaAfterResgate(recompensaId, {
      marcarIndisponivelSeSemEstoque: esgotarDesativa,
    });

    if (!recompensaAtualizada) {
      return NextResponse.json(
        { success: false, message: "Erro ao atualizar estoque da recompensa." },
        { status: 500 }
      );
    }

    await appendAuditoria({
      userId,
      usuarioNome,
      acao: "resgatou_recompensa",
      entidade: "resgate",
      entidadeId: resgateId,
      detalhes: `Resgatou a recompensa ${recompensa.titulo} por ${custo} coins.`,
    });

    return NextResponse.json({
      success: true,
      message: "Recompensa resgatada com sucesso.",
      data: {
        resgateId,
        recompensaId,
        coinsRestantes: Math.max(0, coinsUsuarioConsolidado - custo),      },
    });
  } catch (error: any) {
    console.error("Erro POST /api/recompensas:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao resgatar recompensa." },
      { status: 500 }
    );
  }
}