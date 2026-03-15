import { NextResponse } from "next/server";
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "@/services/sheetService";

const SPREADSHEET_ID = "1CjcvmV8Hy5NnSvzFOvOHmUclD6IKVVtBLDc4qWshs0I";
const SHEET_USUARIOS = "usuarios!A:N";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, nome, email, cidade, avatar } = body;

    if (!userId || !nome || !email) {
      return NextResponse.json(
        { success: false, message: "Dados insuficientes para cadastrar usuário." },
        { status: 400 }
      );
    }

    const data = await getSheetData(SPREADSHEET_ID, SHEET_USUARIOS);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: "A aba de usuários está vazia ou sem cabeçalhos." },
        { status: 500 }
      );
    }

    const headers = data[0];
    const rows = data.slice(1).map((row) => rowToObject<UsuarioRow>(headers, row));
    const existenteIndex = rows.findIndex(
      (row) =>
        row.userId === userId ||
        String(row.email || "").toLowerCase() === String(email).toLowerCase()
    );

    const now = new Date().toISOString();

    if (existenteIndex !== -1) {
      const existente = rows[existenteIndex];
      const rowNumber = existenteIndex + 2;

      const updates: Array<{ key: keyof UsuarioRow; value: string }> = [];

      if (!existente.nome && nome) updates.push({ key: "nome", value: nome });
      if (!existente.cidade && cidade) updates.push({ key: "cidade", value: cidade });
      if (!existente.avatar && avatar) updates.push({ key: "avatar", value: avatar });
      updates.push({ key: "updatedAt", value: now });

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

      return NextResponse.json({
        success: true,
        message: "Usuário já existia e foi sincronizado com sucesso.",
      });
    }

    const novaLinha = [
      userId,
      nome,
      email,
      cidade || "",
      avatar || "US",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      now,
      now,
      "ativo",
    ];

    await appendSheetData(SPREADSHEET_ID, SHEET_USUARIOS, [novaLinha]);

    return NextResponse.json({
      success: true,
      message: "Usuário cadastrado com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao cadastrar/sincronizar usuário de recompensas:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao cadastrar usuário." },
      { status: 500 }
    );
  }
}