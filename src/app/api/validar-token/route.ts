// src/app/api/validar-token/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();
  const tokenEsperado = process.env.TOKEN_ESPERADO;

  const valido = token === tokenEsperado;
  return NextResponse.json({ valido });
}
