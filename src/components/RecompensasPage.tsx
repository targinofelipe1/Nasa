"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

import { useRecompensas } from "@/hooks/useRecompensas";
import { RecompensasResumo } from "@/components/recompensas/RecompensasResumo";
import { RecompensasGrid } from "@/components/recompensas/RecompensasGrid";
import { ComoGanharCoinsCard } from "@/components/recompensas/ComoGanharCoinsCard";
import { SistemaNiveisCard } from "@/components/recompensas/SistemaNiveisCard";

export function RecompensasPage() {
  const { user, isLoaded } = useUser();

  const {
    usuario,
    recompensas,
    resgates,
    loading,
    resgatandoId,
    nivelInfo,
    resgatarRecompensa,
  } = useRecompensas({
    userId: user?.id,
  });

  const nomeUsuarioFallback = useMemo(() => {
    if (!user) return "Usuário";

    return (
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.primaryEmailAddress?.emailAddress ||
      "Usuário"
    );
  }, [user]);

  const handleResgatar = async (recompensa: {
    id: string;
    titulo: string;
    custo: number;
  }) => {
    return resgatarRecompensa({
      recompensaId: recompensa.id,
      usuarioNome: usuario?.nome || nomeUsuarioFallback,
    });
  };

  const pontosParaProximoNivel = nivelInfo.proximoNivel
    ? Math.max(0, nivelInfo.proximoNivel.minPontos - (usuario?.pontos ?? 0))
    : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen p-6"
        style={{
          background: "linear-gradient(to bottom right, #FFF8E1, #FFFDE7)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl bg-white p-6 shadow-md text-gray-600">
            Carregando usuário...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "linear-gradient(to bottom right, #FFF8E1, #FFFDE7)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <h1
              className="text-3xl lg:text-4xl font-bold mb-2"
              style={{ color: "#FFC107" }}
            >
              Centro de Recompensas
            </h1>
            <p className="text-gray-600">
              Troque seus coins por recompensas sustentáveis e exclusivas
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <RecompensasResumo
              coins={usuario?.coins ?? 0}
              pontos={usuario?.pontos ?? 0}
              nivelAtual={usuario?.nivelAtual || nivelInfo.nivelAtual.nome}
              progressoNivel={nivelInfo.progressoNivel}
              pontosParaProximoNivel={pontosParaProximoNivel}
              nivelMaximo={!nivelInfo.proximoNivel}
            />
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg mb-8">
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#2E7D32" }}
                  >
                    <Gift className="w-5 h-5" />
                    Recompensas Disponíveis
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {loading ? (
                    <div className="text-gray-600">Carregando recompensas...</div>
                  ) : (
                    <RecompensasGrid
                      recompensas={recompensas}
                      coinsUsuario={usuario?.coins ?? 0}
                      resgatandoId={resgatandoId}
                      onResgatar={handleResgatar}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle style={{ color: "#0277BD" }}>
                    Histórico de Resgates
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {resgates.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Você ainda não resgatou nenhuma recompensa.
                    </div>
                  ) : (
                    resgates.map((resgate) => (
                      <div
                        key={resgate.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-medium text-gray-900">
                              Resgate #{resgate.id.slice(-8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(new Date(resgate.createdAt))}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-amber-600">
                              {resgate.coinsGastos} coins
                            </p>
                            <p className="text-xs text-gray-500">{resgate.status}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <ComoGanharCoinsCard />
              <SistemaNiveisCard
                nivelAtual={usuario?.nivelAtual || nivelInfo.nivelAtual.nome}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}