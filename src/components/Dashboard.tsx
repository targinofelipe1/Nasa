import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

import { 
  TreePine, 
  Sun, 
  Users, 
  Thermometer,
  TrendingUp,
  MapPin,
  Zap,
  Droplets
} from 'lucide-react';
import { useApp } from "@/app/dash/AppContext";

const cidadesData = [
  {
    nome: 'João Pessoa',
    estado: 'PB',
    vegetacao: 78,
    energiaSolar: 65,
    densidade: 1200,
    temperatura: 28,
    qualidadeAr: 85,
    color: 'from-green-500 to-green-600'
  },
  {
    nome: 'Recife',
    estado: 'PE',
    vegetacao: 72,
    energiaSolar: 70,
    densidade: 2100,
    temperatura: 30,
    qualidadeAr: 75,
    color: 'from-blue-500 to-blue-600'
  },
  {
    nome: 'Fortaleza',
    estado: 'CE',
    vegetacao: 68,
    energiaSolar: 85,
    densidade: 1800,
    temperatura: 32,
    qualidadeAr: 80,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    nome: 'Natal',
    estado: 'RN',
    vegetacao: 75,
    energiaSolar: 80,
    densidade: 1400,
    temperatura: 29,
    qualidadeAr: 88,
    color: 'from-purple-500 to-purple-600'
  },
  {
    nome: 'Salvador',
    estado: 'BA',
    vegetacao: 70,
    energiaSolar: 75,
    densidade: 1900,
    temperatura: 31,
    qualidadeAr: 78,
    color: 'from-red-500 to-red-600'
  }
];

const metricas = [
  {
    titulo: 'Índice Verde Médio',
    valor: '72.6%',
    icon: TreePine,
    color: 'text-verde-floresta',
    bg: 'bg-verde-claro/20'
  },
  {
    titulo: 'Energia Solar',
    valor: '75%',
    icon: Sun,
    color: 'text-amarelo-solar',
    bg: 'bg-yellow-100'
  },
  {
    titulo: 'População Total',
    valor: '8.4M',
    icon: Users,
    color: 'text-azul-urbano',
    bg: 'bg-blue-100'
  },
  {
    titulo: 'Temperatura Média',
    valor: '30°C',
    icon: Thermometer,
    color: 'text-red-500',
    bg: 'bg-red-100'
  }
];

export function Dashboard() {
  const { usuario, contribuicoes, relatos } = useApp();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-verde-floresta mb-2">
              Dashboard Sustentabilidade
            </h1>
            <p className="text-gray-600">
              Monitoramento em tempo real das principais cidades do Nordeste
            </p>
          </motion.div>

          {/* Métricas Gerais */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricas.map((metrica, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{metrica.titulo}</p>
                      <p className={`text-2xl font-bold ${metrica.color}`}>{metrica.valor}</p>
                    </div>
                    <div className={`w-12 h-12 ${metrica.bg} rounded-xl flex items-center justify-center`}>
                      <metrica.icon className={`w-6 h-6 ${metrica.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Grid de Cidades */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cidadesData.map((cidade, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-verde-floresta flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {cidade.nome}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {cidade.estado}
                        </Badge>
                      </div>
                      <div className={`w-16 h-16 bg-gradient-to-br ${cidade.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {cidade.nome.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Vegetação */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TreePine className="w-4 h-4 text-verde-floresta" />
                          <span className="text-sm font-medium text-gray-700">Vegetação</span>
                        </div>
                        <span className="text-sm font-bold text-verde-floresta">{cidade.vegetacao}%</span>
                      </div>
                      <Progress value={cidade.vegetacao} className="h-2" />
                    </div>

                    {/* Energia Solar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amarelo-solar" />
                          <span className="text-sm font-medium text-gray-700">Energia Solar</span>
                        </div>
                        <span className="text-sm font-bold text-amarelo-solar">{cidade.energiaSolar}%</span>
                      </div>
                      <Progress value={cidade.energiaSolar} className="h-2" />
                    </div>

                    {/* Qualidade do Ar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-azul-urbano" />
                          <span className="text-sm font-medium text-gray-700">Qualidade do Ar</span>
                        </div>
                        <span className="text-sm font-bold text-azul-urbano">{cidade.qualidadeAr}%</span>
                      </div>
                      <Progress value={cidade.qualidadeAr} className="h-2" />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500">População</p>
                        <p className="font-bold text-gray-700">{cidade.densidade.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Thermometer className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500">Temperatura</p>
                        <p className="font-bold text-gray-700">{cidade.temperatura}°C</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Mapa Interativo Placeholder */}
          <motion.div variants={itemVariants} className="mt-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-verde-floresta">
                  <MapPin className="w-5 h-5" />
                  Mapa Interativo do Nordeste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-verde-claro/20 to-azul-urbano/20 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-verde-floresta mx-auto mb-4" />
                    <p className="text-verde-floresta font-medium">Mapa Interativo</p>
                    <p className="text-gray-600 text-sm">Visualização geográfica dos dados ambientais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}