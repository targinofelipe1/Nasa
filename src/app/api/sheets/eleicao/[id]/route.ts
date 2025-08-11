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
  const MAX_BYTES = 900_000
  const BATCH_SIZE = 5

  if (!spreadsheetId) {
    return NextResponse.json(
      { success: false, message: 'Planilha não encontrada.' },
      { status: 404 }
    )
  }

  try {
    const ttl = await cacheDb.ttl(id)
    const baseUrl = getBaseUrl(req)

    if (ttl == -2) {
      const data = await getSheetDataByRange(spreadsheetId, id)
      const json = JSON.stringify(data)
      const buffer = Buffer.from(json, 'utf-8')

      let chunks = []

      for (let i = 0; i < buffer.length; i += MAX_BYTES) {
        const chunk = buffer.subarray(i, i + MAX_BYTES)
        chunks.push(chunk.toString('utf-8'))

        if (chunks.length >= BATCH_SIZE) {
          await cacheDb.rpush(id, ...chunks)
          chunks = []
        }
      }

      await cacheDb.rpush(id, ...chunks)
      await cacheDb.expire(id, ((60*60)*24)*30)


      return NextResponse.json({ success: true, data })
    }

    if (ttl <= 60 * 60 * 24) {
      await jobs.publish({
        url: new URL(`/cache/votacao/${id}`, baseUrl).toString()
      })
    }

    const listLen = await cacheDb.llen(id)
    let jsonString = ''
    for (let i = 0; i < listLen; i += BATCH_SIZE) {
      jsonString += (await cacheDb.lrange(id, i, i + (BATCH_SIZE - 1))).join('')
    }

    const cache = JSON.parse(jsonString)

    return NextResponse.json({ success: true, data: cache })
  } catch (error: any) {
    console.error(`Erro ao buscar dados para ID ${id}:`, error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
