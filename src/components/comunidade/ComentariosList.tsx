"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Comentario } from "@/types/comunidade";

type ComentariosListProps = {
  comentarios: Comentario[];
};

export function ComentariosList({ comentarios }: ComentariosListProps) {
  if (!comentarios.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        Ainda não há comentários para este relato.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comentarios.map((comentario) => (
        <div
          key={comentario.id}
          className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
        >
          <Avatar className="w-9 h-9">
            <AvatarFallback
              className="text-white"
              style={{ backgroundColor: "#0277BD" }}
            >
              {comentario.avatar ||
                comentario.usuario?.slice(0, 2)?.toUpperCase() ||
                "US"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <p className="text-sm font-medium text-gray-900">
                {comentario.usuario}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(comentario.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-line">
              {comentario.conteudo}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}