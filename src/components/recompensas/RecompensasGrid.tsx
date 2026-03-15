"use client";

import { motion } from "framer-motion";
import { CheckCircle, Coins, Gift, Leaf, Zap, BookOpen, Recycle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ImageWithFallback";

import type { RecompensaItem } from "@/types/recompensas";

type RecompensasGridProps = {
  recompensas: RecompensaItem[];
  coinsUsuario: number;
  resgatandoId?: string | null;
  onResgatar: (recompensa: RecompensaItem) => void;
};

function getIconeCategoria(categoria: string) {
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
}

export function RecompensasGrid({
  recompensas,
  coinsUsuario,
  resgatandoId = null,
  onResgatar,
}: RecompensasGridProps) {
  if (!recompensas.length) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md text-gray-600">
        Nenhuma recompensa disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {recompensas.map((recompensa) => {
        const IconeCategoria = getIconeCategoria(recompensa.categoria);
        const podeResgatar = recompensa.podeResgatar;
        const estaResgatando = resgatandoId === recompensa.id;

        return (
          <motion.div
            key={recompensa.id}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
              podeResgatar ? "shadow-lg border-green-400" : "border-gray-200"
            } ${!recompensa.disponivel ? "opacity-60" : ""}`}
          >
            <ImageWithFallback
              src={recompensa.imagem}
              alt={recompensa.titulo}
              className="w-full h-48 object-cover"
            />

            {!recompensa.disponivel && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <IconeCategoria className="w-5 h-5" style={{ color: "#2E7D32" }} />
                  <Badge variant="secondary">{recompensa.categoria}</Badge>
                </div>

                <Badge variant="outline">
                  Estoque: {recompensa.estoque}
                </Badge>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{recompensa.titulo}</h3>
              <p className="text-sm text-gray-600 mb-4">{recompensa.descricao}</p>

              <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                <span>Nível mínimo: {recompensa.nivelMinimo}</span>
                <span>{coinsUsuario} coins</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5" style={{ color: "#FFC107" }} />
                  <span className="font-bold" style={{ color: "#FFC107" }}>
                    {recompensa.custo} coins
                  </span>
                </div>

                <Button
                  onClick={() => onResgatar(recompensa)}
                  disabled={!podeResgatar || estaResgatando}
                  style={{
                    backgroundColor: podeResgatar ? "#2E7D32" : "#E0E0E0",
                    color: podeResgatar ? "white" : "#666",
                  }}
                >
                  {estaResgatando
                    ? "Resgatando..."
                    : !recompensa.disponivel
                    ? "Indisponível"
                    : coinsUsuario < recompensa.custo
                    ? "Coins insuficientes"
                    : "Resgatar"}
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}