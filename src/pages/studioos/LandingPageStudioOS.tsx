import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import { WhatsAppCTA } from '@/components/marketing/WhatsAppCTA';
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Sparkles,
  Workflow,
  Calculator,
  DollarSign,
  Truck,
  FileText,
  Calendar,
  Settings,
  Rocket,
  ChevronRight,
  X,
  Play,
  ArrowDown,
  Target,
  Gauge,
  Check,
  XCircle,
  Laptop,
  Smartphone,
  Tablet,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Percent,
  Ruler,
  Package,
  TrendingDown,
  Award,
  Heart,
  Building2,
  Store,
  Palette,
  Home,
  Hammer,
  Scissors,
  FileCheck,
  Receipt,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Animated Section Wrapper
const AnimatedSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated Card
const AnimatedCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Mockup Component
const MockupFrame = ({ children, device = 'desktop', label }: { children: React.ReactNode; device?: 'desktop' | 'mobile' | 'tablet'; label?: string }) => {
  const frame = device === 'mobile' ? (
    <div className="relative mx-auto w-64">
      <div className="relative rounded-[2.5rem] border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 p-2 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl"></div>
        <div className="rounded-[1.5rem] overflow-hidden bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  ) : device === 'tablet' ? (
    <div className="relative mx-auto w-96">
      <div className="relative rounded-2xl border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 p-3 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-xl"></div>
        <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  ) : (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative rounded-lg border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 p-2 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-xl"></div>
        <div className="rounded-md overflow-hidden bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {frame}
      {label && (
        <p className="text-center mt-4 text-sm font-medium text-muted-foreground">
          {label}
        </p>
      )}
    </div>
  );
};

// What Changes Section Component
const WhatChangesSection = () => {
  const beforeItems = [
    'Trabalha em cima de várias planilhas diferentes',
    'Erros de medida e cálculo são comuns',
    'Preços desatualizados dos fornecedores',
    'Esquece follow-up com cliente',
    'Orçamentos demoram para sair'
  ];

  const afterItems = [
    'Orçamentos criados automaticamente',
    'Financeiro conectado direto aos pedidos',
    'Tabelas de preços atualizadas dentro do sistema',
    'Produção organizada em Kanban',
    'Instalações agendadas automaticamente'
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Antes */}
      <Card className="border-2 border-destructive/20 dark:border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Antes do StudioOS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {beforeItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Depois */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Depois do StudioOS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {afterItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Footer Text */}
      <div className="md:col-span-2 text-center mt-4">
        <p className="text-lg font-medium text-muted-foreground">
          Sem planilhas, sem retrabalho, sem medo de errar orçamento.
        </p>
      </div>
    </div>
  );
};

const plans = [
  {
    name: 'Starter',
    price: 'R$ 499',
    period: '/mês',
    description: 'Ideal para começar',
    users: 3,
    orcamentos: '100/mês',
    features: [
      'Cálculos automáticos de orçamentos',
      'CRM básico para gerenciar clientes',
      'Calendário de instalações',
      'Produção organizada (Kanban)',
      'Dashboard com informações principais',
      'Suporte por email',
      'Backup automático diário'
    ],
    popular: false,
    cta: 'Começar agora'
  },
  {
    name: 'Profissional',
    price: 'R$ 899',
    period: '/mês',
    description: 'Para empresas em crescimento',
    users: 10,
    orcamentos: '500/mês',
    features: [
      'Tudo do Starter',
      'Financeiro que funciona quase sozinho',
      'CRM avançado com follow-ups automáticos',
      'Relatórios detalhados em tempo real',
      'Integração com fornecedores',
      'Suporte prioritário',
      'Treinamento incluído'
    ],
    popular: true,
    cta: 'Mais Popular'
  },
  {
    name: 'Business',
    price: 'R$ 1.499',
    period: '/mês',
    description: 'Para empresas estabelecidas',
    users: 25,
    orcamentos: 'Ilimitado',
    features: [
      'Tudo do Profissional',
      'Emissão de NF-e integrada',
      'Múltiplos depósitos',
      'Relatórios avançados',
      'API para integrações',
      'Suporte dedicado',
      'Onboarding personalizado'
    ],
    popular: false,
    cta: 'Falar com vendas'
  },
  {
    name: 'Enterprise',
    price: 'R$ 2.499',
    period: '/mês',
    description: 'Solução completa',
    users: 50,
    orcamentos: 'Ilimitado',
    features: [
      'Tudo do Business',
      'WhatsApp integrado',
      'API completa',
      'Customizações exclusivas',
      'Múltiplas empresas',
      'Suporte 24/7',
      'Gerente de conta dedicado'
    ],
    popular: false,
    cta: 'Falar com vendas'
  }
];

