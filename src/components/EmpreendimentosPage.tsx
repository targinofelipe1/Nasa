// InfraestruturaUrbanaPage.tsx
"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  MapPin,
  Hospital,
  Pill, // Farmácia
  HeartPulse, // Posto de Saúde
  Hotel,
  TreePine, // Praça/Área Verde
  Building2,
  TrendingUp,
  Filter,
  Search,
  Ruler,
  Layers3, // Área Total
  ShieldCheck, // Status
} from "lucide-react";

// --- DADOS SIMULADOS DE SERVIÇOS/INFRAESTRUTURA ---

enum TipoServico {
  HOSPITAL = "Hospitais",
  FARMACIA = "Farmácias",
  POSTO_SAUDE = "Postos de Saúde",
  HOTELARIA = "Hotelaria",
  PRACA_AREA_VERDE = "Praças e Áreas Verdes",
  OUTROS_SERVICOS = "Outros Serviços",
}

interface Infraestrutura {
  id: string;
  nome: string;
  municipio: string;
  estado: string;
  tipo: TipoServico;
  areaM2: number;
  contagemUnidades: number;
  status: "Ativo" | "Em Construção" | "Projeto";
  localizacaoDetalhada: string;
}

const DADOS_INFRAESTRUTURA_SIMULADOS: Infraestrutura[] = [
  {
    id: "i1",
    nome: "Hospital Metropolitano",
    municipio: "João Pessoa",
    estado: "PB",
    tipo: TipoServico.HOSPITAL,
    areaM2: 25000,
    contagemUnidades: 1,
    status: "Ativo",
    localizacaoDetalhada: "Bairro Central Sul",
  },
  {
    id: "i2",
    nome: "Rede de Farmácias Central",
    municipio: "Fortaleza",
    estado: "CE",
    tipo: TipoServico.FARMACIA,
    areaM2: 12000,
    contagemUnidades: 80,
    status: "Ativo",
    localizacaoDetalhada: "Vários pontos",
  },
  {
    id: "i3",
    nome: "Praça do Marco Zero",
    municipio: "Recife",
    estado: "PE",
    tipo: TipoServico.PRACA_AREA_VERDE,
    areaM2: 150000, // 15 hectares
    contagemUnidades: 1,
    status: "Ativo",
    localizacaoDetalhada: "Região Portuária",
  },
  {
    id: "i4",
    nome: "Posto de Saúde Comunitário",
    municipio: "João Pessoa",
    estado: "PB",
    tipo: TipoServico.POSTO_SAUDE,
    areaM2: 500,
    contagemUnidades: 1,
    status: "Em Construção",
    localizacaoDetalhada: "Zona Oeste",
  },
  {
    id: "i5",
    nome: "Nova Rede Hoteleira Costeira",
    municipio: "Natal",
    estado: "RN",
    tipo: TipoServico.HOTELARIA,
    areaM2: 80000,
    contagemUnidades: 5,
    status: "Projeto",
    localizacaoDetalhada: "Orla de Ponta Negra",
  },
  {
    id: "i6",
    nome: "Área de Preservação Urbana",
    municipio: "Fortaleza",
    estado: "CE",
    tipo: TipoServico.PRACA_AREA_VERDE,
    areaM2: 300000, // 30 hectares
    contagemUnidades: 1,
    status: "Ativo",
    localizacaoDetalhada: "Parque Urbano",
  },
];

// Mapeamento para os ícones de Card
const SERVICO_ICONS: { [key in TipoServico]: typeof Building2 } = {
  [TipoServico.HOSPITAL]: Hospital,
  [TipoServico.FARMACIA]: Pill,
  [TipoServico.POSTO_SAUDE]: HeartPulse,
  [TipoServico.HOTELARIA]: Hotel,
  [TipoServico.PRACA_AREA_VERDE]: TreePine,
  [TipoServico.OUTROS_SERVICOS]: Building2,
};

// --- COMPONENTE PRINCIPAL ---

