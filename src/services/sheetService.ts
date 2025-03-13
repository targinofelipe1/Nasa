import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const credentialsPath = path.join(process.cwd(), 'src/private/sedh-next-api-64604d824ea4.json');

if (!fs.existsSync(credentialsPath)) {
  throw new Error('Arquivo de credenciais JSON não encontrado. Verifique o caminho.');
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

export async function getSheetData(spreadsheetId: string, range: string) {
  try {
    const client = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    if (!res.data.values) {
      throw new Error('Nenhum dado encontrado na planilha.');
    }

    return res.data.values;
  } catch (error: any) {
    console.error('Erro ao acessar a planilha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Erro ao buscar os dados.');
  }
}
