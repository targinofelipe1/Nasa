"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ComentarioFormProps = {
  relatoId: string;
  onSubmit: (relatoId: string, conteudo: string) => Promise<boolean> | boolean;
  loading?: boolean;
};

export function ComentarioForm({
  relatoId,
  onSubmit,
  loading = false,
}: ComentarioFormProps) {
  const [comentario, setComentario] = useState("");

  const handleSubmit = async () => {
    if (!comentario.trim()) return;

    const ok = await onSubmit(relatoId, comentario.trim());

    if (ok) {
      setComentario("");
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Digite seu comentário..."
        className="min-h-24"
      />

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !comentario.trim()}
          className="text-white hover:opacity-90"
          style={{ backgroundColor: "#0277BD" }}
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Enviando..." : "Comentar"}
        </Button>
      </div>
    </div>
  );
}