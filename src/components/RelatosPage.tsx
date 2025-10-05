"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  MessageSquare,
  Heart,
  Share,
  MapPin,
  Camera,
  Send,
  MessageCircle,
  Globe,
  Users,
  TrendingUp,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { toast } from "sonner";
import { useApp } from "@/app/dash/AppContext";

export function RelatosPage() {
  const { usuario, relatos, adicionarRelato, adicionarComentario, curtirRelato } = useApp();
  const [novoRelato, setNovoRelato] = useState("");
  const [localizacaoRelato, setLocalizacaoRelato] = useState("");
  const [categoriaRelato, setCategoriaRelato] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [comentarios, setComentarios] = useState<{ [key: string]: string }>({});
  const [showComentarios, setShowComentarios] = useState<{ [key: string]: boolean }>({});

  const handlePublicarRelato = () => {
    if (!novoRelato.trim()) {
      toast.error("Digite o conteúdo do relato!");
      return;
    }

    adicionarRelato({
      usuario: usuario.nome,
      avatar: usuario.avatar,
      cidade: usuario.cidade,
      conteudo: novoRelato,
      localizacao: localizacaoRelato,
      categoria: categoriaRelato || "Geral",
    });

    setNovoRelato("");
    setLocalizacaoRelato("");
    setCategoriaRelato("");
    setShowForm(false);
    toast.success("🎉 Relato publicado com sucesso! +5 coins adicionados.");
  };

  const handleAdicionarComentario = (relatoId: string) => {
    const comentarioTexto = comentarios[relatoId];
    if (!comentarioTexto?.trim()) {
      toast.error("Digite um comentário!");
      return;
    }

    adicionarComentario(relatoId, {
      usuario: usuario.nome,
      avatar: usuario.avatar,
      conteudo: comentarioTexto,
    });

    setComentarios((prev) => ({ ...prev, [relatoId]: "" }));
    toast.success("+2 coins adicionados por comentar!");
  };

  const handleCurtirRelato = (relatoId: string) => {
    curtirRelato(relatoId);
    const relato = relatos.find((r) => r.id === relatoId);
    if (relato && !relato.liked) {
      toast.success("+1 coin adicionado por curtir!");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1
                  className="text-3xl lg:text-4xl font-bold mb-2"
                  style={{ color: "#0277BD" }}
                >
                  Relatos da Comunidade
                </h1>
                <p className="text-gray-600">
                  Compartilhe experiências e conecte-se com outros cidadãos engajados
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="text-white flex items-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: "#0277BD" }}
                >
                  <Plus className="w-4 h-4" />
                  Novo Relato
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {[
              {
                titulo: "Total de Relatos",
                valor: relatos.length.toString(),
                icone: MessageSquare,
                cor: "#0277BD",
              },
              {
                titulo: "Seus Coins",
                valor: usuario.coins.toString(),
                icone: Users,
                cor: "#FFC107",
              },
              {
                titulo: "Engajamento",
                valor: `${Math.floor(Math.random() * 20) + 80}%`,
                icone: TrendingUp,
                cor: "#2E7D32",
              },
              {
                titulo: "Alcance",
                valor: `${relatos.length * 15}`,
                icone: Globe,
                cor: "#673AB7",
              },
            ].map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.titulo}</p>
                      <p className="text-2xl font-bold" style={{ color: stat.cor }}>
                        {stat.valor}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: stat.cor + "33" }}
                    >
                      <stat.icone className="w-6 h-6" style={{ color: stat.cor }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Feed Principal */}
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
              {showForm && (
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
                      value={novoRelato}
                      onChange={(e) => setNovoRelato(e.target.value)}
                      placeholder="O que você gostaria de compartilhar sobre sustentabilidade na sua cidade?"
                      className="min-h-24"
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        value={localizacaoRelato}
                        onChange={(e) => setLocalizacaoRelato(e.target.value)}
                        placeholder="Localização (opcional)"
                      />
                      <Input
                        value={categoriaRelato}
                        onChange={(e) => setCategoriaRelato(e.target.value)}
                        placeholder="Categoria (ex: Vegetação, Energia)"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Foto
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Local
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowForm(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={handlePublicarRelato}
                          disabled={!novoRelato.trim()}
                          className="text-white hover:opacity-90"
                          style={{ backgroundColor: "#0277BD" }}
                        >
                          <Send className="w-4 h-4" />
                          Publicar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feed de Relatos */}
              {relatos.map((relato) => (
                <motion.div key={relato.id} variants={itemVariants}>
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback
                            className="text-white"
                            style={{ backgroundColor: "#0277BD" }}
                          >
                            {relato.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{relato.usuario}</h3>
                          <p className="text-sm text-gray-500">{relato.cidade}</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{relato.conteudo}</p>

                      {relato.imagem && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <ImageWithFallback
                            src={relato.imagem}
                            alt="Imagem do relato"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCurtirRelato(relato.id)}
                            className={`flex items-center gap-2 ${
                              relato.liked ? "text-red-500" : "text-gray-600 hover:text-red-500"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${relato.liked ? "fill-current" : ""}`}
                            />
                            <span>{relato.likes}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowComentarios((prev) => ({
                                ...prev,
                                [relato.id]: !prev[relato.id],
                              }))
                            }
                            className="flex items-center gap-2 text-gray-600 hover:opacity-80"
                            style={{ color: "#0277BD" }}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{relato.comentarios.length}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#0277BD" }}>
                    <Users className="w-5 h-5" />
                    Comunidades Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["Eco Recife", "Verde Fortaleza", "Sustentável JP", "Natal Limpa"].map(
                    (comunidade, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #2E7D32, #0277BD)",
                          }}
                        >
                          <span className="text-white font-bold text-sm">
                            {comunidade.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{comunidade}</h4>
                          <p className="text-sm text-gray-600">
                            {Math.floor(Math.random() * 50) + 20} membros ativos
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
