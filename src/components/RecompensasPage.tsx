"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Coins,
  Gift,
  Star,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  Leaf,
  Zap,
  BookOpen,
  Recycle,
} from "lucide-react";

import { ImageWithFallback } from "./ImageWithFallback";
import { toast } from "sonner";
import { useApp } from "@/app/dash/AppContext";

const niveis = [
  { nome: "Iniciante Verde", minPontos: 0, maxPontos: 100 },
  { nome: "Verde Expert", minPontos: 100, maxPontos: 500 },
  { nome: "Eco Warrior", minPontos: 500, maxPontos: 1500 },
  { nome: "Verde Master", minPontos: 1500, maxPontos: 3000 },
  { nome: "Eco Legend", minPontos: 3000, maxPontos: Infinity },
];

const formasGanharCoins = [
  { acao: "Adicionar contribuição", coins: 5, icone: Leaf, cor: "#2E7D32" },
  { acao: "Compartilhar relato", coins: 5, icone: Gift, cor: "#0277BD" },
  { acao: "Comentar em relato", coins: 2, icone: BookOpen, cor: "#9C27B0" },
  { acao: "Curtir relato", coins: 1, icone: Star, cor: "#FFC107" },
];

export function RecompensasPage() {
  const { usuario, recompensas, resgatarRecompensa } = useApp();
  const [resgateId, setResgateId] = useState<string | null>(null);

  const nivelAtual =
    niveis.find(
      (nivel) => usuario.pontos >= nivel.minPontos && usuario.pontos < nivel.maxPontos
    ) || niveis[niveis.length - 1];

  const proximoNivel = niveis.find((nivel) => nivel.minPontos > usuario.pontos);
  const progressoNivel = proximoNivel
    ? ((usuario.pontos - nivelAtual.minPontos) /
        (proximoNivel.minPontos - nivelAtual.minPontos)) *
      100
    : 100;

  const handleResgatarRecompensa = async (
    recompensaId: string,
    titulo: string,
    custo: number
  ) => {
    if (usuario.coins < custo) {
      toast.error("Coins insuficientes para resgatar esta recompensa!");
      return;
    }

    setResgateId(recompensaId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sucesso = resgatarRecompensa(recompensaId);

    if (sucesso) {
      toast.success(`🎉 Parabéns! Você resgatou: ${titulo}`);
    } else {
      toast.error("Erro ao resgatar recompensa. Tente novamente.");
    }

    setResgateId(null);
  };

  const getIconeCategoria = (categoria: string) => {
    switch (categoria) {
      case "Verde":
        return Leaf;
      case "Energia":
        return Zap;
      case "Educação":
        return BookOpen;
      case "Sustentabilidade":
        return Recycle;
      default:
        return Gift;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "linear-gradient(to bottom right, #FFF8E1, #FFFDE7)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          {/* Header */}
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

          {/* Status do Usuário */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card
              className="border-0 shadow-xl"
              style={{
                background: "linear-gradient(to right, #FFF8E1, #A5D6A7)",
              }}
            >
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  {/* Coins */}
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "#FFC107" }}
                    >
                      <Coins className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: "#FFC107" }}>
                      {usuario.coins}
                    </h3>
                    <p className="text-gray-600">Coins Disponíveis</p>
                  </div>

                  {/* Nível */}
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "#2E7D32" }}
                    >
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: "#2E7D32" }}>
                      {nivelAtual.nome}
                    </h3>
                    <div className="w-full max-w-xs mx-auto">
                      <Progress value={progressoNivel} className="h-2 mb-2" />
                      <p className="text-sm text-gray-600">
                        {proximoNivel
                          ? `${proximoNivel.minPontos - usuario.pontos} pontos para o próximo nível`
                          : "Nível máximo!"}
                      </p>
                    </div>
                  </div>

                  {/* Pontos Totais */}
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "#0277BD" }}
                    >
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: "#0277BD" }}>
                      {usuario.pontos}
                    </h3>
                    <p className="text-gray-600">Pontos Totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Recompensas */}
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
                  <div className="grid md:grid-cols-2 gap-6">
                    {recompensas.map((recompensa) => {
                      const IconeCategoria = getIconeCategoria(recompensa.categoria);
                      const podeResgatar =
                        usuario.coins >= recompensa.custo && recompensa.disponivel;
                      const estaResgatando = resgateId === recompensa.id;

                      return (
                        <motion.div
                          key={recompensa.id}
                          whileHover={{ scale: 1.02 }}
                          className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                            podeResgatar
                              ? "shadow-lg border-green-400"
                              : "border-gray-200"
                          } ${!recompensa.disponivel ? "opacity-60" : ""}`}
                        >
                          <ImageWithFallback
                            src={recompensa.imagem}
                            alt={recompensa.titulo}
                            className="w-full h-48 object-cover"
                          />
                          {!recompensa.disponivel && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <IconeCategoria
                                  className="w-5 h-5"
                                  style={{ color: "#2E7D32" }}
                                />
                                <Badge variant="secondary">
                                  {recompensa.categoria}
                                </Badge>
                              </div>
                            </div>

                            <h3 className="font-bold text-gray-900 mb-2">
                              {recompensa.titulo}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {recompensa.descricao}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Coins className="w-5 h-5" style={{ color: "#FFC107" }} />
                                <span
                                  className="font-bold"
                                  style={{ color: "#FFC107" }}
                                >
                                  {recompensa.custo} coins
                                </span>
                              </div>

                              <Button
                                onClick={() =>
                                  handleResgatarRecompensa(
                                    recompensa.id,
                                    recompensa.titulo,
                                    recompensa.custo
                                  )
                                }
                                disabled={!podeResgatar || estaResgatando}
                                style={{
                                  backgroundColor: podeResgatar ? "#2E7D32" : "#E0E0E0",
                                  color: podeResgatar ? "white" : "#666",
                                }}
                                onMouseEnter={(e) => {
                                  if (podeResgatar)
                                    e.currentTarget.style.backgroundColor = "#1B5E20";
                                }}
                                onMouseLeave={(e) => {
                                  if (podeResgatar)
                                    e.currentTarget.style.backgroundColor = "#2E7D32";
                                }}
                              >
                                {estaResgatando
                                  ? "Resgatando..."
                                  : !recompensa.disponivel
                                  ? "Resgatado"
                                  : usuario.coins < recompensa.custo
                                  ? "Coins insuficientes"
                                  : "Resgatar"}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Como Ganhar Coins */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#FFC107" }}
                  >
                    <Coins className="w-5 h-5" />
                    Como Ganhar Coins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formasGanharCoins.map((forma, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <forma.icone
                          className="w-5 h-5"
                          style={{ color: forma.cor }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{forma.acao}</p>
                        <div className="flex items-center gap-1">
                          <Coins className="w-3 h-3" style={{ color: "#FFC107" }} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#FFC107" }}
                          >
                            +{forma.coins} coins
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Sistema de Níveis */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#2E7D32" }}
                  >
                    <Trophy className="w-5 h-5" />
                    Sistema de Níveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {niveis.map((nivel, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        nivel === nivelAtual ? "border-2" : "border border-gray-100"
                      }`}
                      style={{
                        backgroundColor: nivel === nivelAtual ? "#E8F5E9" : "#FAFAFA",
                        borderColor:
                          nivel === nivelAtual ? "#2E7D32" : "#E0E0E0",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{
                            color: nivel === nivelAtual ? "#2E7D32" : "#555",
                          }}
                        >
                          {nivel.nome}
                        </span>
                        {nivel === nivelAtual && (
                          <Badge style={{ backgroundColor: "#2E7D32", color: "#fff" }}>
                            Atual
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {nivel.maxPontos === Infinity
                          ? `${nivel.minPontos}+ pontos`
                          : `${nivel.minPontos} - ${nivel.maxPontos} pontos`}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
