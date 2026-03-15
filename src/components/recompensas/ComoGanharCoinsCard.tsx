"use client";

import { Coins, Gift, Star, Leaf, BookOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formasGanharCoins = [
  { acao: "Adicionar contribuição", coins: 5, icone: Leaf, cor: "#2E7D32" },
  { acao: "Compartilhar relato", coins: 5, icone: Gift, cor: "#0277BD" },
  { acao: "Comentar em relato", coins: 2, icone: BookOpen, cor: "#9C27B0" },
  { acao: "Curtir relato", coins: 1, icone: Star, cor: "#FFC107" },
];

export function ComoGanharCoinsCard() {
  return (
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
  );
}