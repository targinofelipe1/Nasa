import { motion } from "framer-motion";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  MessageSquare, 
  Heart,
  Share,
  MapPin,
  Camera,
  Send,
  ThumbsUp,
  MessageCircle,
  Globe,
  Users,
  TrendingUp,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { toast } from 'sonner';
import { useApp } from '@/app/dash/AppContext';

const relatos = [
  {
    id: 1,
    usuario: 'Maria Silva',
    avatar: 'MS',
    cidade: 'João Pessoa',
    tempo: '2 horas atrás',
    conteudo: 'Incrível ver como o projeto de arborização do Parque Solon de Lucena está transformando a área! As novas árvores já estão criando sombra e atraindo mais pássaros. 🌳🐦',
    imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBwYXJrJTIwdHJlZXM%3D&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    localizacao: 'Parque Solon de Lucena',
    likes: 24,
    comentarios: 8,
    categoria: 'Vegetação'
  },
  {
    id: 2,
    usuario: 'João Santos',
    avatar: 'JS',
    cidade: 'Recife',
    tempo: '5 horas atrás',
    conteudo: 'O sistema de coleta seletiva no bairro está funcionando muito bem! Conseguimos reduzir significativamente o lixo nas ruas. A comunidade está engajada e os resultados são visíveis.',
    imagem: 'https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNpdHklMjBlbnZpcm9ubWVudCUyMHRyZWVzfGVufDF8fHx8MTc1OTYyNjg2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    localizacao: 'Boa Viagem',
    likes: 18,
    comentarios: 5,
    categoria: 'Reciclagem'
  },
  {
    id: 3,
    usuario: 'Ana Costa',
    avatar: 'AC',
    cidade: 'Fortaleza',
    tempo: '1 dia atrás',
    conteudo: 'Instalamos painéis solares no prédio do condomínio e já estamos vendo uma redução de 60% na conta de energia! É impressionante como a energia solar é eficiente aqui no Nordeste. ☀️',
    localizacao: 'Aldeota',
    likes: 31,
    comentarios: 12,
    categoria: 'Energia'
  },
  {
    id: 4,
    usuario: 'Pedro Lima',
    avatar: 'PL',
    cidade: 'Natal',
    tempo: '2 dias atrás',
    conteudo: 'A horta comunitária que começamos no bairro está crescendo! Além de produzir alimentos orgânicos, está unindo a vizinhança em torno de uma causa comum. 🥬🍅',
    imagem: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXJkZW4%3D&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    localizacao: 'Lagoa Nova',
    likes: 27,
    comentarios: 9,
    categoria: 'Agricultura'
  }
];

const estatisticas = [
  {
    titulo: 'Total de Relatos',
    valor: '1,284',
    icone: MessageSquare,
    cor: 'text-azul-urbano'
  },
  {
    titulo: 'Comunidades Ativas',
    valor: '156',
    icone: Users,
    cor: 'text-verde-floresta'
  },
  {
    titulo: 'Engajamento',
    valor: '89%',
    icone: TrendingUp,
    cor: 'text-amarelo-solar'
  },
  {
    titulo: 'Alcance',
    valor: '12.5K',
    icone: Globe,
    cor: 'text-purple-600'
  }
];

const categorias = [
  { nome: 'Vegetação', cor: 'bg-green-100 text-green-700', count: 45 },
  { nome: 'Energia', cor: 'bg-yellow-100 text-yellow-700', count: 32 },
  { nome: 'Reciclagem', cor: 'bg-blue-100 text-blue-700', count: 28 },
  { nome: 'Transporte', cor: 'bg-purple-100 text-purple-700', count: 19 },
  { nome: 'Agricultura', cor: 'bg-orange-100 text-orange-700', count: 15 }
];

