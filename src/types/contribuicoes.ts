export type ContribuicaoUsuario = {
  userId: string;
  nome: string;
  email?: string;
  cidade: string;
  avatar: string;
  coins: number;
  pontos: number;
};

export type ContribuicaoItem = {
  id: string;
  userId: string;
  usuario: string;
  cidade: string;
  tipo: string;
  localizacao?: string;
  descricao: string;
  quantidade: string;
  imagemUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RankingContribuicaoItem = {
  userId: string;
  nome: string;
  cidade: string;
  contribuicoes: number;
  pontos: number;
};

export type ContribuicoesResponse = {
  usuario: ContribuicaoUsuario | null;
  contribuicoes: ContribuicaoItem[];
  ranking: RankingContribuicaoItem[];
};

export type CriarContribuicaoPayload = {
  userId: string;
  usuarioNome: string;
  cidade: string;
  tipo: string;
  localizacao?: string;
  descricao: string;
  quantidade: string;
  imagemUrl?: string;
};