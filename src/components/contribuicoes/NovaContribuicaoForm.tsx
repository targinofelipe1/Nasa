"use client";

import { useMemo, useState } from "react";
import { LocateFixed, Send } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type NovaContribuicaoFormProps = {
  onSubmit: (payload: {
    cidade: string;
    tipo: string;
    localizacao?: string;
    descricao: string;
    quantidade: string;
    imagemUrl?: string;
  }) => Promise<boolean> | boolean;
  onCancel: () => void;
  loading?: boolean;
};

const tiposSugeridos = [
  "Plantio de Árvores",
  "Coleta Seletiva",
  "Energia Solar",
  "Conservação de Água",
  "Transporte Sustentável",
  "Educação Ambiental",
  "Reciclagem",
  "Limpeza Urbana",
  "Horta Comunitária",
  "Compostagem",
  "Ação em Escola",
  "Mutirão Ambiental",
  "Outro",
];

const cidadesSugeridas = [
  "João Pessoa",
  "Recife",
  "Fortaleza",
  "Natal",
  "Salvador",
];

export function NovaContribuicaoForm({
  onSubmit,
  onCancel,
  loading = false,
}: NovaContribuicaoFormProps) {
  const [tipo, setTipo] = useState("");
  const [cidade, setCidade] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false);

  const tiposUnicos = useMemo(
    () => Array.from(new Set(tiposSugeridos)).sort((a, b) => a.localeCompare(b)),
    []
  );

  const cidadesUnicas = useMemo(
    () => Array.from(new Set(cidadesSugeridas)).sort((a, b) => a.localeCompare(b)),
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

          if (!cidade) {
            const cidadeDetectada =
              address.city ||
              address.municipality ||
              address.town ||
              address.village ||
              "";
            if (cidadeDetectada) setCidade(cidadeDetectada);
          }

          toast.success("Localização atual capturada com sucesso.");
        } catch (error) {
          console.error(error);
          setLocalizacao(
            `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          );
          toast.error("Não foi possível converter a localização para nome.");
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
    if (!tipo.trim() || !cidade.trim() || !descricao.trim() || !quantidade.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const ok = await onSubmit({
      cidade: cidade.trim(),
      tipo: tipo.trim(),
      localizacao: localizacao.trim() || undefined,
      descricao: descricao.trim(),
      quantidade: quantidade.trim(),
      imagemUrl: imagemUrl.trim() || undefined,
    });

    if (ok) {
      setTipo("");
      setCidade("");
      setLocalizacao("");
      setDescricao("");
      setQuantidade("");
      setImagemUrl("");
    }
  };

  return (
    <Card className="border-0 shadow-xl mb-8" style={{ backgroundColor: "#FFFFFFE6" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: "#2E7D32" }}>
          Nova Contribuição Ambiental
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Contribuição *</Label>
            <Input
              id="tipo"
              list="tipos-contribuicao"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Selecione ou digite o tipo"
            />
            <datalist id="tipos-contribuicao">
              {tiposUnicos.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              list="cidades-contribuicao"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Selecione ou digite a cidade"
            />
            <datalist id="cidades-contribuicao">
              {cidadesUnicas.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição da Atividade *</Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva sua contribuição..."
            className="min-h-24"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade/Impacto *</Label>
            <Input
              id="quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 5 árvores, 10 kg de lixo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagemUrl">URL da Foto</Label>
            <Input
              id="imagemUrl"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="localizacao">Localização</Label>
          <Input
            id="localizacao"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
            placeholder="Bairro, rua, ponto de referência..."
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

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 flex-1 text-white"
            style={{ backgroundColor: "#2E7D32" }}
          >
            <Send className="w-4 h-4" />
            {loading ? "Enviando..." : "Enviar Contribuição"}
          </Button>

          <Button variant="outline" type="button" onClick={onCancel} className="px-8">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}