"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  ContribuicaoUsuario,
  ContribuicaoItem,
  RankingContribuicaoItem,
  CriarContribuicaoPayload,
} from "@/types/contribuicoes";

import {
  fetchContribuicoes,
  criarContribuicao as criarContribuicaoRequest,
} from "@/services/contribuicoesService";

type UseContribuicoesParams = {
  userId?: string;
};

export function useContribuicoes({ userId }: UseContribuicoesParams) {
  const [usuario, setUsuario] = useState<ContribuicaoUsuario | null>(null);
  const [contribuicoes, setContribuicoes] = useState<ContribuicaoItem[]>([]);
  const [ranking, setRanking] = useState<RankingContribuicaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingContribuicao, setSubmittingContribuicao] = useState(false);

  const carregarContribuicoes = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchContribuicoes(userId);

      setUsuario(data.usuario);
      setContribuicoes(data.contribuicoes);
      setRanking(data.ranking);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar contribuições.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregarContribuicoes();
  }, [carregarContribuicoes]);

  const adicionarContribuicao = useCallback(
    async (payload: Omit<CriarContribuicaoPayload, "userId">) => {
      if (!userId) {
        toast.error("Usuário não identificado.");
        return false;
      }

      try {
        setSubmittingContribuicao(true);

        await criarContribuicaoRequest({
          userId,
          ...payload,
        });

        await carregarContribuicoes();
        toast.success("🎉 Contribuição adicionada com sucesso! Coins adicionados à sua conta.");
        return true;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Erro ao adicionar contribuição.");
        return false;
      } finally {
        setSubmittingContribuicao(false);
      }
    },
    [userId, carregarContribuicoes]
  );

  const stats = useMemo(() => {
    const suasContribuicoes = userId
      ? contribuicoes.filter((item) => item.userId === userId).length
      : 0;

    return {
      totalContribuicoes: contribuicoes.length,
      suasContribuicoes,
      coins: usuario?.coins ?? 0,
      pontos: usuario?.pontos ?? 0,
    };
  }, [contribuicoes, usuario, userId]);

  return {
    usuario,
    contribuicoes,
    ranking,
    loading,
    submittingContribuicao,
    stats,
    recarregar: carregarContribuicoes,
    adicionarContribuicao,
  };
}