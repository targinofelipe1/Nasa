// src/app/api/users/[userId]/permissions/route.ts
import { NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";

type UserPrivateMetadata = {
  allowedTabs?: string[];
  adminAuditLog?: Array<{
    action: string;
    targetUserId?: string;
    at: string;
    by?: string;
  }>;
};

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido." }, { status: 400 });
    }

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const allowedFromUnsafe =
      ((user.unsafeMetadata || {}) as { allowedTabs?: string[] }).allowedTabs;
    const allowedFromPrivate =
      ((user.privateMetadata || {}) as UserPrivateMetadata).allowedTabs;

    const allowedTabs = allowedFromUnsafe ?? allowedFromPrivate ?? [];
    return NextResponse.json({ allowedTabs }, { status: 200 });
  } catch (error) {
    console.error("GET /permissions erro:", error);
    return NextResponse.json({ error: "Erro ao buscar permissões." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;
    const body = await request.json();

    // 🔑 garante sempre array válido de string
    const allowedTabs: string[] = Array.isArray(body?.allowedTabs)
      ? body.allowedTabs.filter((t: unknown) => typeof t === "string")
      : [];

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido." }, { status: 400 });
    }

    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const client = await clerkClient();
    const [userToUpdate, adminUser] = await Promise.all([
      client.users.getUser(userId),
      client.users.getUser(adminId),
    ]);
    if (!userToUpdate || !adminUser) {
      return NextResponse.json({ error: "Usuário ou Admin não encontrado." }, { status: 404 });
    }

    const existingPrivate = (userToUpdate.privateMetadata || {}) as UserPrivateMetadata;
    const existingUnsafe = (userToUpdate.unsafeMetadata || {}) as Record<string, unknown>;

    const oldAllowedTabs = existingPrivate.allowedTabs || [];

    const addedTabs = allowedTabs.filter((tab) => !oldAllowedTabs.includes(tab));
    const removedTabs = oldAllowedTabs.filter((tab) => !allowedTabs.includes(tab));

    const newPrivateMetadata: UserPrivateMetadata = {
      ...existingPrivate,
      allowedTabs,
    };
    const newUnsafeMetadata = {
      ...existingUnsafe,
      allowedTabs,
    };

    await client.users.updateUser(userId, {
      privateMetadata: newPrivateMetadata,
      unsafeMetadata: newUnsafeMetadata,
    });

    const userFullName = `${userToUpdate.firstName || ""} ${userToUpdate.lastName || ""}`.trim();
    const adminFullName = `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim();

    // log para admin
    let adminActionMessage = `Alterou as permissões do usuário ${userFullName}.`;
    if (addedTabs.length > 0) adminActionMessage += ` Adicionou: ${addedTabs.join(", ")}.`;
    if (removedTabs.length > 0) adminActionMessage += ` Removeu: ${removedTabs.join(", ")}.`;

    const adminLogEntry = {
      action: adminActionMessage,
      targetUserId: userId,
      at: new Date().toISOString(),
    };

    // log para usuário
    let userActionMessage = `Suas permissões foram alteradas por ${adminFullName}.`;
    if (addedTabs.length > 0) userActionMessage += ` Adicionadas: ${addedTabs.join(", ")}.`;
    if (removedTabs.length > 0) userActionMessage += ` Removidas: ${removedTabs.join(", ")}.`;

    const userLogEntry = {
      action: userActionMessage,
      at: new Date().toISOString(),
      by: adminFullName,
    };

    const currentAdminPrivate = (adminUser.privateMetadata || {}) as UserPrivateMetadata;
    const currentAdminAuditLog = currentAdminPrivate.adminAuditLog || [];

    const currentUserPrivate = (userToUpdate.privateMetadata || {}) as UserPrivateMetadata;
    const currentUserAuditLog = currentUserPrivate.adminAuditLog || [];

    await Promise.all([
      client.users.updateUser(adminId, {
        privateMetadata: {
          ...currentAdminPrivate,
          adminAuditLog: [...currentAdminAuditLog, adminLogEntry],
        },
      }),
      client.users.updateUser(userId, {
        privateMetadata: {
          ...currentUserPrivate,
          adminAuditLog: [...currentUserAuditLog, userLogEntry],
        },
      }),
    ]);

    return NextResponse.json({ message: "Permissões atualizadas com sucesso!" }, { status: 200 });
  } catch (error) {
    console.error("PATCH /permissions erro:", error);
    return NextResponse.json({ error: "Erro ao atualizar permissões." }, { status: 500 });
  }
}
