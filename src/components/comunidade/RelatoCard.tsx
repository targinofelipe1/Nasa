"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, Clock3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/ImageWithFallback";

import type { Relato } from "@/types/comunidade";

type RelatoCardProps = {
  relato: Relato;
  showComentarios: boolean;
  onToggleComentarios: (relatoId: string) => void;
  onCurtir: (relatoId: string) => void;
  curtindo?: boolean;
  children?: React.ReactNode;
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function formatarDataHoraBR(dataISO?: string) {
  if (!dataISO) return "";

  const data = new Date(dataISO);

  if (Number.isNaN(data.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export function RelatoCard({
  relato,
  showComentarios,
  onToggleComentarios,
  onCurtir,
  curtindo = false,
  children,
}: RelatoCardProps) {
  const dataPostagem = formatarDataHoraBR(relato.createdAt);

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: "#0277BD" }}
              >
                {relato.avatar || relato.usuario?.slice(0, 2)?.toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{relato.usuario}</h3>
              <p className="text-sm text-gray-500">{relato.cidade}</p>

              {dataPostagem ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Clock3 className="w-3.5 h-3.5" />
                  Publicado em {dataPostagem}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 mt-3">
                {relato.categoria ? (
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {relato.categoria}
                  </span>
                ) : null}

                {relato.localizacao ? (
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {relato.localizacao}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4 whitespace-pre-line">{relato.conteudo}</p>

          {relato.imagem ? (
            <div className="mb-4 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={relato.imagem}
                alt="Imagem do relato"
                className="w-full h-64 object-cover"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCurtir(relato.id)}
                disabled={curtindo}
                className={`flex items-center gap-2 ${
                  relato.liked ? "text-red-500" : "text-gray-600 hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${relato.liked ? "fill-current" : ""}`} />
                <span>{relato.likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleComentarios(relato.id)}
                className="flex items-center gap-2 text-gray-600 hover:opacity-80"
                style={{ color: "#0277BD" }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>{relato.comentarios.length}</span>
              </Button>
            </div>
          </div>

          {showComentarios ? <div className="mt-4 pt-4 border-t">{children}</div> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}