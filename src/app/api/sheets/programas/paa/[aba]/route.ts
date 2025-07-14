import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/services/sheetService';

const SPREADSHEET_ID = '1gZoNPJyo9nFzriKwWHB8aZO0WSEgM-Y9nGWVeN786-Q';

export async function GET(
  req: NextRequest,
  { params }: { params: { aba: string } }
) {
  const { aba } = await params;
  
  const validTabs = ['Agricultores', 'Compras', 'Beneficiarios', 'Municipio', 'Entidades', 'Cooperativas', 'Compras_Cooperativas'];
  if (!validTabs.includes(aba)) {
    return NextResponse.json({ success: false, message: 'Aba inválida.' }, { status: 400 });
  }

  const SHEET_RANGE = `${aba}`;

  try {
    const data = await getSheetData(SPREADSHEET_ID, SHEET_RANGE);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
