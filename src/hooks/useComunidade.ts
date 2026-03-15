"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  ComunidadeUsuario,
  Relato,
  CriarRelatoPayload,
  ComentarRelatoPayload,
  CurtirRelatoPayload,
} from "@/types/comunidade";

import {
  fetchComunidade,
  criarRelato as criarRelatoRequest,
  comentarRelato as comentarRelatoRequest,
  curtirRelato as curtirRelatoRequest,
} from "@/services/comunidadeService";

type UseComunidadeParams = {
  userId?: string;
};

export function useComunidade({ userId }: UseComunidadeParams) {
  const [usuario, setUsuario] = useState<ComunidadeUsuario | null>(null);
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingRelato, setSubmittingRelato] = useState(false);
  const [submittingComentarioId, setSubmittingComentarioId] = useState<string | null>(null);
  const [curtindoRelatoId, setCurtindoRelatoId] = useState<string | null>(null);

  const carregarComunidade = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await fetchComunidade(userId);
      setUsuario(data.usuario);
      setRelatos(data.relatos);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar os dados da comunidade.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregarComunidade();
  }, [carregarComunidade]);

  const adicionarRelato = useCallback(
    async (payload: Omit<CriarRelatoPayload, "userId">) => {
      if (!userId) {
        toast.error("Usuário não identificado.");
        return false;
      }

      try {
        setSubmittingRelato(true);

        await criarRelatoRequest({
          userId,
          ...payload,
        });

        await carregarComunidade();
        toast.success("🎉 Relato publicado com sucesso! +5 coins adicionados.");
        return true;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Erro ao publicar relato.");
        return false;
      } finally {
        setSubmittingRelato(false);
      }
    },
    [userId, carregarComunidade]
  );

  const adicionarComentario = useCallback(
    async (payload: Omit<ComentarRelatoPayload, "userId">) => {
      if (!userId) {
        toast.error("Usuário não identificado.");
        return false;
      }

      try {
        setSubmittingComentarioId(payload.relatoId);

        await comentarRelatoRequest({
          userId,
          ...payload,
        });

        await carregarComunidade();
        toast.success("+2 coins adicionados por comentar!");
        return true;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Erro ao adicionar comentário.");
        return false;
      } finally {
        setSubmittingComentarioId(null);
      }
    },
    [userId, carregarComunidade]
  );

  const curtirRelato = useCallback(
    async (payload: Omit<CurtirRelatoPayload, "userId">) => {
      if (!userId) {
        toast.error("Usuário não identificado.");
        return false;
      }

      try {
        setCurtindoRelatoId(payload.relatoId);

        await curtirRelatoRequest({
          userId,
          ...payload,
        });

        await carregarComunidade();
        toast.success("+1 coin adicionado por curtir!");
        return true;
      } catch (error: any) {
        console.error(error);

        if (error?.message?.toLowerCase().includes("já curtiu")) {
          toast.error("Você já curtiu este relato.");
        } else {
          toast.error(error?.message || "Erro ao curtir relato.");
        }

        return false;
      } finally {
        setCurtindoRelatoId(null);
      }
    },
    [userId, carregarComunidade]
  );

  const stats = useMemo(() => {
    return {
      totalRelatos: relatos.length,
      coins: usuario?.coins ?? 0,
      engajamento: relatos.length > 0 ? Math.min(100, 80 + relatos.length) : 0,
      alcance: relatos.length * 15,
    };
  }, [relatos, usuario]);

  return {
    usuario,
    relatos,
    loading,
    submittingRelato,
    submittingComentarioId,
    curtindoRelatoId,
    stats,
    recarregar: carregarComunidade,
    adicionarRelato,
    adicionarComentario,
    curtirRelato,
  };
}