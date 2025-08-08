// app/api/sheets/eleicao/[id]/route.ts
import { getSheetDataByRange } from '@/services/sheetService'
import { cacheDb } from '@/lib/cacheDb'
import { jobs } from '@/lib/jobsClient'
import { NextRequest, NextResponse } from 'next/server'
import { PLANILHAS } from '@/services/sheetService'
import { getBaseUrl } from '@/utils/url'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const spreadsheetId = PLANILHAS[id]

  if (!spreadsheetId) {
    return NextResponse.json(
      { success: false, message: 'Planilha não encontrada.' },
      { status: 404 }
    )
  }

  try {
    const cache = await cacheDb.get(id)
    const ttl = await cacheDb.ttl(id)
    const baseUrl = getBaseUrl(req)

    if (!cache) {
      const data = await getSheetDataByRange(spreadsheetId, id)

      await jobs.publish({
        url: new URL(`/cache/votacao/${id}`, baseUrl).toString(),
        body: JSON.stringify(data)
      })

      return NextResponse.json({ success: true, data })
    }

    if (ttl <= 60 * 60 * 24) {
      await jobs.publish({
        url: new URL(`/cache/votacao/${id}`, baseUrl).toString()
      })
    }

    return NextResponse.json({ success: true, data: cache })
  } catch (error: any) {
    console.error(`Erro ao buscar dados para ID ${id}:`, error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
