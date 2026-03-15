"use client";

import { motion } from "framer-motion";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/ImageWithFallback";

import { useContribuicoes } from "@/hooks/useContribuicoes";
import { NovaContribuicaoForm } from "@/components/contribuicoes/NovaContribuicaoForm";
import { ContribuicoesStats } from "@/components/contribuicoes/ContribuicoesStats";
import { RankingContribuicoesCard } from "@/components/contribuicoes/RankingContribuicoesCard";
import { MapaContribuicoesBrasil } from "@/components/contribuicoes/MapaContribuicoesBrasil";

export function ContribuicoesPage() {
  const { user, isLoaded } = useUser();
  const [showForm, setShowForm] = useState(false);

  const {
    usuario,
    contribuicoes,
    ranking,
    loading,
    submittingContribuicao,
    stats,
    adicionarContribuicao,
  } = useContribuicoes({
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

  const cidadeUsuarioFallback = useMemo(() => {
    return usuario?.cidade || "Não informada";
  }, [usuario]);

  const handleSubmitContribuicao = async (payload: {
    cidade: string;
    tipo: string;
    localizacao?: string;
    descricao: string;
    quantidade: string;
    imagemUrl?: string;
  }) => {
    const ok = await adicionarContribuicao({
      usuarioNome: usuario?.nome || nomeUsuarioFallback,
      cidade: payload.cidade || cidadeUsuarioFallback,
      tipo: payload.tipo,
      localizacao: payload.localizacao,
      descricao: payload.descricao,
      quantidade: payload.quantidade,
      imagemUrl: payload.imagemUrl,
    });

    if (ok) {
      setShowForm(false);
    }

    return ok;
  };

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
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-white p-6 text-gray-600 shadow-md">
            Carregando usuário...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1
                  className="mb-2 text-3xl font-bold lg:text-4xl"
                  style={{ color: "#2E7D32" }}
                >
                  Painel de Contribuições
                </h1>
                <p className="text-gray-600">
                  Contribua com dados ambientais e ajude a tornar sua cidade mais
                  sustentável
                </p>
              </div>

              <Button
                onClick={() => setShowForm((prev) => !prev)}
                className="flex items-center gap-2 text-white"
                size="lg"
                style={{ backgroundColor: "#2E7D32" }}
                type="button"
              >
                <Plus className="h-5 w-5" />
                Nova Contribuição
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ContribuicoesStats
              totalContribuicoes={stats.totalContribuicoes}
              suasContribuicoes={stats.suasContribuicoes}
              coins={stats.coins}
              pontos={stats.pontos}
            />
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              {showForm ? (
                <NovaContribuicaoForm
                  onSubmit={handleSubmitContribuicao}
                  onCancel={() => setShowForm(false)}
                  loading={submittingContribuicao}
                />
              ) : null}

              <Card
                className="mb-8 border-0 shadow-lg"
                style={{ backgroundColor: "#FFFFFFE6" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#2E7D32" }}
                  >
                    <MapPin className="h-5 w-5" />
                    Mapa de Contribuições no Brasil
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <MapaContribuicoesBrasil contribuicoes={contribuicoes} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg" style={{ backgroundColor: "#FFFFFFE6" }}>
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#2E7D32" }}
                  >
                    Últimas contribuições
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando contribuições...
                    </div>
                  ) : contribuicoes.length === 0 ? (
                    <div className="text-gray-500">
                      Nenhuma contribuição cadastrada ainda.
                    </div>
                  ) : (
                    contribuicoes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.tipo}</h3>
                            <p className="text-sm text-gray-600">
                              {item.usuario} • {item.cidade}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(new Date(item.createdAt))}
                            </p>
                          </div>

                          <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            {item.quantidade}
                          </span>
                        </div>

                        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                          {item.descricao}
                        </p>

                        {item.localizacao ? (
                          <p className="mt-2 text-xs text-gray-500">
                            Localização: {item.localizacao}
                          </p>
                        ) : null}

                        {item.imagemUrl ? (
                          <div className="mt-4 overflow-hidden rounded-lg">
                            <ImageWithFallback
                              src={item.imagemUrl}
                              alt={item.tipo}
                              className="h-56 w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <RankingContribuicoesCard ranking={ranking} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}