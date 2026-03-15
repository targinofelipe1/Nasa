"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  RecompensaUsuario,
  RecompensaItem,
  ResgateItem,
  ResgatarRecompensaPayload,
} from "@/types/recompensas";

import {
  fetchRecompensas,
  resgatarRecompensa as resgatarRecompensaRequest,
} from "@/services/recompensasService";

type UseRecompensasParams = {
  userId?: string;
};

const niveis = [
  { nome: "Iniciante Verde", minPontos: 0, maxPontos: 100 },
  { nome: "Verde Expert", minPontos: 100, maxPontos: 500 },
  { nome: "Eco Warrior", minPontos: 500, maxPontos: 1500 },
  { nome: "Verde Master", minPontos: 1500, maxPontos: 3000 },
  { nome: "Eco Legend", minPontos: 3000, maxPontos: Infinity },
];

export function useRecompensas({ userId }: UseRecompensasParams) {
  const [usuario, setUsuario] = useState<RecompensaUsuario | null>(null);
  const [recompensas, setRecompensas] = useState<RecompensaItem[]>([]);
  const [resgates, setResgates] = useState<ResgateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resgatandoId, setResgatandoId] = useState<string | null>(null);

  const carregarRecompensas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchRecompensas(userId);

      setUsuario(data.usuario);
      setRecompensas(data.recompensas);
      setResgates(data.resgates);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar recompensas.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregarRecompensas();
  }, [carregarRecompensas]);

  const resgatar = useCallback(
    async (payload: Omit<ResgatarRecompensaPayload, "userId">) => {
      if (!userId) {
        toast.error("Usuário não identificado.");
        return false;
      }

      try {
        setResgatandoId(payload.recompensaId);

        await resgatarRecompensaRequest({
          userId,
          ...payload,
        });

        await carregarRecompensas();
        toast.success("🎉 Recompensa resgatada com sucesso!");
        return true;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Erro ao resgatar recompensa.");
        return false;
      } finally {
        setResgatandoId(null);
      }
    },
    [userId, carregarRecompensas]
  );

  const nivelInfo = useMemo(() => {
    const pontos = usuario?.pontos ?? 0;

    const nivelAtual =
      niveis.find(
        (nivel) => pontos >= nivel.minPontos && pontos < nivel.maxPontos
      ) || niveis[niveis.length - 1];

    const proximoNivel = niveis.find((nivel) => nivel.minPontos > pontos);

    const progressoNivel = proximoNivel
      ? ((pontos - nivelAtual.minPontos) /
          (proximoNivel.minPontos - nivelAtual.minPontos)) *
        100
      : 100;

    return {
      nivelAtual,
      proximoNivel,
      progressoNivel: Math.max(0, Math.min(100, progressoNivel)),
    };
  }, [usuario]);

  return {
    usuario,
    recompensas,
    resgates,
    loading,
    resgatandoId,
    nivelInfo,
    recarregar: carregarRecompensas,
    resgatarRecompensa: resgatar,
  };
}