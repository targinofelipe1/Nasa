// src/app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

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

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const sessions = await client.sessions.getSessionList({ userId });
    
    // ✅ CORREÇÃO: Adicione a propriedade isBlocked para o modal de detalhes
    const isBlocked = !!user.banned; 

    const userWithSessions = {
      ...user,
      sessions: sessions.data,
      isBlocked, // Adiciona o status de bloqueio aos dados retornados
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

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json(
        { error: 'Não autorizado.' },
        { status: 401 }
      );
    }
    
    const userToDelete = await client.users.getUser(userId);
    const targetFullName = `${userToDelete.firstName || ''} ${userToDelete.lastName || ''}`.trim();
    const adminUser = await client.users.getUser(adminId);
    const currentAdminPrivateMetadata = (adminUser.privateMetadata || {}) as { adminAuditLog?: any[] };
    
    const adminAuditEntry = {
      action: `Removeu o usuário ${targetFullName}`,
      targetUserId: userId,
      at: new Date().toISOString(),
    };
    
    const updatedAdminAuditLog = [...(currentAdminPrivateMetadata.adminAuditLog || []), adminAuditEntry];
    
    await client.users.updateUser(adminId, {
      privateMetadata: {
        ...currentAdminPrivateMetadata,
        adminAuditLog: updatedAdminAuditLog,
      },
    });

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
    const { isBlocked, firstName, lastName } = await request.json();

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json(
        { error: 'Não autorizado.' },
        { status: 401 }
      );
    }
    
    const client = await clerkClient();
    
    const adminUser = await client.users.getUser(adminId);
    const adminFullName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim();
    
    const userToUpdate = await client.users.getUser(userId);
    const targetFullName = `${userToUpdate.firstName || ''} ${userToUpdate.lastName || ''}`.trim();
    const currentPrivateMetadata = (userToUpdate.privateMetadata || {}) as { auditLog?: any[] };
    const currentAdminPrivateMetadata = (adminUser.privateMetadata || {}) as { adminAuditLog?: any[] };

    let auditEntryTarget = null;
    let adminAuditEntry = null;

    // ✅ CORREÇÃO: Lógica direta de banir/desbanir
    if (isBlocked !== undefined) {
      if (isBlocked) {
        await client.users.banUser(userId);
        auditEntryTarget = { action: 'Bloqueou', by: adminFullName, byUserId: adminId, at: new Date().toISOString() };
        adminAuditEntry = { action: `Bloqueou o usuário ${targetFullName}`, targetUserId: userId, at: new Date().toISOString() };
      } else {
        await client.users.unbanUser(userId);
        auditEntryTarget = { action: 'Desbloqueou', by: adminFullName, byUserId: adminId, at: new Date().toISOString() };
        adminAuditEntry = { action: `Desbloqueou o usuário ${targetFullName}`, targetUserId: userId, at: new Date().toISOString() };
      }
    }
    
    // ✅ CORREÇÃO: Lógica para edição de dados
    if (firstName !== undefined || lastName !== undefined) {
      await client.users.updateUser(userId, { firstName, lastName });
      auditEntryTarget = { action: 'Edição', by: adminFullName, byUserId: adminId, at: new Date().toISOString() };
      adminAuditEntry = { action: `Editou os dados do usuário ${targetFullName}`, targetUserId: userId, at: new Date().toISOString() };
    }

    if (auditEntryTarget && adminAuditEntry) {
        const updatedAuditLogTarget = [...(currentPrivateMetadata.auditLog || []), auditEntryTarget];
        const updatedAdminAuditLog = [...(currentAdminPrivateMetadata.adminAuditLog || []), adminAuditEntry];
        
        await client.users.updateUser(userId, {
            privateMetadata: {
                ...currentPrivateMetadata,
                auditLog: updatedAuditLogTarget,
            },
        });
        
        await client.users.updateUser(adminId, {
            privateMetadata: {
                ...currentAdminPrivateMetadata,
                adminAuditLog: updatedAdminAuditLog,
            },
        });
    }

    return NextResponse.json(
      { message: `Usuário atualizado com sucesso!` },
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