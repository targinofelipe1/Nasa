export type ComunidadeUsuario = {
  userId: string;
  nome: string;
  email?: string;
  cidade: string;
  avatar: string;
  coins: number;
  pontos: number;
  contribuicoes?: number;
};

export type Comentario = {
  id: string;
  usuario: string;
  avatar: string;
  conteudo: string;
  createdAt: string;
};

export type Relato = {
  id: string;
  userId: string;
  usuario: string;
  avatar: string;
  cidade: string;
  conteudo: string;
  categoria?: string;
  localizacao?: string;
  imagem?: string;
  likes: number;
  liked: boolean;
  comentarios: Comentario[];
  createdAt: string;
};

export type ComunidadeResponse = {
  usuario: ComunidadeUsuario | null;
  relatos: Relato[];
};

export type CriarRelatoPayload = {
  userId: string;
  usuarioNome: string;
  usuarioCidade?: string;
  usuarioAvatar?: string;
  conteudo: string;
  categoria?: string;
  localizacao?: string;
  imagemUrl?: string;
};

export type ComentarRelatoPayload = {
  relatoId: string;
  userId: string;
  usuarioNome: string;
  usuarioAvatar?: string;
  conteudo: string;
};

export type CurtirRelatoPayload = {
  relatoId: string;
  userId: string;
  usuarioNome: string;
};