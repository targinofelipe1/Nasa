import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

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