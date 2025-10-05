"use client";

import { motion } from "framer-motion";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  Leaf,
  Star,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from "@/app/dash/AppContext";
import { ImageWithFallback } from "./ImageWithFallback";


const rankingCidadaos = [
  { nome: 'Maria Silva', cidade: 'João Pessoa', contribuicoes: 47, pontos: 2850, nivel: 'Verde Master' },
  { nome: 'João Santos', cidade: 'Recife', contribuicoes: 42, pontos: 2650, nivel: 'Eco Warrior' },
  { nome: 'Ana Costa', cidade: 'Fortaleza', contribuicoes: 38, pontos: 2400, nivel: 'Eco Warrior' },
  { nome: 'Pedro Lima', cidade: 'Natal', contribuicoes: 35, pontos: 2200, nivel: 'Verde Expert' },
  { nome: 'Carla Rocha', cidade: 'Salvador', contribuicoes: 32, pontos: 2050, nivel: 'Verde Expert' }
];

const contribuicoesRecentes = [
  {
    usuario: 'Maria S.',
    cidade: 'João Pessoa',
    tipo: 'Plantio de Árvores',
    data: '2 horas atrás',
    valor: '+50 pontos'
  },
  {
    usuario: 'João S.',
    cidade: 'Recife',
    tipo: 'Coleta Seletiva',
    data: '4 horas atrás',
    valor: '+30 pontos'
  },
  {
    usuario: 'Ana C.',
    cidade: 'Fortaleza',
    tipo: 'Energia Solar',
    data: '6 horas atrás',
    valor: '+40 pontos'
  }
];

const estatisticasGerais = [
  {
    titulo: 'Total de Contribuições',
    valor: '2,847',
    icone: Upload,
    cor: 'text-verde-floresta',
    bg: 'bg-verde-claro/20'
  },
  {
    titulo: 'Árvores Plantadas',
    valor: '1,247',
    icone: TreePine,
    cor: 'text-green-600',
    bg: 'bg-green-100'
  },
  {
    titulo: 'Cidadãos Ativos',
    valor: '456',
    icone: Users,
    cor: 'text-azul-urbano',
    bg: 'bg-blue-100'
  },
  {
    titulo: 'Impacto CO²',
    valor: '12.5t',
    icone: Target,
    cor: 'text-amarelo-solar',
    bg: 'bg-yellow-100'
  }
];