const coreBenefits = [
  {
    icon: Calculator,
    title: 'Cálculos Automáticos',
    description: 'O sistema calcula tudo por você: tecidos, trilhos, forros, metragens, consumo e preço. Sem erro humano, sem retrabalho.',
    color: 'text-blue-500',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    iconSize: 'h-16 w-16'
  },
  {
    icon: DollarSign,
    title: 'Financeiro Semi-Autônomo',
    description: 'Quando você aprova um orçamento, o sistema cria as contas a receber sozinho. Custos viram contas a pagar automaticamente.',
    color: 'text-green-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    iconSize: 'h-16 w-16'
  },
  {
    icon: Truck,
    title: 'Integração com Fornecedores',
    description: 'Atualize tabelas de preços direto no sistema. Sem planilha, sem digitação manual. Preços sempre atualizados.',
    color: 'text-purple-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    iconSize: 'h-16 w-16'
  }
];

const targetAudienceSegments = [
  {
    name: 'Lojas',
    items: [
      { icon: Store, label: 'Lojas de cortinas' },
      { icon: Package, label: 'Lojas de persianas' },
      { icon: Home, label: 'Lojas de papel de parede' },
      { icon: Heart, label: 'Lojas de tecidos / enxoval' }
    ]
  },
  {
    name: 'Profissionais',
    items: [
      { icon: Palette, label: 'Decoradores' },
      { icon: Building2, label: 'Arquitetos que vendem cortinas' },
      { icon: Users, label: 'Designers de interiores' },
      { icon: Hammer, label: 'Empresas de instalação e montagem' }
    ]
  },
  {
    name: 'Indústria / B2B',
    items: [
      { icon: Settings, label: 'Fabricantes' },
      { icon: Truck, label: 'Atacadistas / distribuidores' },
      { icon: Package, label: 'Confecções de cortinas e persianas' },
      { icon: Settings, label: 'Fornecedores de trilhos e acessórios' }
    ]
  }
];

const savings = [
  { metric: '70%', label: 'menos tempo criando orçamentos', icon: Clock, color: 'text-blue-500' },
  { metric: '90%', label: 'menos retrabalho', icon: TrendingDown, color: 'text-green-500' },
  { metric: '100%', label: 'menos planilhas', icon: FileText, color: 'text-purple-500' },
  { metric: '50%', label: 'menos erros de medição', icon: Target, color: 'text-orange-500' },
  { metric: '30%', label: 'mais conversão (follow-up automático)', icon: TrendingUp, color: 'text-pink-500' }
];

const processSteps = [
  {
    step: 1,
    title: 'Cliente entra pela página',
    description: 'Lead cai automaticamente no CRM, com todos os dados organizados.',
    icon: Sparkles
  },
  {
    step: 2,
    title: 'Orçamento criado sozinho',
    description: 'Você só coloca as medidas — o sistema calcula tecidos, trilhos e preços automático.',
    icon: Calculator
  },
  {
    step: 3,
    title: 'Financeiro conectado',
    description: 'Orçamento aprovado vira contas a receber e custos, tudo criado automaticamente.',
    icon: DollarSign
  },
  {
    step: 4,
    title: 'Produção e instalação automáticas',
    description: 'Kanban, lista de materiais e calendário são atualizados em tempo real, sem digitar nada.',
    icon: Settings
  }
];

