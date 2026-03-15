"use client";

import { LocateFixed, MessageSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type NovoRelatoFormProps = {
  onSubmit: (payload: {
    conteudo: string;
    localizacao?: string;
    categoria?: string;
    imagemUrl?: string;
  }) => Promise<boolean> | boolean;
  onCancel: () => void;
  loading?: boolean;
};

const categoriasSugeridas = [
  "Vegetação",
  "Arborização",
  "Energia",
  "Água",
  "Resíduos",
  "Coleta Seletiva",
  "Saneamento",
  "Poluição",
  "Mobilidade Urbana",
  "Transporte Sustentável",
  "Educação Ambiental",
  "Reciclagem",
  "Praças e Parques",
  "Fauna",
  "Mudanças Climáticas",
  "Queimadas",
  "Desmatamento",
  "Acessibilidade",
  "Segurança",
  "Infraestrutura Urbana",
  "Iluminação Pública",
  "Limpeza Urbana",
  "Alagamentos",
  "Saúde Ambiental",
  "Outro",
];

export function NovoRelatoForm({
  onSubmit,
  onCancel,
  loading = false,
}: NovoRelatoFormProps) {
  const [conteudo, setConteudo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false);

  const categoriasUnicas = useMemo(
    () => Array.from(new Set(categoriasSugeridas)).sort((a, b) => a.localeCompare(b)),
    []
  );

  const handlePegarLocalizacaoAtual = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }

    setObtendoLocalizacao(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();

          const address = data?.address || {};
          const localFormatado =
            [
              address.suburb || address.neighbourhood || address.village || address.town,
              address.city || address.municipality,
              address.state,
            ]
              .filter(Boolean)
              .join(", ") || data?.display_name || `${latitude}, ${longitude}`;

          setLocalizacao(localFormatado);
          toast.success("Localização atual capturada com sucesso.");
        } catch (error) {
          console.error(error);
          setLocalizacao(
            `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          );
          toast.error("Não foi possível converter a localização para nome. Coordenadas foram usadas.");
        } finally {
          setObtendoLocalizacao(false);
        }
      },
      (error) => {
        setObtendoLocalizacao(false);

        if (error.code === 1) {
          toast.error("Permissão de localização negada.");
          return;
        }

        if (error.code === 2) {
          toast.error("Não foi possível obter sua localização.");
          return;
        }

        if (error.code === 3) {
          toast.error("Tempo esgotado ao tentar obter localização.");
          return;
        }

        toast.error("Erro ao obter localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async () => {
    if (!conteudo.trim()) {
      toast.error("Digite o conteúdo do relato.");
      return;
    }

    const ok = await onSubmit({
      conteudo: conteudo.trim(),
      localizacao: localizacao.trim() || undefined,
      categoria: categoria.trim() || undefined,
      imagemUrl: imagemUrl.trim() || undefined,
    });

    if (ok) {
      setConteudo("");
      setLocalizacao("");
      setCategoria("");
      setImagemUrl("");
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2 text-white p-2 rounded-md"
          style={{ backgroundColor: "#0277BD" }}
        >
          <MessageSquare className="w-5 h-5" />
          Compartilhe sua Experiência
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="O que você gostaria de compartilhar?"
          className="min-h-24"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Localização (opcional)"
            />

            <Button
              variant="outline"
              size="sm"
              type="button"
              className="flex items-center gap-2"
              onClick={handlePegarLocalizacaoAtual}
              disabled={loading || obtendoLocalizacao}
            >
              <LocateFixed className="w-4 h-4" />
              {obtendoLocalizacao ? "Obtendo localização..." : "Usar localização atual"}
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              list="categorias-relato"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Categoria (se não encontrar, digite a sua)"
            />
            <datalist id="categorias-relato">
              {categoriasUnicas.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
        </div>

        <Input
          value={imagemUrl}
          onChange={(e) => setImagemUrl(e.target.value)}
          placeholder="URL da imagem (opcional)"
        />

        <div className="flex items-center justify-end pt-4 border-t flex-wrap gap-3">
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !conteudo.trim()}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: "#0277BD" }}
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}