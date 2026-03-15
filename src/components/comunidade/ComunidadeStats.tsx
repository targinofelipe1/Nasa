"use client";

import { MessageSquare, Users, TrendingUp, Globe } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ComunidadeStatsProps = {
  totalRelatos: number;
  coins: number;
  engajamento: number;
  alcance: number;
};

export function ComunidadeStats({
  totalRelatos,
  coins,
  engajamento,
  alcance,
}: ComunidadeStatsProps) {
  const stats = [
    {
      titulo: "Total de Relatos",
      valor: totalRelatos.toString(),
      icone: MessageSquare,
      cor: "#0277BD",
    },
    {
      titulo: "Seus Coins",
      valor: coins.toString(),
      icone: Users,
      cor: "#FFC107",
    },
    {
      titulo: "Engajamento",
      valor: `${engajamento}%`,
      icone: TrendingUp,
      cor: "#2E7D32",
    },
    {
      titulo: "Alcance",
      valor: alcance.toString(),
      icone: Globe,
      cor: "#673AB7",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
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
                style={{ backgroundColor: `${stat.cor}33` }}
              >
                <stat.icone className="w-6 h-6" style={{ color: stat.cor }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}