const calculationExamples = [
  {
    input: 'Medidas da janela',
    output: 'Metragem de tecido calculada',
    icon: Ruler
  },
  {
    input: 'Tipo de cortina escolhido',
    output: 'Trilho ideal sugerido',
    icon: Package
  },
  {
    input: 'Tecido selecionado',
    output: 'Consumo de forro calculado',
    icon: Scissors
  },
  {
    input: 'Custos informados',
    output: 'Preço final com markup',
    icon: Percent
  },
  {
    input: 'Tudo aprovado',
    output: 'PDF profissional gerado',
    icon: FileCheck
  }
];

const competitorFeatures = [
  { feature: 'Cálculo automático cortinas/persianas', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Cria orçamento sozinho', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Recebe preços de fornecedores', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Atualização automática de custos/preços', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Kanban de produção visual', studioos: true, uau: true, millenium: false, bling: false },
  { feature: 'Lista de materiais gerada automaticamente', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Instalação agendada automaticamente', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Financeiro semi-automático', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Score de conciliação bancária', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Site de captação incluso', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'WhatsApp integrado', studioos: true, uau: false, millenium: false, bling: false },
  { feature: 'Multiempresa', studioos: true, uau: false, millenium: true, bling: true },
  { feature: 'NF-e integrada', studioos: true, uau: false, millenium: false, bling: false }
];

const onboardingSteps = [
  { step: 'Nome da empresa', icon: Building2 },
  { step: 'Endereço', icon: MapPin },
  { step: 'Logotipo', icon: FileText },
  { step: 'Margem/Markup', icon: Percent },
  { step: 'Lista de fornecedores (opcional)', icon: Truck }
];

const onboardingDeliverables = [
  'Página de captura',
  'CRM funcionando',
  'Cálculos configurados',
  'Financeiro automatizado',
  'Produção/Kanban',
  'Instalação conectada',
  'E-mails automáticos'
];

const workflowSteps = [
  {
    step: 1,
    title: 'Cliente entra pela sua página',
    description: 'Formulário na sua landing page cria o cliente automaticamente no sistema',
    icon: Sparkles
  },
  {
    step: 2,
    title: 'Vai direto para o CRM',
    description: 'Cliente aparece no CRM pronto para você acompanhar',
    icon: Target
  },
  {
    step: 3,
    title: 'Sistema cria orçamento automático',
    description: 'Você só informa as medidas. O sistema calcula tudo: tecidos, trilhos, preços',
    icon: Calculator
  },
  {
    step: 4,
    title: 'Orçamento aprovado gera contas',
    description: 'Sistema cria contas a receber automaticamente no financeiro',
    icon: DollarSign
  },
  {
    step: 5,
    title: 'Vai para produção',
    description: 'Pedido aprovado aparece no Kanban de produção automaticamente',
    icon: Settings
  },
  {
    step: 6,
    title: 'Instalação agendada',
    description: 'Quando produção termina, sistema agenda instalação no calendário',
    icon: Calendar
  }
];

