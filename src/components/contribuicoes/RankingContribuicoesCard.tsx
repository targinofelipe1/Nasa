"use client";

import { Award } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { RankingContribuicaoItem } from "@/types/contribuicoes";

type RankingContribuicoesCardProps = {
  ranking: RankingContribuicaoItem[];
};

function getIniciais(nome: string) {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "US"
  );
}

export function RankingContribuicoesCard({
  ranking,
}: RankingContribuicoesCardProps) {
  const rankingOrdenado = useMemo(() => {
    return [...ranking].sort((a, b) => {
      if (b.contribuicoes !== a.contribuicoes) {
        return b.contribuicoes - a.contribuicoes;
      }

      return b.pontos - a.pontos;
    });
  }, [ranking]);

  return (
    <Card className="border-0 shadow-lg" style={{ backgroundColor: "#FFFFFFE6" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: "#2E7D32" }}>
          <Award className="w-5 h-5" />
          Ranking de Contribuições por Participante
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {rankingOrdenado.length === 0 ? (
          <div className="text-sm text-gray-500">
            Ainda não há participantes com contribuições registradas.
          </div>
        ) : (
          rankingOrdenado.map((participante, index) => (
            <div
              key={`${participante.userId}-${index}`}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm"
                style={{ backgroundColor: "#C8E6C9", color: "#2E7D32" }}
              >
                {index + 1}º
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback
                  style={{ backgroundColor: "#2E7D32", color: "#FFF" }}
                >
                  {getIniciais(participante.nome)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h4 className="font-medium" style={{ color: "#2E7D32" }}>
                  {participante.nome}
                </h4>
                <p className="text-xs text-gray-600">{participante.cidade}</p>
              </div>

              <div className="text-right">
                <p className="font-bold" style={{ color: "#2E7D32" }}>
                  {participante.contribuicoes}
                </p>
                <p className="text-xs text-gray-600">contribuições</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {participante.pontos} pts
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}