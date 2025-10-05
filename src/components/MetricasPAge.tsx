import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  TreePine, 
  Sun, 
  Building, 
  Cloud,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const dadosVegetacao = [
  { mes: 'Jan', joaoPessoa: 75, recife: 70, fortaleza: 65, natal: 72, salvador: 68 },
  { mes: 'Fev', joaoPessoa: 76, recife: 71, fortaleza: 66, natal: 73, salvador: 69 },
  { mes: 'Mar', joaoPessoa: 77, recife: 72, fortaleza: 67, natal: 74, salvador: 70 },
  { mes: 'Abr', joaoPessoa: 78, recife: 72, fortaleza: 68, natal: 75, salvador: 70 },
  { mes: 'Mai', joaoPessoa: 78, recife: 72, fortaleza: 68, natal: 75, salvador: 70 },
  { mes: 'Jun', joaoPessoa: 78, recife: 72, fortaleza: 68, natal: 75, salvador: 70 }
];

const dadosEnergia = [
  { cidade: 'Fortaleza', valor: 85, cor: '#FFC107' },
  { cidade: 'Natal', valor: 80, cor: '#2E7D32' },
  { cidade: 'Salvador', valor: 75, cor: '#0277BD' },
  { cidade: 'Recife', valor: 70, cor: '#A5D6A7' },
  { cidade: 'João Pessoa', valor: 65, cor: '#E0E0E0' }
];

const dadosUrbanizacao = [
  { categoria: 'Área Verde', valor: 35, cor: '#2E7D32' },
  { categoria: 'Residencial', valor: 40, cor: '#A5D6A7' },
  { categoria: 'Comercial', valor: 15, cor: '#0277BD' },
  { categoria: 'Industrial', valor: 10, cor: '#FFC107' }
];

const metricas = [
  {
    titulo: 'Cobertura Vegetal',
    valor: '72.6%',
    variacao: '+2.3%',
    tendencia: 'up',
    icon: TreePine,
    color: 'text-verde-floresta',
    bg: 'bg-verde-claro/20'
  },
  {
    titulo: 'Energia Renovável',
    valor: '75%',
    variacao: '+5.1%',
    tendencia: 'up',
    icon: Sun,
    color: 'text-amarelo-solar',
    bg: 'bg-yellow-100'
  },
  {
    titulo: 'Densidade Urbana',
    valor: '1.68k/km²',
    variacao: '+1.2%',
    tendencia: 'up',
    icon: Building,
    color: 'text-azul-urbano',
    bg: 'bg-blue-100'
  },
  {
    titulo: 'Qualidade do Ar',
    valor: '81%',
    variacao: '-0.8%',
    tendencia: 'down',
    icon: Cloud,
    color: 'text-gray-600',
    bg: 'bg-gray-100'
  }
];

export function MetricasPage() {
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-verde-floresta mb-2">
                  Métricas Detalhadas
                </h1>
                <p className="text-gray-600">
                  Análise comparativa e tendências das cidades sustentáveis
                </p>
              </div>
              
              <div className="flex gap-2">
                <Select defaultValue="2024">
                  <SelectTrigger className="w-32">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Métricas Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricas.map((metrica, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${metrica.bg} rounded-xl flex items-center justify-center`}>
                      <metrica.icon className={`w-6 h-6 ${metrica.color}`} />
                    </div>
                    <Badge variant={metrica.tendencia === 'up' ? 'default' : 'destructive'} className="flex items-center gap-1">
                      {metrica.tendencia === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {metrica.variacao}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{metrica.titulo}</h3>
                  <p className={`text-2xl font-bold ${metrica.color}`}>{metrica.valor}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Gráficos */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="vegetacao" className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-white/50">
                <TabsTrigger value="vegetacao" className="flex items-center gap-2">
                  <TreePine className="w-4 h-4" />
                  Vegetação
                </TabsTrigger>
                <TabsTrigger value="energia" className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Energia
                </TabsTrigger>
                <TabsTrigger value="urbanizacao" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Urbanização
                </TabsTrigger>
                <TabsTrigger value="clima" className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Clima
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vegetacao">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-verde-floresta">
                      <TreePine className="w-5 h-5" />
                      Evolução da Cobertura Vegetal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosVegetacao}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="joaoPessoa" stroke="#2E7D32" strokeWidth={3} name="João Pessoa" />
                          <Line type="monotone" dataKey="recife" stroke="#0277BD" strokeWidth={3} name="Recife" />
                          <Line type="monotone" dataKey="fortaleza" stroke="#FFC107" strokeWidth={3} name="Fortaleza" />
                          <Line type="monotone" dataKey="natal" stroke="#A5D6A7" strokeWidth={3} name="Natal" />
                          <Line type="monotone" dataKey="salvador" stroke="#E0E0E0" strokeWidth={3} name="Salvador" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="energia">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amarelo-solar">
                      <Sun className="w-5 h-5" />
                      Adoção de Energia Solar por Cidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosEnergia}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="cidade" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#FFC107" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="urbanizacao">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-azul-urbano">
                      <Building className="w-5 h-5" />
                      Distribuição do Uso do Solo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosUrbanizacao}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="valor"
                            label={({ categoria, valor }) => `${categoria}: ${valor}%`}
                          >
                            {dadosUrbanizacao.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.cor} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clima">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-600">
                      <Cloud className="w-5 h-5" />
                      Indicadores Climáticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-xl">
                        <Cloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="font-bold text-blue-600 mb-2">Qualidade do Ar</h3>
                        <p className="text-2xl font-bold text-blue-500">81%</p>
                        <p className="text-sm text-gray-600">Média regional</p>
                      </div>
                      <div className="text-center p-6 bg-yellow-50 rounded-xl">
                        <Sun className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="font-bold text-yellow-600 mb-2">Radiação Solar</h3>
                        <p className="text-2xl font-bold text-yellow-500">6.2 kWh/m²</p>
                        <p className="text-sm text-gray-600">Diário médio</p>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-xl">
                        <TreePine className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-bold text-green-600 mb-2">Umidade</h3>
                        <p className="text-2xl font-bold text-green-500">75%</p>
                        <p className="text-sm text-gray-600">Relativa média</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}