const modules = [
  {
    name: 'CRM',
    description: 'Gerencie seus clientes sem complicação',
    features: [
      'Clientes entram automaticamente da sua página',
      'Veja todo histórico de conversas',
      'Sistema lembra você de fazer follow-up',
      'Pipeline visual de vendas'
    ],
    icon: Users,
    mockup: 'crm'
  },
  {
    name: 'Orçamentos',
    description: 'Crie orçamentos rápidos e sem erro',
    features: [
      'Sistema calcula tudo automaticamente',
      'Metragens e consumo calculados sozinhos',
      'Preços sempre atualizados',
      'PDF profissional em segundos'
    ],
    icon: FileText,
    mockup: 'orcamento'
  },
  {
    name: 'Produção',
    description: 'Organize sua produção visualmente',
    features: [
      'Kanban visual fácil de entender',
      'Itens criados automaticamente',
      'Lista de materiais gerada sozinha',
      'Acompanhe cada etapa da produção'
    ],
    icon: Settings,
    mockup: 'producao'
  },
  {
    name: 'Instalação',
    description: 'Agende instalações sem confusão',
    features: [
      'Calendário visual de instalações',
      'Integração automática com produção',
      'Status atualizado sozinho',
      'Notificações para o cliente'
    ],
    icon: Calendar,
    mockup: 'instalacao'
  },
  {
    name: 'Financeiro',
    description: 'Contas que se criam sozinhas',
    features: [
      'Contas geradas automaticamente',
      'Sincronizado com orçamentos',
      'Relatórios em tempo real',
      'Conciliação bancária'
    ],
    icon: DollarSign,
    mockup: 'financeiro'
  },
  {
    name: 'Fornecedores',
    description: 'Fornecedores integrados ao sistema',
    features: [
      'Cadastro de fornecedores',
      'Importe tabelas de preços',
      'Atualização automática de custos',
      'Histórico de compras'
    ],
    icon: Truck,
    mockup: 'fornecedores'
  }
];

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Dona da Cortinas Premium',
    company: 'Cortinas Premium',
    city: 'São Paulo, SP',
    content: 'O StudioOS mudou minha vida. Antes eu passava horas fazendo orçamentos. Agora o sistema calcula tudo sozinho e eu só preciso conferir. Economizei 70% do meu tempo.',
    rating: 5,
    photo: null
  },
  {
    name: 'João Santos',
    role: 'Proprietário',
    company: 'Persianas SC',
    city: 'Florianópolis, SC',
    content: 'A melhor parte é que quando aprovo um orçamento, tudo acontece sozinho. Contas criadas, produção iniciada, tudo automático. Não preciso ficar digitando nada.',
    rating: 5,
    photo: null
  },
  {
    name: 'Ana Costa',
    role: 'Gerente',
    company: 'Decoração & Estilo',
    city: 'Rio de Janeiro, RJ',
    content: 'A integração com fornecedores é incrível. Não preciso mais ficar atualizando planilha. Importo a tabela de preços e pronto, tudo atualizado no sistema.',
    rating: 5,
    photo: null
  }
];

const faqs = [
  {
    question: 'Os cálculos são realmente automáticos?',
    answer: 'Sim! Você só precisa informar as medidas da janela e escolher os materiais. O sistema calcula automaticamente tecidos, trilhos, forros, metragens, consumo e preço final. Sem erro humano, sem retrabalho.'
  },
  {
    question: 'Em quanto tempo posso começar a usar?',
    answer: 'Menos de 1 hora! Configuramos sua conta, importamos seus clientes e materiais, e você já pode começar a usar. Sem complicação, sem treinamento longo.'
  },
  {
    question: 'Vocês ajudam na migração dos meus dados?',
    answer: 'Sim! Nossa equipe ajuda você a importar clientes, materiais e histórico via planilha. Fazemos isso junto com você para garantir que nada se perca.'
  },
  {
    question: 'Como funciona o financeiro semi-autônomo?',
    answer: 'Quando você aprova um orçamento, o sistema cria automaticamente as contas a receber. Quando você registra um custo, vira conta a pagar. Tudo sincronizado, você só precisa conferir e aprovar.'
  },
  {
    question: 'Preciso atualizar preços manualmente?',
    answer: 'Não! Com a integração de fornecedores, você importa a tabela de preços e o sistema atualiza tudo automaticamente. Sem planilha, sem trabalho manual.'
  },
  {
    question: 'O que acontece se eu precisar de mais usuários?',
    answer: 'Você pode adicionar usuários extras a qualquer momento por R$ 69,90/mês cada. Ou faça upgrade para um plano superior quando fizer sentido.'
  },
  {
    question: 'Há limite de orçamentos?',
    answer: 'Starter: 100/mês, Profissional: 500/mês, Business e Enterprise: ilimitado. Você pode fazer upgrade a qualquer momento sem perder dados.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim! Usamos criptografia de ponta a ponta, backup automático diário e cada empresa tem seus dados isolados. Seus dados estão protegidos.'
  }
];

