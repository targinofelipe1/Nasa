// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/* ===================== Helper de Log (cap por itens e bytes) ===================== */
const MAX_LOG_ITEMS = 20;       // mantém até 20 entradas
const MAX_LOG_BYTES = 12_000;   // ~12 KB de JSON (conservador)

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
    log = log.slice(1); // remove o mais antigo até caber
    json = JSON.stringify(log);
  }
  return log;
}
/* ================================================================================ */

const LOGO_URL = 'https://gevs.vercel.app/img/provisorio.png';
const APP_URL = 'https://gevs.vercel.app/';

async function sendWelcomeEmailWithLink(email: string, fullName: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Bem-vindo(a) à Plataforma GEVS!',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="text-align: center; padding: 20px 0; background-color: #f4f4f4;">
          <img src="${LOGO_URL}" alt="Logo da Plataforma GEVS" style="max-width: 150px; height: auto;">
        </div>
        <div style="padding: 20px;">
          <h2>Olá, ${fullName}!</h2>
          <p style="margin-top: 20px;">Seja bem-vindo(a)!</p>
          <p>Seu cadastro na plataforma Paraíba Social foi realizado com sucesso.</p>
          <p>Este e-mail foi enviado automaticamente. Por favor, não responda.</p>
          <p>Para acessar sua conta, copie e cole o link abaixo no seu navegador:</p>
          <div style="margin: 20px 0; background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center;">
            <a href="${APP_URL}auth/sign-in" style="word-break: break-all; font-weight: bold; color: #007bff; text-decoration: none;">
              ${APP_URL}auth/sign-in
            </a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail de boas-vindas enviado para:', email);
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
  }
}

// ===================================================================
// GET /api/users - Listar usuários (traz tudo, pagina no servidor)
// ===================================================================
export async function GET() {
  try {
    const client = await clerkClient();
    const limit = 100;
    let offset = 0;
    let all: any[] = [];
    let totalCount = 0;

    while (true) {
      const res = await client.users.getUserList({ limit, offset });
      all = all.concat(res.data);
      totalCount = res.totalCount ?? all.length;
      if (res.data.length < limit || all.length >= totalCount) break;
      offset += res.data.length;
    }

    const usersData = all.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      imageUrl: user.imageUrl ?? null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      isBlocked: !!user.banned,
    }));

    return NextResponse.json({ data: usersData, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

// ===================================================================
// POST /api/users - Criar usuário (com logs capados + fallback 422)
// ===================================================================
export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'Nome e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    // senha provisória (32 hex chars)
    const provisionalPassword = crypto.randomBytes(16).toString('hex');
    const client = await clerkClient();

    // 1) Cria o usuário no Clerk (sem {} extra!)
    const newUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password: provisionalPassword,
    });

    // 2) Logs (admin/adminAuditLog e usuário/auditLog) com cap + fallback
    const { userId: adminId } = await auth();
    if (adminId) {
      const adminUser = await client.users.getUser(adminId);
      const adminFullName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim();

      // log do usuário novo
      const newUserAuditEntry: LogEntry = {
        action: 'Criação',
        by: adminFullName,
        byUserId: adminId,
        at: new Date().toISOString(),
      };
      const currentTargetPrivate = (newUser.privateMetadata || {}) as { auditLog?: LogEntry[] };
      const nextTargetAuditLog = appendCappedLog(currentTargetPrivate.auditLog, newUserAuditEntry);

      // log do admin
      const currentAdminAuditLog = (adminUser.privateMetadata?.adminAuditLog || []) as LogEntry[];
      const newAdminLogEntry: LogEntry = {
        action: `Criou o usuário ${newUser.fullName} (${newUser.emailAddresses[0].emailAddress})`,
        targetUserId: newUser.id,
        at: new Date().toISOString(),
      };
      const nextAdminAuditLog = appendCappedLog(currentAdminAuditLog, newAdminLogEntry);

      try {
        await Promise.all([
          client.users.updateUser(newUser.id, {
            privateMetadata: {
              ...currentTargetPrivate,
              auditLog: nextTargetAuditLog,
            },
          }),
          client.users.updateUser(adminId, {
            privateMetadata: {
              ...adminUser.privateMetadata,
              adminAuditLog: nextAdminAuditLog,
            },
          }),
        ]);
      } catch (e: any) {
        if (e?.clerkError && e.status === 422) {
          // fallback: reduz para 5 últimas e tenta 1x de novo
          await Promise.all([
            client.users.updateUser(newUser.id, {
              privateMetadata: {
                ...currentTargetPrivate,
                auditLog: (nextTargetAuditLog || []).slice(-5),
              },
            }),
            client.users.updateUser(adminId, {
              privateMetadata: {
                ...adminUser.privateMetadata,
                adminAuditLog: (nextAdminAuditLog || []).slice(-5),
              },
            }),
          ]);
        } else {
          throw e;
        }
      }
    }

    // 3) E-mail (não bloqueante)
    sendWelcomeEmailWithLink(email, `${firstName || ''} ${lastName || ''}`.trim()).catch(
      (e) => console.error('Falha silenciosa ao enviar e-mail de boas-vindas:', e)
    );

    return NextResponse.json(
      { message: 'Usuário cadastrado com sucesso!', userId: newUser.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);

    // Tratamento detalhado para Clerk 422
    if (error?.clerkError && error.status === 422) {
      const clerkErr = Array.isArray(error.errors) ? error.errors[0] : undefined;
      const code = clerkErr?.code;

      // Códigos comuns:
      // 'form_identifier_exists' | 'form_code_email_exists' -> e-mail já cadastrado
      // 'form_password_invalid' -> senha fora da política do Clerk
      // 'form_identifier_not_allowed' -> domínio/identificador bloqueado
      if (code === 'form_identifier_exists' || code === 'form_code_email_exists') {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado.' },
          { status: 422 }
        );
      }
      if (code === 'form_password_invalid') {
        return NextResponse.json(
          { error: 'Senha provisória inválida para a política do sistema.' },
          { status: 422 }
        );
      }
      if (code === 'form_identifier_not_allowed') {
        return NextResponse.json(
          { error: 'Este e-mail/identificador não é permitido.' },
          { status: 422 }
        );
      }

      // fallback genérico
      return NextResponse.json(
        { error: 'Dados inválidos para criar o usuário.' },
        { status: 422 }
      );
    }

    // Outro erro
    return NextResponse.json(
      { error: 'Erro ao cadastrar o usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}
