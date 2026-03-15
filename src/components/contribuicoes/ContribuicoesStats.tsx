"use client";

import { Upload, TreePine, Star, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ContribuicoesStatsProps = {
  totalContribuicoes: number;
  suasContribuicoes: number;
  coins: number;
  pontos: number;
};

export function ContribuicoesStats({
  totalContribuicoes,
  suasContribuicoes,
  coins,
  pontos,
}: ContribuicoesStatsProps) {
  const stats = [
    {
      titulo: "Total de Contribuições",
      valor: totalContribuicoes.toString(),
      icone: Upload,
      cor: "#2E7D32",
      bg: "#A5D6A7",
    },
    {
      titulo: "Suas Contribuições",
      valor: suasContribuicoes.toString(),
      icone: TreePine,
      cor: "#43A047",
      bg: "#C8E6C9",
    },
    {
      titulo: "Seus Coins",
      valor: coins.toString(),
      icone: Star,
      cor: "#FFC107",
      bg: "#FFF9C4",
    },
    {
      titulo: "Pontos Totais",
      valor: pontos.toString(),
      icone: Target,
      cor: "#0277BD",
      bg: "#BBDEFB",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border-0 shadow-lg"
          style={{ backgroundColor: "#FFFFFFCC" }}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.titulo}
              </p>
              <p className="text-2xl font-bold" style={{ color: stat.cor }}>
                {stat.valor}
              </p>
            </div>

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: stat.bg }}
            >
              <stat.icone className="w-6 h-6" style={{ color: stat.cor }} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}