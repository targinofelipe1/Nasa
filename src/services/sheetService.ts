// src/services/sheetService.ts
import { google } from 'googleapis';

/**
 * Função auxiliar para criar o cliente autenticado do Google Sheets
 * usando as variáveis de ambiente configuradas na Vercel.
 */
function getGoogleClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('❌ Variáveis de ambiente do Google não configuradas corretamente.');
  }

  return new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

/**
 * 📥 Lê dados de uma planilha do Google Sheets.
 */
export async function getSheetData(spreadsheetId: string, range: string) {
  try {
    const client = getGoogleClient();
    await client.authorize();

    const sheets = google.sheets({ version: 'v4', auth: client });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    if (!res.data.values) {
      throw new Error('Nenhum dado encontrado na planilha.');
    }

    return res.data.values;
  } catch (error: any) {
    console.error('Erro ao acessar a planilha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Erro ao buscar os dados.');
  }
}

/**
 * ✏️ Atualiza células específicas de uma planilha do Google Sheets.
 */
export async function updateSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  try {
    const client = getGoogleClient();
    await client.authorize();

    const sheets = google.sheets({ version: 'v4', auth: client });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar a planilha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Erro ao atualizar os dados.');
  }
}

/**
 * ➕ Adiciona novas linhas ao final da planilha (append).
 */
export async function appendSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  try {
    const client = getGoogleClient();
    await client.authorize();

    const sheets = google.sheets({ version: 'v4', auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error: any) {
    console.error('Erro ao adicionar dados na planilha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Erro ao adicionar os dados.');
  }
}
