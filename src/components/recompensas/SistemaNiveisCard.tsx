"use client";

import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Nivel = {
  nome: string;
  minPontos: number;
  maxPontos: number;
};

type SistemaNiveisCardProps = {
  nivelAtual: string;
};

const niveis: Nivel[] = [
  { nome: "Iniciante Verde", minPontos: 0, maxPontos: 100 },
  { nome: "Verde Expert", minPontos: 100, maxPontos: 500 },
  { nome: "Eco Warrior", minPontos: 500, maxPontos: 1500 },
  { nome: "Verde Master", minPontos: 1500, maxPontos: 3000 },
  { nome: "Eco Legend", minPontos: 3000, maxPontos: Infinity },
];

export function SistemaNiveisCard({
  nivelAtual,
}: SistemaNiveisCardProps) {
  return (
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
        {niveis.map((nivel, index) => {
          const ativo = nivel.nome === nivelAtual;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                ativo ? "border-2" : "border border-gray-100"
              }`}
              style={{
                backgroundColor: ativo ? "#E8F5E9" : "#FAFAFA",
                borderColor: ativo ? "#2E7D32" : "#E0E0E0",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-medium"
                  style={{
                    color: ativo ? "#2E7D32" : "#555",
                  }}
                >
                  {nivel.nome}
                </span>

                {ativo ? (
                  <Badge style={{ backgroundColor: "#2E7D32", color: "#fff" }}>
                    Atual
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs text-gray-500">
                {nivel.maxPontos === Infinity
                  ? `${nivel.minPontos}+ pontos`
                  : `${nivel.minPontos} - ${nivel.maxPontos} pontos`}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}