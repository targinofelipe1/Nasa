"use client";

import { motion } from "framer-motion";
import { Filter, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComunidade } from "@/hooks/useComunidade";
import { NovoRelatoForm } from "@/components/comunidade/NovoRelatoForm";
import { RelatoCard } from "@/components/comunidade/RelatoCard";
import { ComentariosList } from "@/components/comunidade/ComentariosList";
import { ComentarioForm } from "@/components/comunidade/ComentarioForm";
import { ComunidadeStats } from "@/components/comunidade/ComunidadeStats";
import { ComunidadesAtivasCard } from "@/components/comunidade/ComunidadesAtivasCard";

export function RelatosPage() {
  const { user, isLoaded } = useUser();

  const [showForm, setShowForm] = useState(false);
  const [showComentarios, setShowComentarios] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroLocalizacao, setFiltroLocalizacao] = useState("");

  const {
    usuario,
    relatos,
    loading,
    submittingRelato,
    submittingComentarioId,
    curtindoRelatoId,
    stats,
    adicionarRelato,
    adicionarComentario,
    curtirRelato,
  } = useComunidade({
    userId: user?.id,
  });

  const categoriasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        relatos
          .map((relato) => relato.categoria?.trim())
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [relatos]);

  const relatosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    const categoria = filtroCategoria.trim().toLowerCase();
    const localizacao = filtroLocalizacao.trim().toLowerCase();

    return relatos.filter((relato) => {
      const matchBusca =
        !term ||
        relato.usuario.toLowerCase().includes(term) ||
        relato.cidade.toLowerCase().includes(term) ||
        relato.conteudo.toLowerCase().includes(term) ||
        (relato.categoria || "").toLowerCase().includes(term) ||
        (relato.localizacao || "").toLowerCase().includes(term);

      const matchCategoria =
        !categoria ||
        (relato.categoria || "").toLowerCase().includes(categoria);

      const matchLocalizacao =
        !localizacao ||
        (relato.localizacao || "").toLowerCase().includes(localizacao) ||
        relato.cidade.toLowerCase().includes(localizacao);

      return matchBusca && matchCategoria && matchLocalizacao;
    });
  }, [relatos, search, filtroCategoria, filtroLocalizacao]);

  const totalComentarios = useMemo(() => {
    return relatos.reduce((acc, relato) => acc + (relato.comentarios?.length || 0), 0);
  }, [relatos]);

  const totalCurtidas = useMemo(() => {
    return relatos.reduce((acc, relato) => acc + (relato.likes || 0), 0);
  }, [relatos]);

  const totalUsuarios = useMemo(() => {
    return new Set(relatos.map((relato) => relato.userId).filter(Boolean)).size;
  }, [relatos]);

  const handlePublicarRelato = async (payload: {
    conteudo: string;
    localizacao?: string;
    categoria?: string;
    imagemUrl?: string;
  }) => {
    if (!usuario) return false;

    const ok = await adicionarRelato({
      usuarioNome: usuario.nome,
      usuarioCidade: usuario.cidade,
      usuarioAvatar: usuario.avatar,
      ...payload,
    });

    if (ok) {
      setShowForm(false);
    }

    return ok;
  };

  const handleAdicionarComentario = async (relatoId: string, conteudo: string) => {
    if (!usuario) return false;

    return adicionarComentario({
      relatoId,
      usuarioNome: usuario.nome,
      usuarioAvatar: usuario.avatar,
      conteudo,
    });
  };

  const handleCurtirRelato = async (relatoId: string) => {
    if (!usuario) return false;

    return curtirRelato({
      relatoId,
      usuarioNome: usuario.nome,
    });
  };

  const limparFiltros = () => {
    setFiltroCategoria("");
    setFiltroLocalizacao("");
    setSearch("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl bg-white p-6 shadow-md text-gray-600">
            Carregando usuário...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1
                  className="mb-2 text-3xl font-bold lg:text-4xl"
                  style={{ color: "#0277BD" }}
                >
                  Relatos da Comunidade
                </h1>
                <p className="text-gray-600">
                  Compartilhe experiências e conecte-se com outros cidadãos engajados
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar relatos"
                    className="bg-transparent text-sm outline-none"
                  />
                </div>

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  type="button"
                  onClick={() => setShowFiltros((prev) => !prev)}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>

                <Button
                  onClick={() => setShowForm((prev) => !prev)}
                  className="flex items-center gap-2 text-white hover:opacity-90"
                  style={{ backgroundColor: "#0277BD" }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Novo Relato
                </Button>
              </div>
            </div>
          </motion.div>

          {showFiltros && (
            <motion.div
              variants={itemVariants}
              className="mb-6 space-y-4 rounded-xl bg-white/90 p-4 shadow-lg"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Filtrar por categoria
                  </label>
                  <Input
                    list="categorias-filtro"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    placeholder="Digite ou selecione uma categoria"
                  />
                  <datalist id="categorias-filtro">
                    {categoriasDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Filtrar por local
                  </label>
                  <Input
                    value={filtroLocalizacao}
                    onChange={(e) => setFiltroLocalizacao(e.target.value)}
                    placeholder="Ex: João Pessoa, Centro, PB..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" type="button" onClick={limparFiltros}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <ComunidadeStats
              totalRelatos={stats.totalRelatos}
              coins={stats.coins}
              engajamento={stats.engajamento}
              alcance={stats.alcance}
            />
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-4">
            <motion.div variants={itemVariants} className="space-y-6 lg:col-span-3">
              {showForm ? (
                <NovoRelatoForm
                  onSubmit={handlePublicarRelato}
                  onCancel={() => setShowForm(false)}
                  loading={submittingRelato}
                />
              ) : null}

              {loading ? (
                <div className="rounded-xl bg-white/90 p-6 text-gray-600 shadow-lg">
                  Carregando relatos...
                </div>
              ) : relatosFiltrados.length === 0 ? (
                <div className="rounded-xl bg-white/90 p-6 text-gray-600 shadow-lg">
                  Nenhum relato encontrado.
                </div>
              ) : (
                relatosFiltrados.map((relato) => (
                  <RelatoCard
                    key={relato.id}
                    relato={relato}
                    showComentarios={!!showComentarios[relato.id]}
                    onToggleComentarios={(relatoId) =>
                      setShowComentarios((prev) => ({
                        ...prev,
                        [relatoId]: !prev[relatoId],
                      }))
                    }
                    onCurtir={handleCurtirRelato}
                    curtindo={curtindoRelatoId === relato.id}
                  >
                    <div className="space-y-4">
                      <ComentariosList comentarios={relato.comentarios} />

                      <ComentarioForm
                        relatoId={relato.id}
                        onSubmit={handleAdicionarComentario}
                        loading={submittingComentarioId === relato.id}
                      />
                    </div>
                  </RelatoCard>
                ))
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <ComunidadesAtivasCard
                totalUsuarios={totalUsuarios}
                totalComentarios={totalComentarios}
                totalCurtidas={totalCurtidas}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}