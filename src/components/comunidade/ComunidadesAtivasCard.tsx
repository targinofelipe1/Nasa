"use client";

import { Heart, MessageCircle, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IndicadoresComunidadeProps = {
  totalUsuarios?: number;
  totalComentarios?: number;
  totalCurtidas?: number;
};

export function ComunidadesAtivasCard({
  totalUsuarios = 0,
  totalComentarios = 0,
  totalCurtidas = 0,
}: IndicadoresComunidadeProps) {
  const indicadores = [
    {
      label: "Usuários",
      valor: totalUsuarios,
      icon: Users,
      corFundo: "bg-blue-100",
      corIcone: "text-blue-700",
    },
    {
      label: "Comentários",
      valor: totalComentarios,
      icon: MessageCircle,
      corFundo: "bg-green-100",
      corIcone: "text-green-700",
    },
    {
      label: "Curtidas",
      valor: totalCurtidas,
      icon: Heart,
      corFundo: "bg-red-100",
      corIcone: "text-red-700",
    },
  ];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: "#0277BD" }}>
          <Users className="w-5 h-5" />
          Indicadores da Comunidade
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {indicadores.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${item.corFundo}`}
              >
                <Icon className={`h-5 w-5 ${item.corIcone}`} />
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">
                  {item.valor.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}