// src/app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

// GET /api/users/:userId
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não fornecido.' },
        { status: 400 }
      );
    }

    // Clerk v5: é necessário obter o client com await
    const client = await clerkClient();

    const user = await client.users.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const sessions = await client.sessions.getSessionList({ userId });

    const userWithSessions = {
      ...user,
      sessions: sessions.data,
    };

    return NextResponse.json(userWithSessions, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário.' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:userId
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não fornecido.' },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    await client.users.deleteUser(userId);

    return NextResponse.json(
      { message: 'Usuário removido com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao remover o usuário.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> } 
) {
  try {
    const { userId } = await params;
    const { isBlocked } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não fornecido.' },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    if (isBlocked) {
      // Usa a função banUser para bloquear o usuário
      await client.users.banUser(userId);
    } else {
      // Usa a função unbanUser para desbloquear o usuário
      await client.users.unbanUser(userId);
    }

    return NextResponse.json(
      { message: `Usuário ${isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso!` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar o status do usuário.' },
      { status: 500 }
    );
  }
}


