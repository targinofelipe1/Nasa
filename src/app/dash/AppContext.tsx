"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Contribuicao {
  id: string;
  usuario: string;
  cidade: string;
  tipo: string;
  localizacao: string;
  descricao: string;
  quantidade: string;
  foto?: string;
  data: Date;
  pontos: number;
}

export interface Relato {
  id: string;
  usuario: string;
  avatar: string;
  cidade: string;
  tempo: string;
  conteudo: string;
  imagem?: string;
  localizacao?: string;
  likes: number;
  comentarios: Comentario[];
  categoria: string;
  liked?: boolean;
}

export interface Comentario {
  id: string;
  usuario: string;
  avatar: string;
  conteudo: string;
  tempo: string;
}

export interface Usuario {
  nome: string;
  avatar: string;
  cidade: string;
  coins: number;
  nivel: string;
  contribuicoes: number;
  pontos: number;
}

export interface Recompensa {
  id: string;
  titulo: string;
  descricao: string;
  custo: number;
  categoria: string;
  disponivel: boolean;
  imagem: string;
}

interface AppContextType {
  usuario: Usuario;
  contribuicoes: Contribuicao[];
  relatos: Relato[];
  recompensas: Recompensa[];
  adicionarContribuicao: (contribuicao: Omit<Contribuicao, 'id' | 'data' | 'pontos'>) => void;
  adicionarRelato: (relato: Omit<Relato, 'id' | 'tempo' | 'likes' | 'comentarios' | 'liked'>) => void;
  adicionarComentario: (relatoId: string, comentario: Omit<Comentario, 'id' | 'tempo'>) => void;
  curtirRelato: (relatoId: string) => void;
  resgatarRecompensa: (recompensaId: string) => boolean;
  atualizarCoins: (quantidade: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const recompensasIniciais: Recompensa[] = [
  {
    id: '1',
    titulo: 'Muda de Árvore Nativa',
    descricao: 'Receba uma muda para plantar em sua casa',
    custo: 100,
    categoria: 'Verde',
    disponivel: true,
    imagem: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200'
  },
  {
    id: '2',
    titulo: 'Kit de Compostagem',
    descricao: 'Kit completo para fazer compostagem doméstica',
    custo: 250,
    categoria: 'Sustentabilidade',
    disponivel: true,
    imagem: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200'
  },
  {
    id: '3',
    titulo: 'Painel Solar Portátil',
    descricao: 'Carregador solar para dispositivos móveis',
    custo: 500,
    categoria: 'Energia',
    disponivel: true,
    imagem: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200'
  },
  {
    id: '4',
    titulo: 'Curso de Permacultura',
    descricao: 'Acesso ao curso online de permacultura urbana',
    custo: 300,
    categoria: 'Educação',
    disponivel: true,
    imagem: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200'
  }
];

const relatosIniciais: Relato[] = [
  {
    id: '1',
    usuario: 'Maria Silva',
    avatar: 'MS',
    cidade: 'João Pessoa',
    tempo: '2 horas atrás',
    conteudo: 'Incrível ver como o projeto de arborização do Parque Solon de Lucena está transformando a área! As novas árvores já estão criando sombra e atraindo mais pássaros. 🌳🐦',
    imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    localizacao: 'Parque Solon de Lucena',
    likes: 24,
    comentarios: [
      {
        id: 'c1',
        usuario: 'João Santos',
        avatar: 'JS',
        conteudo: 'Que projeto incrível! Parabéns pela iniciativa.',
        tempo: '1 hora atrás'
      }
    ],
    categoria: 'Vegetação',
    liked: false
  },
  {
    id: '2',
    usuario: 'João Santos',
    avatar: 'JS',
    cidade: 'Recife',
    tempo: '5 horas atrás',
    conteudo: 'O sistema de coleta seletiva no bairro está funcionando muito bem! Conseguimos reduzir significativamente o lixo nas ruas. A comunidade está engajada e os resultados são visíveis.',
    imagem: 'https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    localizacao: 'Boa Viagem',
    likes: 18,
    comentarios: [],
    categoria: 'Reciclagem',
    liked: false
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario>({
    nome: 'Usuário Atual',
    avatar: 'UC',
    cidade: 'João Pessoa',
    coins: 150,
    nivel: 'Verde Expert',
    contribuicoes: 12,
    pontos: 1250
  });

  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [relatos, setRelatos] = useState<Relato[]>(relatosIniciais);
  const [recompensas, setRecompensas] = useState<Recompensa[]>(recompensasIniciais);

  const calcularPontos = (tipo: string): number => {
    const pontosPorTipo: { [key: string]: number } = {
      'plantio': 50,
      'coleta': 30,
      'energia': 40,
      'agua': 35,
      'transporte': 25,
      'educacao': 20
    };
    return pontosPorTipo[tipo] || 20;
  };

  const calcularCoins = (pontos: number): number => {
    return Math.floor(pontos / 10); // 10 pontos = 1 coin
  };

  const adicionarContribuicao = (novaContribuicao: Omit<Contribuicao, 'id' | 'data' | 'pontos'>) => {
    const pontos = calcularPontos(novaContribuicao.tipo.split(' ')[0].toLowerCase());
    const coins = calcularCoins(pontos);
    
    const contribuicao: Contribuicao = {
      ...novaContribuicao,
      id: Date.now().toString(),
      data: new Date(),
      pontos
    };

    setContribuicoes(prev => [contribuicao, ...prev]);
    
    // Atualizar dados do usuário
    setUsuario(prev => ({
      ...prev,
      coins: prev.coins + coins,
      contribuicoes: prev.contribuicoes + 1,
      pontos: prev.pontos + pontos
    }));
  };

  const adicionarRelato = (novoRelato: Omit<Relato, 'id' | 'tempo' | 'likes' | 'comentarios' | 'liked'>) => {
    const relato: Relato = {
      ...novoRelato,
      id: Date.now().toString(),
      tempo: 'Agora',
      likes: 0,
      comentarios: [],
      liked: false
    };

    setRelatos(prev => [relato, ...prev]);
    
    // Dar coins por compartilhar relato
    atualizarCoins(5);
  };

  const adicionarComentario = (relatoId: string, novoComentario: Omit<Comentario, 'id' | 'tempo'>) => {
    const comentario: Comentario = {
      ...novoComentario,
      id: Date.now().toString(),
      tempo: 'Agora'
    };

    setRelatos(prev => prev.map(relato => 
      relato.id === relatoId 
        ? { ...relato, comentarios: [...relato.comentarios, comentario] }
        : relato
    ));

    // Dar coins por comentar
    atualizarCoins(2);
  };

  const curtirRelato = (relatoId: string) => {
    setRelatos(prev => prev.map(relato => 
      relato.id === relatoId 
        ? { 
            ...relato, 
            liked: !relato.liked,
            likes: relato.liked ? relato.likes - 1 : relato.likes + 1
          }
        : relato
    ));

    // Dar coins por curtir (apenas uma vez por post)
    const relato = relatos.find(r => r.id === relatoId);
    if (relato && !relato.liked) {
      atualizarCoins(1);
    }
  };

  const resgatarRecompensa = (recompensaId: string): boolean => {
    const recompensa = recompensas.find(r => r.id === recompensaId);
    
    if (!recompensa || !recompensa.disponivel || usuario.coins < recompensa.custo) {
      return false;
    }

    setUsuario(prev => ({
      ...prev,
      coins: prev.coins - recompensa.custo
    }));

    setRecompensas(prev => prev.map(r => 
      r.id === recompensaId ? { ...r, disponivel: false } : r
    ));

    return true;
  };

  const atualizarCoins = (quantidade: number) => {
    setUsuario(prev => ({
      ...prev,
      coins: prev.coins + quantidade
    }));
  };

  return (
    <AppContext.Provider value={{
      usuario,
      contribuicoes,
      relatos,
      recompensas,
      adicionarContribuicao,
      adicionarRelato,
      adicionarComentario,
      curtirRelato,
      resgatarRecompensa,
      atualizarCoins
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}