export function InfraestruturaUrbanaPage() {
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [filtroServico, setFiltroServico] = useState<TipoServico | "Todos">("Todos");
  const [buscaNome, setBuscaNome] = useState("");

  const municipiosDisponiveis = useMemo(() => {
    const municipios = new Set(
      DADOS_INFRAESTRUTURA_SIMULADOS.map((i) => i.municipio)
    );
    return ["Todos", ...Array.from(municipios)];
  }, []);

  const servicosDisponiveis = useMemo(() => {
    return ["Todos", ...Object.values(TipoServico)];
  }, []);

  const infraestruturaFiltrada = useMemo(() => {
    return DADOS_INFRAESTRUTURA_SIMULADOS.filter((infra) => {
      const matchMunicipio =
        filtroMunicipio === "Todos" || infra.municipio === filtroMunicipio;
      const matchServico = filtroServico === "Todos" || infra.tipo === filtroServico;
      const matchBusca = infra.nome
        .toLowerCase()
        .includes(buscaNome.toLowerCase());
      return matchMunicipio && matchServico && matchBusca;
    });
  }, [filtroMunicipio, filtroServico, buscaNome]);

  const stats = useMemo(() => {
    const totalArea = DADOS_INFRAESTRUTURA_SIMULADOS.reduce((sum, i) => sum + i.areaM2, 0);
    const totalContagem = DADOS_INFRAESTRUTURA_SIMULADOS.reduce((sum, i) => sum + i.contagemUnidades, 0);
    const emConstrucaoOuProjeto = DADOS_INFRAESTRUTURA_SIMULADOS.filter(i => i.status !== 'Ativo').length;
    
    // Calcula o serviço mais comum
    const contagemServico: Record<TipoServico, number> = {} as Record<TipoServico, number>;
    DADOS_INFRAESTRUTURA_SIMULADOS.forEach(i => {
        contagemServico[i.tipo] = (contagemServico[i.tipo] || 0) + i.contagemUnidades;
    });
    const servicoMaisComum = Object.entries(contagemServico).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';


    return [
        {
            titulo: "Área Total Mapeada (M²)",
            valor: totalArea.toLocaleString('pt-BR'),
            icone: Layers3,
            cor: "#0277BD",
        },
        {
            titulo: "Total de Unidades/Locais",
            valor: totalContagem.toLocaleString('pt-BR'),
            icone: Building2,
            cor: "#FFC107",
        },
        {
            titulo: "Em Expansão/Projeto",
            valor: emConstrucaoOuProjeto.toString(),
            icone: TrendingUp,
            cor: "#2E7D32",
        },
        {
            titulo: "Serviço Mais Comum",
            valor: servicoMaisComum,
            icone: SERVICO_ICONS[servicoMaisComum as TipoServico] || Hospital,
            cor: "#673AB7",
        },
    ];
  }, []);

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
  
  const formatArea = (area: number): string => {
    if (area >= 10000) {
      return `${(area / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`;
    }
    return `${area.toLocaleString('pt-BR')} m²`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1
              className="text-3xl lg:text-4xl font-bold mb-2"
              style={{ color: "#0277BD" }}
            >
              Análise de Infraestrutura Urbana (Serviços)
            </h1>
            <p className="text-gray-600">
              Mapeamento da área ocupada e quantidade de empreendimentos de serviço público e privado por município.
            </p>
          </motion.div>

          {/* Estatísticas (Área e Contagem) */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => {
                const IconComponent = stat.icone;
                return (
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
                                    <IconComponent className="w-6 h-6" style={{ color: stat.cor }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filtros e Busca */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" style={{ color: "#0277BD" }}>
                            <Filter className="w-5 h-5" />
                            Filtros de Serviços
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Município</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                                value={filtroMunicipio}
                                onChange={(e) => setFiltroMunicipio(e.target.value)}
                            >
                                {municipiosDisponiveis.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Tipo de Serviço</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                                value={filtroServico}
                                onChange={(e) => setFiltroServico(e.target.value as TipoServico | "Todos")}
                            >
                                {servicosDisponiveis.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Buscar por Nome</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Nome do empreendimento..."
                                    className="pl-10"
                                    value={buscaNome}
                                    onChange={(e) => setBuscaNome(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full text-white hover:opacity-90"
                            style={{ backgroundColor: "#0277BD" }}
                            onClick={() => {
                                setFiltroMunicipio("Todos");
                                setFiltroServico("Todos");
                                setBuscaNome("");
                            }}
                        >
                            Resetar Filtros
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Lista de Empreendimentos de Serviço */}
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
              <h2 className="text-xl font-bold text-gray-800">
                {infraestruturaFiltrada.length} Mapeamentos de Infraestrutura Encontrados
              </h2>
              {infraestruturaFiltrada.map((infra) => {
                const ServicoIcon = SERVICO_ICONS[infra.tipo as TipoServico];
                
                let badgeColor;
                if (infra.status === "Ativo") badgeColor = "bg-green-500 hover:bg-green-600";
                else if (infra.status === "Em Construção") badgeColor = "bg-yellow-500 hover:bg-yellow-600";
                else badgeColor = "bg-blue-500 hover:bg-blue-600";

                return (
                  <motion.div 
                    key={infra.id} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.005, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-blue-500 shadow-lg p-4">
                      <CardContent className="p-0">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100" style={{ color: "#0277BD" }}>
                                    <ServicoIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{infra.nome}</h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-red-500" />
                                        {infra.localizacaoDetalhada} ({infra.municipio}, {infra.estado})
                                    </p>
                                </div>
                            </div>
                            <Badge className={`text-white text-xs ${badgeColor}`}>
                                <ShieldCheck className="w-3 h-3 mr-1" /> {infra.status}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 py-3 border-t border-b border-gray-100 mb-4">
                            <div className="flex items-center gap-1">
                                <Ruler className="w-4 h-4 text-gray-500" />
                                <span>Área Ocupada: <span className="font-semibold text-gray-900">{formatArea(infra.areaM2)}</span></span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-gray-500" />
                                <span>Contagem de Unidades/Locais: <span className="font-semibold text-gray-900">{infra.contagemUnidades.toLocaleString('pt-BR')}</span></span>
                            </div>
                        </div>

                        {/* Tipo de Serviço */}
                        <div className="mt-3">
                            <p className="font-medium text-gray-800 mb-2">Categoria Mapeada:</p>
                            <Badge 
                                variant="default"
                                className="bg-blue-500 text-white font-bold text-base"
                            >
                                {infra.tipo}
                            </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {infraestruturaFiltrada.length === 0 && (
                <div className="text-center p-8 bg-white/90 rounded-xl shadow-lg border border-gray-200">
                    <p className="text-gray-600 font-medium">Nenhum mapeamento de infraestrutura encontrado com os filtros aplicados.</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}