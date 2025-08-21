// src/app/api/users/route.ts

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- Links da sua aplicação ---
const LOGO_URL = 'https://gevs.vercel.app/img/provisorio.png'; // Link do seu logo
const APP_URL = 'https://gevs.vercel.app/'; // URL da sua aplicação

// Função para enviar o e-mail de notificação com logo e link
async function sendWelcomeEmailWithLink(email: string, fullName: string, signInLink: string) {
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
            <a href="https://gevs.vercel.app/auth/sign-in" style="word-break: break-all; font-weight: bold; color: #007bff; text-decoration: none;">
              https://gevs.vercel.app/auth/sign-in
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

// Lida com a busca de usuários (método GET)
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

// Lida com a criação de usuários (método POST)
export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!firstName || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    const provisionalPassword = crypto.randomBytes(16).toString('hex');
    
    const client = await clerkClient();
    const newUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password: provisionalPassword,
    });

    console.log('Novo usuário criado:', newUser.id);
    
    // --- GERA O TOKEN E O LINK DE ACESSO COM expiresINseconds ---
    const signInToken = await client.signInTokens.createSignInToken({
      userId: newUser.id,
      expiresInSeconds: 3600 // Define o token como válido por 1 hora (3600 segundos)
    });
    const signInLink = signInToken.url;

    // --- CHAMA A FUNÇÃO DE ENVIO COM O NOVO LINK ---
    await sendWelcomeEmailWithLink(email, `${firstName} ${lastName}`.trim(), signInLink);
        
    return NextResponse.json({
      message: 'Usuário cadastrado com sucesso!',
      userId: newUser.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar o usuário.' }, { status: 500 });
  }
}