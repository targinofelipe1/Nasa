// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer'; 


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
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #999;">
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

export async function GET() {
  try {
    const client = await clerkClient();
    const { data, totalCount } = await client.users.getUserList();

    const usersData = data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      imageUrl: user.imageUrl ?? null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      isBlocked: !!user.banned
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

    const client = await clerkClient();

    const newUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email], 
      password: provisionalPassword,
    });

    await sendWelcomeEmailWithLink(email, `${firstName || ''} ${lastName || ''}`.trim());

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