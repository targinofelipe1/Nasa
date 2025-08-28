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
      ['https://www.googleapis.com/auth/spreadsheets'] 
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

export async function updateSheetData(
    spreadsheetId: string,
    range: string,
    values: any[][]
) {
    try {
        const client = new google.auth.JWT(
            credentials.client_email,
            undefined,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        await client.authorize();
        const sheets = google.sheets({ version: 'v4', auth: client });
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
    } catch (error: any) {
        console.error('Erro ao atualizar a planilha:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Erro ao atualizar os dados.');
    }
}

// ✅ Nova função para adicionar dados ao final da planilha
export async function appendSheetData(
    spreadsheetId: string,
    range: string,
    values: any[][]
) {
    try {
        const client = new google.auth.JWT(
            credentials.client_email,
            undefined,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        await client.authorize();
        const sheets = google.sheets({ version: 'v4', auth: client });
        
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
    } catch (error: any) {
        console.error('Erro ao adicionar dados na planilha:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Erro ao adicionar os dados.');
    }
}