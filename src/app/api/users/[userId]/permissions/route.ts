// src/app/api/users/[userId]/permissions/route.ts
import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';

type UserPrivateMetadata = {
  allowedTabs?: string[];
  adminAuditLog?: Array<{
    action: string;
    targetUserId?: string;
    at: string;
    by?: string;
  }>;
  auditLog?: Array<{
    action: string;
    at: string;
    by?: string;
  }>;
};

/* ===================== Helper de Log (cap por itens e bytes) ===================== */
const MAX_LOG_ITEMS = 20;       // mantém até 20 entradas
const MAX_LOG_BYTES = 12_000;   // ~12 KB por JSON de log (conservador)

function clipStr(s: string | undefined, max = 400) {
  if (!s) return s as any;
  return s.length > max ? s.slice(0, max) + '…' : s;
}

type LogEntry = { action: string; at: string; targetUserId?: string; by?: string };

function appendCappedLog(prev: LogEntry[] | undefined, entry: LogEntry): LogEntry[] {
  const sanitized: LogEntry = {
    ...entry,
    action: clipStr(entry.action, 400),
    by: clipStr(entry.by, 100),
  };
  let log = [...(prev || []).slice(-(MAX_LOG_ITEMS - 1)), sanitized];
  let json = JSON.stringify(log);
  while (json.length > MAX_LOG_BYTES && log.length > 1) {
    log = log.slice(1); // remove mais antigo até caber
    json = JSON.stringify(log);
  }
  return log;
}
/* ================================================================================ */

// GET permissões
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const allowedFromUnsafe =
      ((user.unsafeMetadata || {}) as { allowedTabs?: string[] }).allowedTabs;
    const allowedFromPrivate =
      ((user.privateMetadata || {}) as UserPrivateMetadata).allowedTabs;

    const allowedTabs = allowedFromUnsafe ?? allowedFromPrivate ?? [];
    return NextResponse.json({ allowedTabs }, { status: 200 });
  } catch (error) {
    console.error('GET /permissions erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar permissões.' }, { status: 500 });
  }
}

// PATCH permissões (com logs capados + fallback anti-422)
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;
    const body = await request.json();

    // ===== Sanitização de allowedTabs =====
    const RAW_MAX_ITEMS = 50; // limite máximo de abas por usuário
    const RAW_MAX_LEN = 60;   // limite de caracteres por aba

    const allowedTabs: string[] = Array.isArray(body?.allowedTabs)
  ? [
      ...new Set(
        (body.allowedTabs as unknown[])
          .filter((t): t is string => typeof t === 'string')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => (s.length > RAW_MAX_LEN ? s.slice(0, RAW_MAX_LEN) : s))
      ),
    ]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, RAW_MAX_ITEMS)
  : [];


    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const client = await clerkClient();
    const [userToUpdate, adminUser] = await Promise.all([
      client.users.getUser(userId),
      client.users.getUser(adminId),
    ]);
    if (!userToUpdate || !adminUser) {
      return NextResponse.json({ error: 'Usuário ou Admin não encontrado.' }, { status: 404 });
    }

    const existingPrivate = (userToUpdate.privateMetadata || {}) as UserPrivateMetadata;
    // const existingUnsafe = (userToUpdate.unsafeMetadata || {}) as Record<string, unknown>; // use se precisar

    const oldAllowedTabs = existingPrivate.allowedTabs || [];

    // diffs
    const addedTabs = allowedTabs.filter((tab) => !oldAllowedTabs.includes(tab));
    const removedTabs = oldAllowedTabs.filter((tab) => !allowedTabs.includes(tab));

    // se nada mudou, evita writes desnecessários e crescimento de logs
    if (addedTabs.length === 0 && removedTabs.length === 0) {
      return NextResponse.json({ message: 'Nenhuma mudança de permissões.' }, { status: 200 });
    }

    // grava as abas (apenas em privateMetadata para economizar espaço)
    const newPrivateMetadata: UserPrivateMetadata = {
      ...existingPrivate,
      allowedTabs,
    };
    await client.users.updateUser(userId, {
      privateMetadata: newPrivateMetadata,
      // unsafeMetadata: { ...existingUnsafe, allowedTabs }, // descomente se você realmente usa isso no front
    });

    const userFullName = `${userToUpdate.firstName || ''} ${userToUpdate.lastName || ''}`.trim();
    const adminFullName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim();

    // mensagens de log
    let adminActionMessage = `Alterou as permissões do usuário ${userFullName}.`;
    if (addedTabs.length > 0) adminActionMessage += ` Adicionou: ${addedTabs.join(', ')}.`;
    if (removedTabs.length > 0) adminActionMessage += ` Removeu: ${removedTabs.join(', ')}.`;

    let userActionMessage = `Suas permissões foram alteradas por ${adminFullName}.`;
    if (addedTabs.length > 0) userActionMessage += ` Adicionadas: ${addedTabs.join(', ')}.`;
    if (removedTabs.length > 0) userActionMessage += ` Removidas: ${removedTabs.join(', ')}.`;

    const currentAdminPrivate = (adminUser.privateMetadata || {}) as UserPrivateMetadata;
    const currentUserPrivate = (userToUpdate.privateMetadata || {}) as UserPrivateMetadata;

    const nextAdminAuditLog = appendCappedLog(currentAdminPrivate.adminAuditLog, {
      action: adminActionMessage,
      targetUserId: userId,
      at: new Date().toISOString(),
    });

    const nextUserAuditLog = appendCappedLog(currentUserPrivate.auditLog, {
      action: userActionMessage,
      at: new Date().toISOString(),
      by: adminFullName,
    });

    // grava logs com fallback anti-422
    try {
      await Promise.all([
        client.users.updateUser(adminId, {
          privateMetadata: {
            ...(currentAdminPrivate ?? {}),
            adminAuditLog: nextAdminAuditLog,
          },
        }),
        client.users.updateUser(userId, {
          privateMetadata: {
            ...(currentUserPrivate ?? {}),
            auditLog: nextUserAuditLog, // log curto do usuário-alvo
          },
        }),
      ]);
    } catch (e: any) {
      if (e?.clerkError && e.status === 422) {
        // Se já estourou, reduz para 5 entradas e tenta novamente (em ambos)
        await Promise.all([
          client.users.updateUser(adminId, {
            privateMetadata: {
              ...(currentAdminPrivate ?? {}),
              adminAuditLog: (nextAdminAuditLog || []).slice(-5),
            },
          }),
          client.users.updateUser(userId, {
            privateMetadata: {
              ...(currentUserPrivate ?? {}),
              auditLog: (nextUserAuditLog || []).slice(-5),
            },
          }),
        ]);
      } else {
        throw e;
      }
    }

    return NextResponse.json({ message: 'Permissões atualizadas com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('PATCH /permissions erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar permissões.' }, { status: 500 });
  }
}
