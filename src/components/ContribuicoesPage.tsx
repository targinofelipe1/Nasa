"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  TreePine,
  Upload,
  MapPin,
  Users,
  Award,
  TrendingUp,
  Plus,
  Camera,
  Send,
  Star,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/app/dash/AppContext";
import { ImageWithFallback } from "./ImageWithFallback";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

const rankingCidadaos = [
  { nome: "Maria Silva", cidade: "João Pessoa", contribuicoes: 47, pontos: 2850, nivel: "Verde Master" },
  { nome: "João Santos", cidade: "Recife", contribuicoes: 42, pontos: 2650, nivel: "Eco Warrior" },
  { nome: "Ana Costa", cidade: "Fortaleza", contribuicoes: 38, pontos: 2400, nivel: "Eco Warrior" },
  { nome: "Pedro Lima", cidade: "Natal", contribuicoes: 35, pontos: 2200, nivel: "Verde Expert" },
  { nome: "Carla Rocha", cidade: "Salvador", contribuicoes: 32, pontos: 2050, nivel: "Verde Expert" },
];

export function ContribuicoesPage() {
  const { usuario, contribuicoes, adicionarContribuicao } = useApp();
  const [tipoContribuicao, setTipoContribuicao] = useState("");
  const [cidade, setCidade] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmitContribuicao = () => {
    if (!tipoContribuicao || !cidade || !descricao || !quantidade) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    adicionarContribuicao({
      usuario: usuario.nome,
      cidade,
      tipo: tipoContribuicao,
      localizacao,
      descricao,
      quantidade,
    });

    setTipoContribuicao("");
    setCidade("");
    setLocalizacao("");
    setDescricao("");
    setQuantidade("");
    setShowForm(false);

    toast.success("🎉 Contribuição adicionada com sucesso! Coins adicionados à sua conta.");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen p-6"
     
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#2E7D32" }}>
                  Painel de Contribuições
                </h1>
                <p className="text-gray-600">
                  Contribua com dados ambientais e ajude a tornar sua cidade mais sustentável
                </p>
              </div>

              <Button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 text-white"
                size="lg"
                style={{ backgroundColor: "#2E7D32" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B5E20")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2E7D32")}
              >
                <Plus className="w-5 h-5" />
                Nova Contribuição
              </Button>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { titulo: "Total de Contribuições", valor: contribuicoes.length.toString(), icone: Upload, cor: "#2E7D32", bg: "#A5D6A7" },
              { titulo: "Suas Contribuições", valor: usuario.contribuicoes.toString(), icone: TreePine, cor: "#43A047", bg: "#C8E6C9" },
              { titulo: "Seus Coins", valor: usuario.coins.toString(), icone: Star, cor: "#FFC107", bg: "#FFF9C4" },
              { titulo: "Pontos Totais", valor: usuario.pontos.toString(), icone: Target, cor: "#0277BD", bg: "#BBDEFB" },
            ].map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg" style={{ backgroundColor: "#FFFFFFCC" }}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.titulo}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.cor }}>
                      {stat.valor}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icone className="w-6 h-6" style={{ color: stat.cor }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              {showForm && (
                <Card className="border-0 shadow-xl mb-8" style={{ backgroundColor: "#FFFFFFE6" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: "#2E7D32" }}>
                      <TreePine className="w-5 h-5" />
                      Nova Contribuição Ambiental
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo de Contribuição *</Label>
                        <Select value={tipoContribuicao} onValueChange={setTipoContribuicao}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plantio">🌱 Plantio de Árvores</SelectItem>
                            <SelectItem value="coleta">♻️ Coleta Seletiva</SelectItem>
                            <SelectItem value="energia">☀️ Energia Solar</SelectItem>
                            <SelectItem value="agua">💧 Conservação de Água</SelectItem>
                            <SelectItem value="transporte">🚲 Transporte Sustentável</SelectItem>
                            <SelectItem value="educacao">📚 Educação Ambiental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade *</Label>
                        <Select value={cidade} onValueChange={setCidade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a cidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="João Pessoa">João Pessoa</SelectItem>
                            <SelectItem value="Recife">Recife</SelectItem>
                            <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                            <SelectItem value="Natal">Natal</SelectItem>
                            <SelectItem value="Salvador">Salvador</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="foto">Foto</Label>
                        <div className="flex items-center gap-2">
                          <Input type="file" accept="image/*" className="flex-1" />
                          <Button variant="outline" size="icon">
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={handleSubmitContribuicao}
                        className="flex items-center gap-2 flex-1 text-white"
                        style={{ backgroundColor: "#2E7D32" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B5E20")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2E7D32")}
                      >
                        <Send className="w-4 h-4" />
                        Enviar Contribuição
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)} className="px-8">
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mapa */}
              <Card className="border-0 shadow-lg" style={{ backgroundColor: "#FFFFFFE6" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#2E7D32" }}>
                    <MapPin className="w-5 h-5" />
                    Mapa de Contribuições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-96 rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: "linear-gradient(to bottom right, #A5D6A7, #0277BD)",
                    }}
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274"
                      alt="Mapa"
                      className="w-full h-full object-cover opacity-20"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Ranking */}
              <Card className="border-0 shadow-lg" style={{ backgroundColor: "#FFFFFFE6" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#2E7D32" }}>
                    <Award className="w-5 h-5" />
                    Ranking Cidadãos Verdes 🌿
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rankingCidadaos.map((cidadao, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "#E8F5E9" }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          style={{ backgroundColor: "#2E7D32", color: "#FFF" }}
                        >
                          {cidadao.nome.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium" style={{ color: "#2E7D32" }}>
                          {cidadao.nome}
                        </h4>
                        <p className="text-xs text-gray-600">{cidadao.cidade}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "#2E7D32" }}>
                          {cidadao.pontos}
                        </p>
                        <p className="text-xs text-gray-600">
                          {cidadao.contribuicoes} contrib.
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
