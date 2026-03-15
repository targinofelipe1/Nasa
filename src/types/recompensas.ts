export type RecompensaUsuario = {
  userId: string;
  nome: string;
  email?: string;
  cidade: string;
  avatar: string;
  coins: number;
  pontos: number;
  nivelAtual: string;
};

export type RecompensaItem = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  custo: number;
  imagem: string;
  disponivel: boolean;
  estoque: number;
  nivelMinimo: string;
  podeResgatar: boolean;
  createdAt: string;
  updatedAt: string;
  status: string;
};

export type ResgateItem = {
  id: string;
  recompensaId: string;
  coinsGastos: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RecompensasResponse = {
  usuario: RecompensaUsuario | null;
  recompensas: RecompensaItem[];
  resgates: ResgateItem[];
};

export type ResgatarRecompensaPayload = {
  userId: string;
  usuarioNome: string;
  recompensaId: string;
};