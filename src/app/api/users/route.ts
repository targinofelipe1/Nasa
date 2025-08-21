import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList();
    
    const usersData = usersResponse.data.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));
    
    return NextResponse.json({
      data: usersData,
      totalCount: usersResponse.totalCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

// NOVA FUNÇÃO: Lida com a criação de usuários (método POST)
export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!firstName || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    // A API do Clerk requer uma senha para o usuário, que deve ser provisória.
    const provisionalPassword = crypto.randomBytes(16).toString('hex');
    
    const client = await clerkClient();
    const newUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password: provisionalPassword,
    });

    console.log('Novo usuário criado:', newUser.id);
        
    return NextResponse.json({
      message: 'Usuário cadastrado com sucesso!',
      userId: newUser.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar o usuário.' }, { status: 500 });
  }
}