import { NextRequest, NextResponse } from 'next/server'
import { PLANILHAS } from '@/app/api/sheets/eleicao/[id]/route'
import { cacheDb } from '@/lib/cacheDb'
import { getSheetData } from '@/services/sheetService';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

export async function getSheetDataByRange (spreadsheetId: string, id: string) {
  let rangeToUse: string;
  if (id.startsWith('masculino') || id.startsWith('feminino')) {
    rangeToUse = 'Sheet1!A:Q'; 
  } else if (id === 'locais') {
    rangeToUse = 'Sheet1!A:G'; 
  } else if (id === 'apoio' || id === 'apoio_liderenca') { 
    rangeToUse = 'Sheet1!A:D'; 
  } else if (id === 'apoio_tanamesa') {
    rangeToUse = 'Sheet1!A:E'; 
  } else {
    rangeToUse = 'Sheet1!A:N'; 
  } 
  return await getSheetData(spreadsheetId, rangeToUse);
}

async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const spreadsheetId = PLANILHAS[id]

  if (!spreadsheetId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Planilha não encontrada para revalidar cache.'
      },
      { status: 404 }
    )
  }

  try {
    const data = await getSheetDataByRange(spreadsheetId, id)

    await cacheDb.set(id, JSON.stringify(data), {ex: (((60 * 60) * 24) * 30)})

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(`Erro ao buscar dados para ID ${id}:`, e)
    const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  } finally {
    await cacheDb.del(`lock:${id}`)
  }
}

export default verifySignatureAppRouter(POST)
