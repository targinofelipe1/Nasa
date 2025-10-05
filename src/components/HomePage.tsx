import { motion } from "framer-motion";
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  TreePine, 
  Users, 
  Upload,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Globe,
  Zap
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface HomePageProps {
  onPageChange: (page: string) => void;
}

export function HomePage({ onPageChange }: HomePageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bege-neutro via-green-50 to-blue-50">
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
                  className="inline-flex items-center space-x-2 bg-verde-claro/20 px-4 py-2 rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <Globe className="w-5 h-5 text-verde-floresta" />
                  <span className="text-verde-floresta font-medium">Sustentabilidade em Ação</span>
                </motion.div>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-verde-floresta leading-tight">
                  Transformando dados e pessoas em{' '}
                  <span className="text-azul-urbano">ações</span> para cidades mais{' '}
                  <span className="text-green-600">sustentáveis</span>
                </h1>
                
                <p className="text-lg text-gray-700 leading-relaxed">
                  A plataforma Cidades Vivas integra dados sobre clima, vegetação e população 
                  para apoiar políticas públicas, negócios e comunidades conscientes.
                </p>
              </div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                variants={itemVariants}
              >
                <Button 
                  onClick={() => onPageChange('dashboard')}
                  className="bg-verde-floresta hover:bg-green-800 text-white px-8 py-3 rounded-xl flex items-center space-x-2 group"
                  size="lg"
                >
                  <span>Explorar Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={() => onPageChange('contribuicoes')}
                  variant="outline"
                  className="border-verde-floresta text-verde-floresta hover:bg-verde-claro/20 px-8 py-3 rounded-xl"
                  size="lg"
                >
                  Contribuir Agora
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div 
              variants={itemVariants}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1753199694052-2d6f8a6aa274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNpdHklMjBlbnZpcm9ubWVudCUyMHRyZWVzfGVufDF8fHx8MTc1OTYyNjg2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Cidade sustentável com vegetação urbana"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-verde-floresta/20 to-transparent" />
              </div>
              
              {/* Floating Stats */}
              <motion.div 
                className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-verde-claro rounded-lg flex items-center justify-center">
                    <TreePine className="w-6 h-6 text-verde-floresta" />
                  </div>
                  <div>
                    <p className="font-bold text-verde-floresta text-xl">1,247</p>
                    <p className="text-sm text-gray-600">Árvores Plantadas</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-verde-claro/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-azul-urbano/20 rounded-full blur-3xl" />
      </motion.section>

      {/* Action Cards Section */}
      <motion.section 
        className="py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-verde-floresta mb-4">
              Faça Parte da Mudança
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Cada ação conta para construir cidades mais verdes e sustentáveis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 - Contribua com Dados */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-verde-claro to-green-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                    onClick={() => onPageChange('contribuicoes')}>
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-verde-floresta rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TreePine className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-6 h-6 text-amarelo-solar" />
                    </motion.div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-verde-floresta mb-3">
                    Contribua com Dados 🌱
                  </h3>
                  <p className="text-verde-floresta/80 mb-6 leading-relaxed">
                    A cada dado inserido, uma árvore é plantada. Sua contribuição ajuda 
                    a mapear e melhorar a sustentabilidade das nossas cidades.
                  </p>
                  
                  <Button className="bg-verde-floresta hover:bg-green-800 text-white rounded-lg group-hover:bg-green-800 transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Inserir Dados
                  </Button>
                </CardContent>
                
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-verde-floresta/10 rounded-full" />
              </Card>
            </motion.div>

            {/* Card 2 - Relatos da Comunidade */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-azul-urbano/20 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                    onClick={() => onPageChange('relatos')}>
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-azul-urbano rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      <Zap className="w-6 h-6 text-amarelo-solar" />
                    </motion.div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-azul-urbano mb-3">
                    Relatos da Comunidade 💬
                  </h3>
                  <p className="text-azul-urbano/80 mb-6 leading-relaxed">
                    Compartilhe sua visão e experiências sobre sustentabilidade urbana. 
                    Conecte-se com outros cidadãos engajados.
                  </p>
                  
                  <Button className="bg-azul-urbano hover:bg-blue-800 text-white rounded-lg group-hover:bg-blue-800 transition-colors">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Compartilhe sua visão
                  </Button>
                </CardContent>
                
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-azul-urbano/10 rounded-full" />
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-20 px-6 bg-white/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-verde-floresta mb-4">
              Monitoramento Inteligente
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Acompanhe em tempo real os indicadores de sustentabilidade das principais cidades do Nordeste
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: TreePine, label: 'Vegetação Urbana', value: '85%', color: 'verde-floresta' },
              { icon: Users, label: 'Engajamento', value: '1.2K', color: 'azul-urbano' },
              { icon: Zap, label: 'soLO', value: '67%'},
              { icon: Globe, label: 'Cidades Ativas', value: '5', color: 'verde-claro' }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className={`w-16 h-16 bg-${item.color}/20 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-8 h-8 text-${item.color}`} />
                </div>
                <h3 className={`text-2xl font-bold text-${item.color} mb-2`}>{item.value}</h3>
                <p className="text-gray-600">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}