export function ContribuicoesPage() {
  const { usuario, contribuicoes, adicionarContribuicao } = useApp();
  const [tipoContribuicao, setTipoContribuicao] = useState('');
  const [cidade, setCidade] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmitContribuicao = () => {
    if (!tipoContribuicao || !cidade || !descricao || !quantidade) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const tipoTexto = {
      'plantio': '🌱 Plantio de Árvores',
      'coleta': '♻️ Coleta Seletiva',
      'energia': '☀️ Energia Solar',
      'agua': '💧 Conservação de Água',
      'transporte': '🚲 Transporte Sustentável',
      'educacao': '📚 Educação Ambiental'
    }[tipoContribuicao] || tipoContribuicao;

    adicionarContribuicao({
      usuario: usuario.nome,
      cidade,
      tipo: tipoTexto,
      localizacao,
      descricao,
      quantidade
    });

    // Limpar formulário
    setTipoContribuicao('');
    setCidade('');
    setLocalizacao('');
    setDescricao('');
    setQuantidade('');
    setShowForm(false);

    toast.success('🎉 Contribuição adicionada com sucesso! Coins adicionados à sua conta.');
  };

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
                  Painel de Contribuições
                </h1>
                <p className="text-gray-600">
                  Contribua com dados ambientais e ajude a tornar sua cidade mais sustentável
                </p>
              </div>
              
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-verde-floresta hover:bg-green-800 text-white flex items-center gap-2"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Nova Contribuição
              </Button>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                titulo: 'Total de Contribuições',
                valor: contribuicoes.length.toString(),
                icone: Upload,
                cor: 'text-verde-floresta',
                bg: 'bg-verde-claro/20'
              },
              {
                titulo: 'Suas Contribuições',
                valor: usuario.contribuicoes.toString(),
                icone: TreePine,
                cor: 'text-green-600',
                bg: 'bg-green-100'
              },
              {
                titulo: 'Seus Coins',
                valor: usuario.coins.toString(),
                icone: Star,
                cor: 'text-amarelo-solar',
                bg: 'bg-yellow-100'
              },
              {
                titulo: 'Pontos Totais',
                valor: usuario.pontos.toString(),
                icone: Target,
                cor: 'text-azul-urbano',
                bg: 'bg-blue-100'
              }
            ].map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.titulo}</p>
                      <p className={`text-2xl font-bold ${stat.cor}`}>{stat.valor}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                      <stat.icone className={`w-6 h-6 ${stat.cor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulário de Contribuição */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              {showForm && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-verde-floresta">
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
                      <Label htmlFor="localizacao">Localização</Label>
                      <Input 
                        id="localizacao" 
                        value={localizacao}
                        onChange={(e) => setLocalizacao(e.target.value)}
                        placeholder="Endereço ou coordenadas GPS (opcional)"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição da Atividade *</Label>
                      <Textarea 
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva sua contribuição ambiental em detalhes..."
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
                        <Label htmlFor="foto">Foto da Atividade</Label>
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
                        className="bg-verde-floresta hover:bg-green-800 text-white flex items-center gap-2 flex-1"
                      >
                        <Send className="w-4 h-4" />
                        Enviar Contribuição
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        className="px-8"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mapa de Calor */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-verde-floresta">
                    <MapPin className="w-5 h-5" />
                    Mapa de Contribuições por Região
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gradient-to-br from-verde-claro/30 to-azul-urbano/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNpdHklMjBlbnZpcm9ubWVudCUyMHRyZWVzfGVufDF8fHx8MTc1OTYyNjg2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="Mapa de contribuições ambientais"
                      className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white/90 p-6 rounded-xl">
                        <MapPin className="w-12 h-12 text-verde-floresta mx-auto mb-4" />
                        <h3 className="font-bold text-verde-floresta mb-2">Mapa Interativo</h3>
                        <p className="text-gray-600 text-sm">Visualização das contribuições por localização</p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="text-center">
                            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-1"></div>
                            <p className="text-xs text-gray-600">Alta atividade</p>
                          </div>
                          <div className="text-center">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                            <p className="text-xs text-gray-600">Média atividade</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Ranking Cidadãos Verdes */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-verde-floresta">
                    <Award className="w-5 h-5" />
                    Ranking Cidadãos Verdes 🌿
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rankingCidadaos.map((cidadao, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-verde-floresta text-white">
                            {cidadao.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amarelo-solar rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-verde-floresta">{cidadao.nome}</h4>
                        <p className="text-xs text-gray-600">{cidadao.cidade}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {cidadao.nivel}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-verde-floresta">{cidadao.pontos}</p>
                        <p className="text-xs text-gray-600">{cidadao.contribuicoes} contrib.</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contribuições Recentes */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-azul-urbano">
                    <TrendingUp className="w-5 h-5" />
                    Suas Contribuições Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contribuicoes.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma contribuição ainda.</p>
                      <p className="text-sm">Adicione sua primeira contribuição!</p>
                    </div>
                  ) : (
                    contribuicoes.slice(0, 5).map((contrib, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{contrib.usuario}</h4>
                          <p className="text-sm text-gray-600">{contrib.tipo}</p>
                          <p className="text-xs text-gray-500">
                            {contrib.cidade} • {contrib.data.toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{contrib.quantidade}</p>
                        </div>
                        <Badge className="bg-verde-claro/20 text-verde-floresta">
                          +{contrib.pontos} pts
                        </Badge>
                      </div>
                    ))
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