export function RelatosPage() {
  const { usuario, relatos, adicionarRelato, adicionarComentario, curtirRelato } = useApp();
  const [novoRelato, setNovoRelato] = useState('');
  const [localizacaoRelato, setLocalizacaoRelato] = useState('');
  const [categoriaRelato, setCategoriaRelato] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [comentarios, setComentarios] = useState<{[key: string]: string}>({});
  const [showComentarios, setShowComentarios] = useState<{[key: string]: boolean}>({});

  const handlePublicarRelato = () => {
    if (!novoRelato.trim()) {
      toast.error('Digite o conteúdo do relato!');
      return;
    }

    adicionarRelato({
      usuario: usuario.nome,
      avatar: usuario.avatar,
      cidade: usuario.cidade,
      conteudo: novoRelato,
      localizacao: localizacaoRelato,
      categoria: categoriaRelato || 'Geral'
    });

    setNovoRelato('');
    setLocalizacaoRelato('');
    setCategoriaRelato('');
    setShowForm(false);

    toast.success('🎉 Relato publicado com sucesso! +5 coins adicionados.');
  };

  const handleAdicionarComentario = (relatoId: string) => {
    const comentarioTexto = comentarios[relatoId];
    if (!comentarioTexto?.trim()) {
      toast.error('Digite um comentário!');
      return;
    }

    adicionarComentario(relatoId, {
      usuario: usuario.nome,
      avatar: usuario.avatar,
      conteudo: comentarioTexto
    });

    setComentarios(prev => ({ ...prev, [relatoId]: '' }));
    toast.success('+2 coins adicionados por comentar!');
  };

  const handleCurtirRelato = (relatoId: string) => {
    curtirRelato(relatoId);
    const relato = relatos.find(r => r.id === relatoId);
    if (relato && !relato.liked) {
      toast.success('+1 coin adicionado por curtir!');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro to-blue-50 p-6">
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
                <h1 className="text-3xl lg:text-4xl font-bold text-azul-urbano mb-2">
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
                  className="bg-azul-urbano hover:bg-blue-800 text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Relato
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                titulo: 'Total de Relatos',
                valor: relatos.length.toString(),
                icone: MessageSquare,
                cor: 'text-azul-urbano'
              },
              {
                titulo: 'Seus Coins',
                valor: usuario.coins.toString(),
                icone: Users,
                cor: 'text-amarelo-solar'
              },
              {
                titulo: 'Engajamento',
                valor: `${Math.floor(Math.random() * 20) + 80}%`,
                icone: TrendingUp,
                cor: 'text-verde-floresta'
              },
              {
                titulo: 'Alcance',
                valor: `${relatos.length * 15}`,
                icone: Globe,
                cor: 'text-purple-600'
              }
            ].map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.titulo}</p>
                      <p className={`text-2xl font-bold ${stat.cor}`}>{stat.valor}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.cor.replace('text-', 'bg-')}/20 rounded-xl flex items-center justify-center`}>
                      <stat.icone className={`w-6 h-6 ${stat.cor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Feed Principal */}
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
              {/* Formulário Novo Relato */}
              {showForm && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-azul-urbano">
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
                      <div className="space-y-2">
                        <Input 
                          value={localizacaoRelato}
                          onChange={(e) => setLocalizacaoRelato(e.target.value)}
                          placeholder="Localização (opcional)" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Input 
                          value={categoriaRelato}
                          onChange={(e) => setCategoriaRelato(e.target.value)}
                          placeholder="Categoria (ex: Vegetação, Energia)" 
                        />
                      </div>
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
                        <Button 
                          variant="outline" 
                          onClick={() => setShowForm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handlePublicarRelato}
                          className="bg-azul-urbano hover:bg-blue-800 text-white flex items-center gap-2"
                          disabled={!novoRelato.trim()}
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
              <div className="space-y-6">
                {relatos.map((relato) => (
                  <motion.div key={relato.id} variants={itemVariants}>
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        {/* Header do Post */}
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-azul-urbano text-white">
                              {relato.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{relato.usuario}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {relato.cidade}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{relato.tempo}</span>
                              {relato.localizacao && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{relato.localizacao}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge className={
                            relato.categoria === 'Vegetação' ? 'bg-green-100 text-green-700' :
                            relato.categoria === 'Energia' ? 'bg-yellow-100 text-yellow-700' :
                            relato.categoria === 'Reciclagem' ? 'bg-blue-100 text-blue-700' :
                            relato.categoria === 'Agricultura' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {relato.categoria}
                          </Badge>
                        </div>

                        {/* Conteúdo */}
                        <p className="text-gray-700 mb-4 leading-relaxed">{relato.conteudo}</p>

                        {/* Imagem */}
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
                                relato.liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${relato.liked ? 'fill-current' : ''}`} />
                              <span>{relato.likes}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowComentarios(prev => ({ ...prev, [relato.id]: !prev[relato.id] }))}
                              className="flex items-center gap-2 text-gray-600 hover:text-azul-urbano"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{relato.comentarios.length}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                              <Share className="w-4 h-4" />
                              <span>Compartilhar</span>
                            </Button>
                          </div>
                        </div>

                        {/* Seção de Comentários */}
                        {showComentarios[relato.id] && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {/* Comentários existentes */}
                            {relato.comentarios.map((comentario) => (
                              <div key={comentario.id} className="flex gap-3 mb-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-azul-urbano text-white text-xs">
                                    {comentario.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{comentario.usuario}</span>
                                    <span className="text-xs text-gray-500">{comentario.tempo}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comentario.conteudo}</p>
                                </div>
                              </div>
                            ))}

                            {/* Adicionar novo comentário */}
                            <div className="flex gap-3 mt-4">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-verde-floresta text-white text-xs">
                                  {usuario.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={comentarios[relato.id] || ''}
                                  onChange={(e) => setComentarios(prev => ({ ...prev, [relato.id]: e.target.value }))}
                                  placeholder="Escreva um comentário..."
                                  className="flex-1"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAdicionarComentario(relato.id);
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => handleAdicionarComentario(relato.id)}
                                  size="sm"
                                  className="bg-azul-urbano hover:bg-blue-800"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Categorias Populares */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-verde-floresta">
                    <TrendingUp className="w-5 h-5" />
                    Categorias Populares
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categorias.map((categoria, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-verde-floresta to-azul-urbano"></div>
                        <span className="font-medium text-gray-700">{categoria.nome}</span>
                      </div>
                      <Badge className={categoria.cor}>
                        {categoria.count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Comunidades Ativas */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-azul-urbano">
                    <Users className="w-5 h-5" />
                    Comunidades Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Eco Recife', 'Verde Fortaleza', 'Sustentável JP', 'Natal Limpa'].map((comunidade, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-verde-floresta to-azul-urbano rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{comunidade.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{comunidade}</h4>
                        <p className="text-sm text-gray-600">{Math.floor(Math.random() * 50) + 20} membros ativos</p>
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