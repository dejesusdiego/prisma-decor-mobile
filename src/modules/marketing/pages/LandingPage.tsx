import { useEffect, useState } from 'react'
import { Button } from '@core/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@core/components/ui/Card'
import { Package, Shield, Zap, Users, CheckCircle, ArrowRight } from 'lucide-react'

interface LandingPageProps {
  orgSlug?: string
}

export function LandingPage({ orgSlug }: LandingPageProps) {
  const [currentDomain, setCurrentDomain] = useState('')

  useEffect(() => {
    setCurrentDomain(window.location.hostname)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">StudioOS</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-medium hover:text-primary">
                Entrar
              </a>
              <a href="/registro">
                <Button>Começar Grátis</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Gestão completa para
            <span className="text-primary block mt-2">seu negócio de decoração</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simplifique seus orçamentos, controle seus pedidos e organize seu catálogo 
            de produtos em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/registro">
              <Button size="lg">
                Teste Grátis por 14 Dias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="/demo">
              <Button size="lg" variant="outline">Ver Demonstração</Button>
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Você está em: <span className="font-medium text-gray-700">{currentDomain}</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ferramentas poderosas para impulsionar sua produtividade e organização
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-500 mb-2" />
                <CardTitle>Orçamentos Rápidos</CardTitle>
                <CardDescription>
                  Crie orçamentos profissionais em minutos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle>Catálogo Digital</CardTitle>
                <CardDescription>
                  Gerencie todos os seus produtos e preços
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-green-500 mb-2" />
                <CardTitle>Controle de Clientes</CardTitle>
                <CardDescription>
                  Histórico completo de interações e pedidos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle>Dados Seguros</CardTitle>
                <CardDescription>
                  Segurança de nível empresarial para seus dados
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-gray-600">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Para profissionais iniciantes</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 29</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Até 50 orçamentos/mês', 'Catálogo de produtos', 'Relatórios básicos', 'Suporte por email'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline">Escolher Starter</Button>
              </CardContent>
            </Card>

            <Card className="border-primary ring-2 ring-primary ring-opacity-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                    POPULAR
                  </span>
                </div>
                <CardDescription>Para empresas em crescimento</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 79</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Orçamentos ilimitados', 'Catálogo ilimitado', 'Relatórios avançados', 'Suporte prioritário', 'Múltiplos usuários'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6">Escolher Pro</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-white">StudioOS</span>
            </div>
            <p className="text-sm">
              Simplificando a gestão de decoração para profissionais e empresas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-white">Preços</a></li>
              <li><a href="#demo" className="hover:text-white">Demonstração</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white">Sobre</a></li>
              <li><a href="#contact" className="hover:text-white">Contato</a></li>
              <li><a href="#blog" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#privacy" className="hover:text-white">Privacidade</a></li>
              <li><a href="#terms" className="hover:text-white">Termos</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          © 2025 StudioOS. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
