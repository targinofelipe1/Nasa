// src/app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/* ===================== Helper de Log (cap por itens e bytes) ===================== */
const MAX_LOG_ITEMS = 20;
const MAX_LOG_BYTES = 12_000;

function clipStr(s: string | undefined, max = 400) {
  if (!s) return s as any;
  return s.length > max ? s.slice(0, max) + '…' : s;
}

type LogEntry = { action: string; at: string; targetUserId?: string; by?: string; byUserId?: string };

function appendCappedLog(prev: LogEntry[] | undefined, entry: LogEntry): LogEntry[] {
  const sanitized: LogEntry = {
    ...entry,
    action: clipStr(entry.action, 400),
    by: clipStr(entry.by, 100),
  };
  let log = [...(prev || []).slice(-(MAX_LOG_ITEMS - 1)), sanitized];
  let json = JSON.stringify(log);
  while (json.length > MAX_LOG_BYTES && log.length > 1) {
    log = log.slice(1);
    json = JSON.stringify(log);
  }
  return log;
}
/* ================================================================================ */

// GET /api/users/:userId
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const sessions = await client.sessions.getSessionList({ userId });
    const isBlocked = !!user.banned;

    const userWithSessions = {
      ...user,
      sessions: sessions.data,
      isBlocked,
    };

    return NextResponse.json(userWithSessions, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuário.' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const client = await clerkClient();
    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const userToDelete = await client.users.getUser(userId);
    const targetFullName = `${userToDelete.firstName || ''} ${userToDelete.lastName || ''}`.trim();
    const adminUser = await client.users.getUser(adminId);
    const currentAdminPrivate = (adminUser.privateMetadata || {}) as { adminAuditLog?: LogEntry[] };

    const adminAuditEntry: LogEntry = {
      action: `Removeu o usuário ${targetFullName}`,
      targetUserId: userId,
      at: new Date().toISOString(),
    };

    await client.users.updateUser(adminId, {
      privateMetadata: {
        ...currentAdminPrivate,
        adminAuditLog: appendCappedLog(currentAdminPrivate.adminAuditLog, adminAuditEntry),
      },
    });

    await client.users.deleteUser(userId);

    return NextResponse.json({ message: 'Usuário removido com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return NextResponse.json({ error: 'Erro ao remover o usuário.' }, { status: 500 });
  }
}

// PATCH /api/users/:userId  (ban/unban e edição de nome) com logs capados
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { isBlocked, firstName, lastName } = await request.json();

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const client = await clerkClient();
    const adminUser = await client.users.getUser(adminId);
    const adminFullName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim();

    const userToUpdate = await client.users.getUser(userId);
    const targetFullName = `${userToUpdate.firstName || ''} ${userToUpdate.lastName || ''}`.trim();
    const currentTargetPrivate = (userToUpdate.privateMetadata || {}) as { auditLog?: LogEntry[] };
    const currentAdminPrivate = (adminUser.privateMetadata || {}) as { adminAuditLog?: LogEntry[] };

    let auditEntryTarget: LogEntry | null = null;
    let adminAuditEntry: LogEntry | null = null;

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

    if (firstName !== undefined || lastName !== undefined) {
      await client.users.updateUser(userId, { firstName, lastName });
      auditEntryTarget = { action: 'Edição', by: adminFullName, byUserId: adminId, at: new Date().toISOString() };
      adminAuditEntry = { action: `Editou os dados do usuário ${targetFullName}`, targetUserId: userId, at: new Date().toISOString() };
    }

    if (auditEntryTarget && adminAuditEntry) {
      const updatedAuditLogTarget = appendCappedLog(currentTargetPrivate.auditLog, auditEntryTarget);
      const updatedAdminAuditLog = appendCappedLog(currentAdminPrivate.adminAuditLog, adminAuditEntry);

      await client.users.updateUser(userId, {
        privateMetadata: {
          ...currentTargetPrivate,
          auditLog: updatedAuditLogTarget,
        },
      });

      await client.users.updateUser(adminId, {
        privateMetadata: {
          ...currentAdminPrivate,
          adminAuditLog: updatedAdminAuditLog,
        },
      });
    }

    return NextResponse.json({ message: 'Usuário atualizado com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar o status do usuário.' }, { status: 500 });
  }
}
