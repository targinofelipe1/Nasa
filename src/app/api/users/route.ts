// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

// GET /api/users
export async function GET() {
  try {
    // ✅ Obtenha a instância do client
    const client = await clerkClient();

    // (opcional) passe paginação: { limit, offset, orderBy }
    const { data, totalCount } = await client.users.getUserList();

    const usersData = data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      imageUrl: user.imageUrl ?? null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));

    return NextResponse.json(
      { data: usersData, totalCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários.' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'Nome e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const provisionalPassword = crypto.randomBytes(16).toString('hex');

    // ✅ Obtenha a instância do client
    const client = await clerkClient();

    const newUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email], // forma correta no backend SDK
      password: provisionalPassword,
    });

    return NextResponse.json(
      { message: 'Usuário cadastrado com sucesso!', userId: newUser.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);

    // Tratamento de erro do Clerk (422 e e-mail já existente)
    if (error?.clerkError && error.status === 422) {
      const clerkErr = (error.errors as any[])?.[0];
      if (clerkErr?.code === 'form_code_email_exists') {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado.' },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro ao cadastrar o usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}
