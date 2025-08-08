import { NextRequest, NextResponse } from 'next/server'
import { PLANILHAS, getSheetDataByRange } from '@/services/sheetService'
import { cacheDb } from '@/lib/cacheDb'
import { Receiver } from '@upstash/qstash'
import { headers } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })
  const signature = (await headers()).get('Upstash-Signature')
  const { id } = await params
  const spreadsheetId = PLANILHAS[id]
  const body = await req.text()

  if (!signature)
    return NextResponse.json(
      { success: false, message: 'Pedido de atualização de cache inválido.' },
      { status: 500 }
    )

  if (!(await receiver.verify({
    body,
    signature
  }))) {
    return NextResponse.json(
      { success: false, message: 'Pedido de atualização de cache inválido.' },
      { status: 500 }
    )
  }

  if (!spreadsheetId && body) {
    return NextResponse.json(
      {
        success: false,
        message: 'Planilha não encontrada para revalidar cache.'
      },
      { status: 404 }
    )
  }

  try {
    const data = body ?? (await getSheetDataByRange(spreadsheetId, id))

    await cacheDb.set(id, JSON.stringify(data), { ex: 60 * 60 * 24 * 30 })

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