const trustBadges = [
  { icon: Shield, text: 'Sem fidelidade' },
  { icon: Users, text: 'Suporte humano' },
  { icon: Award, text: 'Treinamento incluso' },
  { icon: Clock, text: 'Onboarding em 1 hora' }
];

export default function LandingPageStudioOS() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Integrar com API/CRM quando estiver pronto
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Obrigado pelo interesse! Entraremos em contato em breve.');
      setEmail('');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background antialiased">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              StudioOS
            </span>
          </motion.div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#beneficios" className="text-sm hover:text-primary transition-colors">Benefícios</a>
            <a href="#como-funciona" className="text-sm hover:text-primary transition-colors">Como Funciona</a>
            <a href="#planos" className="text-sm hover:text-primary transition-colors">Planos</a>
            <a href="#faq" className="text-sm hover:text-primary transition-colors">FAQ</a>
            <ThemeToggle />
            <WhatsAppCTA size="sm" variant="outline" className="hidden lg:flex">
              WhatsApp
            </WhatsAppCTA>
            <Button 
              onClick={() => {
                const formSection = document.getElementById('contato');
                formSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Começar Agora
            </Button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - CORRIGIDO */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 py-20 md:py-32 px-4">
        {/* Background Effects */}
        <motion.div 
          style={{ opacity, y }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_50%)]"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-20" />
        
        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  O ERP que faz o trabalho pesado por você
                </Badge>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                <span className="text-foreground">O sistema que faz orçamentos e financeiro sozinho para sua loja de</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  cortinas, persianas e decoração
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
              >
                Cálculos automáticos, orçamentos instantâneos, financeiro conectado e fornecedores integrados — tudo sem planilhas.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
              >
                <Button 
                  size="lg" 
                  className="text-lg px-8 h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                  onClick={() => {
                    const formSection = document.getElementById('contato');
                    formSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Solicitar Demonstração
                </Button>
                <WhatsAppCTA size="lg" className="h-14 text-lg px-8">
                  Fale no WhatsApp
                </WhatsAppCTA>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 h-14 border-2 hover:bg-accent/10" 
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Como Funciona
                </Button>
              </motion.div>
              
              {/* Trust Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4"
              >
                {trustBadges.map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{badge.text}</span>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Right: Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <MockupFrame device="desktop" label="Imagem real do StudioOS - CRM">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <Laptop className="h-16 w-16 mx-auto text-primary/50" />
                    <p className="text-sm text-muted-foreground font-medium">Screenshot real do sistema em breve</p>
                    <p className="text-xs text-muted-foreground">Tela do CRM com leads entrando automaticamente</p>
                  </div>
                </div>
              </MockupFrame>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seção: Para quem é o StudioOS */}
      <AnimatedSection className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4" variant="outline">Público</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Para quem o StudioOS foi criado?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sistema feito especialmente para empresas de decoração
            </p>
          </motion.div>

          <Tabs defaultValue="lojas" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              {targetAudienceSegments.map((segment) => (
                <TabsTrigger key={segment.name} value={segment.name.toLowerCase().replace(/\s+\/\s+/g, '-')}>
                  {segment.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {targetAudienceSegments.map((segment) => (
              <TabsContent key={segment.name} value={segment.name.toLowerCase().replace(/\s+\/\s+/g, '-')}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {segment.items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <AnimatedCard key={index} delay={index * 0.05}>
                        <Card className="border-2 hover:border-primary/50 transition-all text-center h-full">
                          <CardContent className="pt-6">
                            <Icon className="h-12 w-12 mx-auto mb-3 text-primary" />
                            <p className="text-sm font-medium">{item.label}</p>
                          </CardContent>
                        </Card>
                      </AnimatedCard>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AnimatedSection>

      {/* Core Benefits Section */}
      <AnimatedSection id="beneficios" className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Benefícios</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Por que o StudioOS trabalha sozinho?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Três pilares que transformam sua gestão
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {coreBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card className={`border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br ${benefit.bgGradient} h-full`}>
                      <CardHeader>
                        <motion.div 
                          className={`${benefit.color} mb-4`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <Icon className={benefit.iconSize} />
                        </motion.div>
                        <CardTitle className="text-2xl mb-3">{benefit.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {benefit.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* Seção: Quanto você economiza */}
      <AnimatedSection className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Economia</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Quanto o StudioOS faz você economizar?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-6">
            {savings.map((item, index) => {
              const Icon = item.icon;
              return (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="border-2 text-center h-full">
                    <CardContent className="pt-6">
                      <Icon className={`h-10 w-10 mx-auto mb-3 ${item.color}`} />
                      <div className="text-4xl font-bold mb-2">{item.metric}</div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* Seção: Cálculos Automáticos com Exemplos */}
      <AnimatedSection className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Cálculos Automáticos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Veja como o StudioOS calcula automaticamente
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Você informa as medidas → o sistema gera tudo sozinho
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {calculationExamples.map((example, index) => {
              const Icon = example.icon;
              return (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="border-2 h-full">
                    <CardHeader>
                      <Icon className="h-10 w-10 text-primary mb-3" />
                      <CardTitle className="text-sm mb-2">{example.input}</CardTitle>
                      <CardDescription className="text-xs">{example.output}</CardDescription>
                    </CardHeader>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <MockupFrame device="desktop" label="Imagem real - Tela de orçamento com cálculos automáticos">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 flex items-center justify-center p-8">
                <Calculator className="h-16 w-16 text-blue-500" />
              </div>
            </MockupFrame>
            <MockupFrame device="tablet" label="Imagem real - Cálculo de metragem e consumo">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 flex items-center justify-center p-8">
                <Ruler className="h-16 w-16 text-green-500" />
              </div>
            </MockupFrame>
            <MockupFrame device="mobile" label="Imagem real - PDF gerado automaticamente">
              <div className="aspect-video bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 flex items-center justify-center p-8">
                <FileCheck className="h-16 w-16 text-purple-500" />
              </div>
            </MockupFrame>
          </div>
        </div>
      </AnimatedSection>

      {/* Seção: Seu Processo em 4 Passos */}
      <AnimatedSection className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Processo</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Seu processo em 4 passos — sem planilhas, sem complicação
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="border-2 h-full relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">
                      {step.step}
                    </div>
                    <CardHeader className="pt-8">
                      <Icon className="h-12 w-12 text-primary mb-4" />
                      <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* What Changes Section */}
      <AnimatedSection className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Transformação</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que muda quando você usa o StudioOS?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como o seu dia a dia fica mais leve quando o sistema faz o trabalho pesado por você.
            </p>
          </motion.div>

          <WhatChangesSection />
        </div>
      </AnimatedSection>

      {/* Seção: Onboarding em 1 hora */}
      <AnimatedSection className="py-24 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background dark:from-primary/20 dark:via-primary/10">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30" variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Onboarding em 1 hora
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Totalmente configurado para você
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Você só passa algumas informações e o StudioOS entrega tudo funcionando
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Você só passa:</h3>
              <div className="space-y-4">
                {onboardingSteps.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-lg">{item.step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">E pronto. O StudioOS entrega:</h3>
              <div className="grid grid-cols-2 gap-4">
                {onboardingDeliverables.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <WhatsAppCTA size="lg" className="w-full">
                  Fale agora no WhatsApp
                </WhatsAppCTA>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Comparação com Concorrentes */}
      <AnimatedSection className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Comparação</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              StudioOS vs. Concorrentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              O único sistema específico para cortinas e persianas
            </p>
          </motion.div>

          <Card className="border-2 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] font-bold">Funcionalidade</TableHead>
                      <TableHead className="text-center font-bold bg-primary/10">StudioOS</TableHead>
                      <TableHead className="text-center">UAU!</TableHead>
                      <TableHead className="text-center">Millenium</TableHead>
                      <TableHead className="text-center">Bling</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorFeatures.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell className="text-center bg-primary/5">
                          {row.studioos ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.uau ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.millenium ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.bling ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection id="como-funciona" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Fluxo Automático</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como funciona na prática
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como o StudioOS automatiza todo o processo, do primeiro contato até a instalação
            </p>
          </motion.div>

          <div className="relative">
            {/* Horizontal Timeline Line - Pipeline Style */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 transform -translate-y-1/2" />
            
            <div className="grid lg:grid-cols-6 gap-6 lg:gap-4 relative">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === workflowSteps.length - 1;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Connecting Line (except last) */}
                    {!isLast && (
                      <div className="hidden lg:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-primary/30 to-primary/20 transform -translate-y-1/2 z-0" style={{ width: 'calc(100% - 4rem)' }} />
                    )}
                    
                    <div className="flex flex-col items-center gap-4">
                      {/* Step Number Badge */}
                      <div className="relative z-10 w-16 h-16 rounded-full bg-background border-4 border-primary shadow-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{step.step}</span>
                      </div>
                      
                      {/* Card */}
                      <Card className="border-2 hover:border-primary/50 transition-all w-full lg:max-w-none">
                        <CardHeader className="text-center">
                          <div className="flex justify-center mb-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <CardTitle className="text-lg mb-2">{step.title}</CardTitle>
                          <CardDescription className="text-sm">{step.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Optional: Central Mockup */}
            <div className="mt-12 flex justify-center">
              <MockupFrame device="desktop" label="Imagem real do StudioOS - Fluxo completo">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-8">
                  <Workflow className="h-16 w-16 text-primary/50" />
                </div>
              </MockupFrame>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Modules Section with Mockups */}
      <AnimatedSection className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Módulos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Sistema completo, tudo integrado
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Todos os módulos se comunicam automaticamente. Veja como cada um funciona:
            </p>
          </motion.div>

          <div className="space-y-24">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isEven = index % 2 === 0;
              
              return (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <div className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                    {/* Content */}
                    <div className={isEven ? '' : 'lg:col-start-2'}>
                      <Card className="border-2 h-full">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">{module.name}</CardTitle>
                              <CardDescription className="text-base">{module.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {module.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mockup */}
                    <div className={isEven ? '' : 'lg:col-start-1 lg:row-start-1'}>
                      <MockupFrame 
                        device={index % 3 === 0 ? 'mobile' : index % 3 === 1 ? 'tablet' : 'desktop'} 
                        label={`Imagem real do StudioOS - ${module.name}`}
                      >
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-8">
                          <div className="text-center space-y-4">
                            <Icon className="h-16 w-16 mx-auto text-primary/50" />
                            <p className="text-sm text-muted-foreground font-medium">Screenshot real em breve</p>
                            <p className="text-xs text-muted-foreground">Tela do {module.name}</p>
                          </div>
                        </div>
                      </MockupFrame>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* Pricing Section */}
      <AnimatedSection id="planos" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Planos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para sua empresa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece pequeno e escale conforme cresce. Sem compromisso.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card 
                    className={`relative border-2 transition-all hover:shadow-xl h-full ${
                      plan.popular 
                        ? 'border-primary shadow-lg scale-105 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{plan.users} usuários</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{plan.orcamentos} orçamentos</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? 'default' : 'outline'}
                          size="lg"
                          onClick={() => {
                            const formSection = document.getElementById('contato');
                            formSection?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {plan.cta}
                        </Button>
                        <WhatsAppCTA className="w-full" size="lg" variant="outline">
                          Falar no WhatsApp
                        </WhatsAppCTA>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>

          {/* Planos Comparison Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            <h3 className="text-2xl font-bold text-center mb-8">Compare os planos em detalhes</h3>
            <Card className="border-2 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] font-bold">Funcionalidade</TableHead>
                        <TableHead className="text-center font-bold">Starter</TableHead>
                        <TableHead className="text-center font-bold bg-primary/10">Profissional</TableHead>
                        <TableHead className="text-center font-bold">Business</TableHead>
                        <TableHead className="text-center font-bold">Enterprise</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Cálculos automáticos de orçamentos</TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Financeiro semi-autônomo</TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">CRM básico para gerar clientes</TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Dashboard com informações principais</TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Integração com fornecedores</TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Kanban de produção</TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">NF-e integrada</TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">WhatsApp integrado</TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Multiempresa</TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center bg-primary/5"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Limite de usuários</TableCell>
                        <TableCell className="text-center text-sm">Até 3</TableCell>
                        <TableCell className="text-center bg-primary/5 text-sm">Até 10</TableCell>
                        <TableCell className="text-center text-sm">Até 25</TableCell>
                        <TableCell className="text-center text-sm">Até 50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Limite de orçamentos</TableCell>
                        <TableCell className="text-center text-sm">100/mês</TableCell>
                        <TableCell className="text-center bg-primary/5 text-sm">500/mês</TableCell>
                        <TableCell className="text-center text-sm">Ilimitado</TableCell>
                        <TableCell className="text-center text-sm">Ilimitado</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Tipo de suporte</TableCell>
                        <TableCell className="text-center text-sm">Email</TableCell>
                        <TableCell className="text-center bg-primary/5 text-sm">Prioritário</TableCell>
                        <TableCell className="text-center text-sm">Dedicado</TableCell>
                        <TableCell className="text-center text-sm">24/7 + Gerente</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">Depoimentos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Empresas que confiam no StudioOS
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="border-2 hover:border-primary/50 transition-all h-full">
                    <CardHeader>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <CardDescription className="text-base leading-relaxed">{testimonial.content}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-sm text-primary font-medium mt-1">{testimonial.company}</div>
                      <div className="text-xs text-muted-foreground mt-1">{testimonial.city}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection id="faq" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">FAQ</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection id="contato" className="py-24 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background dark:from-primary/20 dark:via-primary/10">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 dark:to-primary/10">
              <CardHeader className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="inline-block mb-4"
                >
                  <Rocket className="h-12 w-12 text-primary mx-auto" />
                </motion.div>
                <CardTitle className="text-3xl mb-2">Pronto para ver o StudioOS funcionando?</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Veja como seu financeiro e orçamentos podem rodar quase sozinhos em menos de 1 hora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Seu email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                      {isSubmitting ? 'Enviando...' : 'Solicitar Demonstração'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <WhatsAppCTA size="lg" className="h-12 text-lg">
                      Fale no WhatsApp
                    </WhatsAppCTA>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Ao solicitar, você concorda em receber informações sobre o StudioOS.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">StudioOS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                O ERP que mais trabalha sozinho para empresas de decoração.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#beneficios" className="hover:text-primary transition-colors">Benefícios</a></li>
                <li><a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a></li>
                <li><a href="#planos" className="hover:text-primary transition-colors">Planos</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} StudioOS. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Como o StudioOS Funciona</DialogTitle>
            <DialogDescription>
              Veja como o StudioOS pode transformar sua gestão
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <Play className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Vídeo de demonstração em breve</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
