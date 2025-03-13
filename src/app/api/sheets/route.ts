import { NextResponse } from 'next/server';
import { getSheetData } from '@/services/sheetService';

const SPREADSHEET_ID = '1xEhQS_i8sRkIlTlndnvlmtfxHkbkmp0tK-nH2xthbLc';

const SHEET_RANGE = 'dados!A:CN';

export async function GET() {
  try {
    const data = await getSheetData(SPREADSHEET_ID, SHEET_RANGE);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
