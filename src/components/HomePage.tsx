"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  TreePine,
  Users,
  Upload,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useRouter } from "next/navigation";

export function HomePage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen"
      
    >
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden py-20 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="space-y-6">
                <motion.div
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: "#A5D6A733" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Globe className="w-5 h-5" style={{ color: "#2E7D32" }} />
                  <span className="font-medium" style={{ color: "#2E7D32" }}>
                    Sustentabilidade em Ação
                  </span>
                </motion.div>

                <h1
                  className="text-4xl lg:text-6xl font-bold leading-tight"
                  style={{ color: "#2E7D32" }}
                >
                  Transformando dados e pessoas em{" "}
                  <span style={{ color: "#0277BD" }}>ações</span> para cidades
                  mais <span style={{ color: "#43A047" }}>sustentáveis</span>
                </h1>

                <p className="text-lg text-gray-700 leading-relaxed">
                  O GlobalLifeCities integra dados sobre clima,
                  vegetação e população para apoiar políticas públicas, negócios
                  e comunidades conscientes.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Os dados utilizados são provenientes do MapBiomas, IDEMA, SEMAM, CPRH, ICMBio, WWF-Brasil, INMET e INPE.                
                </p>
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                variants={itemVariants}
              >
                <Button
                  onClick={() => router.push("/dash")}
                  className="px-8 py-3 rounded-xl flex items-center space-x-2 group text-white"
                  size="lg"
                  style={{ backgroundColor: "#2E7D32" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B5E20")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2E7D32")}
                >
                  <span>Explorar Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  onClick={() => router.push("/contribuicoes")}
                  variant="outline"
                  className="px-8 py-3 rounded-xl border"
                  size="lg"
                  style={{
                    borderColor: "#2E7D32",
                    color: "#2E7D32",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A5D6A733")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Contribuir Agora
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Content */}
            <motion.div variants={itemVariants} className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Cidade sustentável com vegetação urbana"
                  className="w-full h-[500px] object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, #2E7D3233, transparent)",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Cards Section */}
      <motion.section
        className="py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#2E7D32" }}
            >
              Faça Parte da Mudança
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Cada ação conta para construir cidades mais verdes e sustentáveis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 - Contribuições */}
            <motion.div variants={itemVariants}>
              <Card
                onClick={() => router.push("/contribuicoes")}
                className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: "linear-gradient(to bottom right, #A5D6A7, #C8E6C9)",
                }}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#2E7D32" }}
                    >
                      <TreePine className="w-8 h-8 text-white" />
                    </div>
                    <Sparkles className="w-6 h-6" style={{ color: "#FFC107" }} />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: "#2E7D32" }}
                  >
                    Contribua com Dados 🌱
                  </h3>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ color: "#2E7D32CC" }}
                  >
                    A cada dado inserido, uma árvore é plantada. Sua
                    contribuição ajuda a mapear e melhorar a sustentabilidade
                    das nossas cidades.
                  </p>
                  <Button
                    className="text-white rounded-lg"
                    style={{ backgroundColor: "#2E7D32" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1B5E20")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2E7D32")}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Inserir Dados
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2 - Relatos */}
            <motion.div variants={itemVariants}>
              <Card
                onClick={() => router.push("/relatos")}
                className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: "linear-gradient(to bottom right, #BBDEFB, #0277BD22)",
                }}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#0277BD" }}
                    >
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <Zap className="w-6 h-6" style={{ color: "#FFC107" }} />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: "#0277BD" }}
                  >
                    Relatos da Comunidade 💬
                  </h3>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ color: "#0277BDCC" }}
                  >
                    Compartilhe suas experiências e conecte-se com outras
                    pessoas engajadas em sustentabilidade.
                  </p>
                  <Button
                    className="text-white rounded-lg"
                    style={{ backgroundColor: "#0277BD" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#01579B")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0277BD")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Compartilhe sua
                    visão
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
