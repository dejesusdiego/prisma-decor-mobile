import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, Store, Package, MapPin, Mail, Phone, Building2, Lock, Shield, Globe, Facebook, Instagram, Linkedin, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Lista de UFs do Brasil por região
const BRAZILIAN_REGIONS = {
  'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
  'Sul': ['PR', 'RS', 'SC'],
};

const ALL_STATES = Object.values(BRAZILIAN_REGIONS).flat();

// Categorias de produtos
const PRODUCT_CATEGORIES = [
  { id: 'tecidos', label: 'Tecidos', icon: '🎨' },
  { id: 'papel-de-parede', label: 'Papel de Parede', icon: '🖼️' },
  { id: 'trilho', label: 'Trilhos', icon: '🔧' },
  { id: 'moveis-soltos', label: 'Móveis Soltos', icon: '🪑' },
  { id: 'motorizacao', label: 'Motorização', icon: '⚙️' },
];

export default function CadastroFornecedor() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serviceStates, setServiceStates] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [otherCategories, setOtherCategories] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    if (!email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }

    if (!cnpj.trim()) {
      toast.error('CNPJ é obrigatório');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (productCategories.length === 0) {
      toast.error('Selecione pelo menos uma categoria de produto');
      return;
    }

    if (productCategories.includes('outros') && !otherCategories.trim()) {
      toast.error('Preencha o campo "Outros" com as categorias adicionais');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Criar usuário no Auth
      // NOTA: Não configuramos emailRedirectTo porque não enviamos email de confirmação
      // Como temos aprovação manual de fornecedores, não precisamos de confirmação por email
      // O email será confirmado automaticamente pela função register_supplier
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password
        // Sem emailRedirectTo - confirmação de email desabilitada no Supabase Dashboard
        // A função register_supplier confirma o email automaticamente via SQL
      });

      if (authError) {
        logError(authError, 'CadastroFornecedor - signUp');
        
        // Se o erro for "Email already registered", tentar fazer login
        // Mensagem genérica para evitar enumeração
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('User already registered') ||
            authError.message?.includes('already exists')) {
          // Tentar fazer login com as credenciais fornecidas
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          
          if (loginError) {
            // Mensagem genérica para evitar enumeração
            toast.error('Não foi possível completar o cadastro. Verifique os dados informados.');
            throw loginError;
          }
          
          if (!loginData.user) {
            const errorMsg = 'Erro ao fazer login. Por favor, tente novamente.';
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          // Usar o usuário do login
          authData.user = loginData.user;
          authData.session = loginData.session;
        } else {
          // Mensagem genérica para evitar enumeração
          toast.error('Não foi possível completar o cadastro. Verifique os dados informados e tente novamente.');
          throw authError;
        }
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Preparar categorias (incluir "outros" se preenchido)
      const finalCategories = [...productCategories];
      if (otherCategories.trim()) {
        finalCategories.push(`outros:${otherCategories.trim()}`);
      }

      // 3. Registrar fornecedor via RPC (status='pending')
      // A função register_supplier também tentará confirmar o email automaticamente
      const { data: supplierId, error: supplierError } = await supabase.rpc(
        'register_supplier',
        {
          p_name: name.trim(),
          p_email: email.trim().toLowerCase(),
          p_phone: phone.trim() || null,
          p_cnpj: cnpj.trim() || null,
          p_service_states: serviceStates,
          p_product_categories: finalCategories,
          p_user_id: authData.user.id
        }
      );

      if (supplierError) {
        // Usar sistema centralizado de tratamento de erros
        logError(supplierError, 'CadastroFornecedor - register_supplier');
        
        // Mensagem genérica para evitar enumeração (email/CNPJ já cadastrado)
        // Códigos de erro específicos são logados, mas UI mostra mensagem genérica
        const isDuplicateError = 
          supplierError.message?.includes('already_registered') ||
          supplierError.message?.includes('already exists') ||
          supplierError.code === '23505'; // unique_violation
        
        if (isDuplicateError) {
          toast.error('Não foi possível completar o cadastro. Verifique os dados informados.');
        } else {
          const { message, action } = getErrorMessage(supplierError);
          const fullMessage = action ? `${message}\n\nAção sugerida: ${action}` : message;
          toast.error(fullMessage);
        }
        
        throw supplierError;
      }

      // 4. Sucesso - Redirecionar para o portal
      toast.success('Cadastro realizado com sucesso! Redirecionando para o portal...');
      
      // Aguardar um pouco para o usuário ver a mensagem e a sessão ser estabelecida
      setTimeout(() => {
        const hostname = window.location.hostname;
        
        // Em preview/Vercel: usar rota /fornecedores no mesmo domínio
        // Em produção: usar subdomínio fornecedores.studioos.pro
        if (hostname.includes('vercel.app')) {
          // Preview Vercel: usar rota no mesmo domínio
          window.location.href = window.location.origin + '/fornecedores';
        } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          // Dev local: usar rota no mesmo domínio
          window.location.href = window.location.origin + '/fornecedores';
        } else {
          // Produção: usar subdomínio
          window.location.href = 'https://fornecedores.studioos.pro';
        }
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast.error(error.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleState = (uf: string) => {
    if (serviceStates.includes(uf)) {
      setServiceStates(serviceStates.filter(s => s !== uf));
    } else {
      setServiceStates([...serviceStates, uf]);
    }
  };

  const toggleRegion = (region: string) => {
    const regionStates = BRAZILIAN_REGIONS[region as keyof typeof BRAZILIAN_REGIONS];
    const allSelected = regionStates.every(state => serviceStates.includes(state));
    
    if (allSelected) {
      // Desmarcar todos os estados da região
      setServiceStates(serviceStates.filter(s => !regionStates.includes(s)));
    } else {
      // Marcar todos os estados da região (agregar, não substituir)
      const newStates = [...new Set([...serviceStates, ...regionStates])];
      setServiceStates(newStates);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (productCategories.includes(categoryId)) {
      setProductCategories(productCategories.filter(c => c !== categoryId));
    } else {
      setProductCategories([...productCategories, categoryId]);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold">Cadastro Recebido!</CardTitle>
            <CardDescription className="text-base mt-2">
              Seu cadastro foi enviado com sucesso e está aguardando aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-5 text-sm border">
              <p className="font-semibold mb-3 text-base">O que acontece agora?</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Nossa equipe irá revisar seu cadastro</li>
                <li>Você receberá um e-mail quando for aprovado</li>
                <li>Após aprovação, você terá acesso ao Portal de Fornecedores</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/">Voltar ao início</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/auth">Fazer login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header com Logo */}
      <header className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/studioos" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                StudioOS
              </span>
              <span className="text-xs text-muted-foreground ml-2">Portal de Fornecedores</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/studioos">Voltar ao site</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Cadastro de Fornecedor</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Junte-se à nossa rede de fornecedores e expanda seus negócios
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription className="text-base">
                Preencha as informações abaixo. Seu cadastro será revisado e você receberá um e-mail quando for aprovado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Seção: Informações Básicas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                    <Building2 className="h-4 w-4" />
                    Informações Básicas
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name" className="text-base font-medium">
                        Nome da Empresa *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Tecidos ABC Ltda"
                        required
                        className="mt-2 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cnpj" className="text-base font-medium">
                        CNPJ *
                      </Label>
                      <Input
                        id="cnpj"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        required
                        className="mt-2 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="mt-2 h-11"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contato@empresa.com"
                        required
                        className="mt-2 h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Este e-mail será usado para login no Portal de Fornecedores
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção: Categorias de Produtos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                    <Package className="h-4 w-4" />
                    Categorias de Produtos *
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione as categorias de produtos que sua empresa trabalha
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PRODUCT_CATEGORIES.map((category) => (
                      <label
                        key={category.id}
                        htmlFor={`category-${category.id}`}
                        className={`
                          relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${productCategories.includes(category.id)
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={productCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="text-sm font-medium">
                            {category.label}
                          </span>
                        </div>
                      </label>
                    ))}
                    
                    {/* Opção "Outros" */}
                    <label
                      htmlFor="category-outros"
                      className={`
                        relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${otherCategories.trim() || productCategories.includes('outros')
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <Checkbox
                        id="category-outros"
                        checked={productCategories.includes('outros') || !!otherCategories.trim()}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (!productCategories.includes('outros')) {
                              setProductCategories([...productCategories, 'outros']);
                            }
                          } else {
                            setProductCategories(productCategories.filter(c => c !== 'outros'));
                            setOtherCategories('');
                          }
                        }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">➕</span>
                        <span className="text-sm font-medium">Outros</span>
                      </div>
                    </label>
                  </div>
                  
                  {/* Campo de texto para "Outros" */}
                  {(productCategories.includes('outros') || otherCategories.trim()) && (
                    <div className="mt-3">
                      <Label htmlFor="otherCategories" className="text-sm font-medium">
                        Especifique outras categorias: *
                      </Label>
                      <Input
                        id="otherCategories"
                        value={otherCategories}
                        onChange={(e) => {
                          setOtherCategories(e.target.value);
                          // Adicionar 'outros' se ainda não estiver na lista
                          if (e.target.value.trim() && !productCategories.includes('outros')) {
                            setProductCategories([...productCategories, 'outros']);
                          }
                          // Remover 'outros' se o campo estiver vazio
                          if (!e.target.value.trim() && productCategories.includes('outros')) {
                            setProductCategories(productCategories.filter(c => c !== 'outros'));
                          }
                        }}
                        placeholder="Ex: Acessórios, Ferragens, etc."
                        className="mt-2"
                        required={productCategories.includes('outros')}
                      />
                    </div>
                  )}
                </div>

                {/* Seção: Regiões Atendidas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    Regiões Atendidas (UFs)
                  </div>
                  
                  {/* Seleção por Região */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Selecione por região ou escolha estados individuais:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(BRAZILIAN_REGIONS).map((region) => {
                        const regionStates = BRAZILIAN_REGIONS[region as keyof typeof BRAZILIAN_REGIONS];
                        const allSelected = regionStates.every(state => serviceStates.includes(state));
                        const someSelected = regionStates.some(state => serviceStates.includes(state));
                        
                        return (
                          <Button
                            key={region}
                            type="button"
                            variant={allSelected ? "default" : someSelected ? "secondary" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleRegion(region);
                            }}
                            className="text-xs"
                          >
                            {region}
                            {allSelected && ' ✓'}
                            {someSelected && !allSelected && ' •'}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid de Estados */}
                  <div className="border-2 rounded-lg p-5 bg-muted/20">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {ALL_STATES.map((uf) => (
                        <label
                          key={uf}
                          htmlFor={`state-${uf}`}
                          className={`
                            flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all
                            ${serviceStates.includes(uf)
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'bg-background hover:bg-muted border border-border'
                            }
                          `}
                        >
                          <Checkbox
                            id={`state-${uf}`}
                            checked={serviceStates.includes(uf)}
                            onCheckedChange={() => toggleState(uf)}
                          />
                          <span className="text-sm font-medium">
                            {uf}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seção: Senha */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                    <Lock className="h-4 w-4" />
                    Segurança
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="text-base font-medium">
                        Senha *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        className="mt-2 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-base font-medium">
                        Confirmar Senha *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                        required
                        minLength={6}
                        className="mt-2 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Aviso Importante */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Importante</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <li>Seu cadastro será revisado manualmente pela nossa equipe</li>
                        <li>Você receberá um e-mail quando seu cadastro for aprovado</li>
                        <li>Após aprovação, você terá acesso completo ao Portal de Fornecedores</li>
                        <li>Não é possível acessar o portal enquanto o cadastro estiver pendente</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botão Submit */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-12 text-base font-semibold shadow-lg" 
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Store className="h-5 w-5 mr-2" />
                      Enviar Cadastro
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao cadastrar, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-muted/50 to-muted/30 border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  StudioOS
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema completo para gestão de cortinas, persianas e decoração.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Página Inicial
                  </Link>
                </li>
                <li>
                  <Link to="/studioos" className="text-muted-foreground hover:text-primary transition-colors">
                    Sobre o StudioOS
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  contato@studioos.pro
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  studioos.pro
                </li>
              </ul>
              <div className="flex gap-3 mt-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} StudioOS. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
