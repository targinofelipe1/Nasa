"use client";

import { Coins, Trophy, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type RecompensasResumoProps = {
  coins: number;
  pontos: number;
  nivelAtual: string;
  progressoNivel: number;
  pontosParaProximoNivel?: number;
  nivelMaximo?: boolean;
};

export function RecompensasResumo({
  coins,
  pontos,
  nivelAtual,
  progressoNivel,
  pontosParaProximoNivel,
  nivelMaximo = false,
}: RecompensasResumoProps) {
  return (
    <Card
      className="border-0 shadow-xl"
      style={{
        background: "linear-gradient(to right, #FFF8E1, #A5D6A7)",
      }}
    >
      <CardContent className="p-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#FFC107" }}
            >
              <Coins className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-1" style={{ color: "#FFC107" }}>
              {coins}
            </h3>
            <p className="text-gray-600">Coins Disponíveis</p>
          </div>

          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#2E7D32" }}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-xl font-bold mb-1" style={{ color: "#2E7D32" }}>
              {nivelAtual}
            </h3>

            <div className="w-full max-w-xs mx-auto">
              <Progress value={progressoNivel} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">
                {nivelMaximo
                  ? "Nível máximo!"
                  : `${pontosParaProximoNivel ?? 0} pontos para o próximo nível`}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#0277BD" }}
            >
              <Target className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-1" style={{ color: "#0277BD" }}>
              {pontos}
            </h3>
            <p className="text-gray-600">Pontos Totais</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}