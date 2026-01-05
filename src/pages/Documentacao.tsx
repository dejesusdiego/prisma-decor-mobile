import { useState } from "react";
import { 
  BookOpen, 
  Users, 
  FileText, 
  DollarSign, 
  ChevronDown, 
  ChevronRight,
  Home,
  UserPlus,
  Activity,
  PlusCircle,
  Send,
  CreditCard,
  Receipt,
  RefreshCw,
  ArrowLeft,
  Search,
  Rocket,
  Settings,
  Factory,
  Lightbulb,
  Keyboard,
  Save,
  ClipboardList,
  Truck,
  BarChart3,
  FileSpreadsheet,
  Calculator,
  Palette,
  Package,
  Scissors,
  Wrench,
  Zap,
  Wallpaper,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  PieChart,
  Banknote,
  Upload,
  Download,
  Link,
  Eye,
  Edit,
  Copy,
  Trash2,
  GripVertical,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  subsections?: { id: string; title: string; content: React.ReactNode }[];
}

const Documentacao = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(["inicio-rapido"]);
  const [activeSection, setActiveSection] = useState("inicio-rapido");

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections: Section[] = [
    {
      id: "inicio-rapido",
      title: "🚀 Início Rápido",
      icon: <Rocket className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-lg mb-2">Bem-vindo ao Prisma Persianas!</h3>
            <p className="text-muted-foreground">
              Este guia vai te ajudar a criar seu primeiro orçamento em menos de 5 minutos.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" /> Seu Primeiro Orçamento
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <h5 className="font-medium">Acesse o módulo de Orçamentos</h5>
                  <p className="text-sm text-muted-foreground">No menu lateral, clique em "Orçamentos" → "Novo Orçamento"</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div>
                  <h5 className="font-medium">Preencha os dados do cliente</h5>
                  <p className="text-sm text-muted-foreground">Nome, telefone e endereço. Se o cliente já existir no CRM, os dados são preenchidos automaticamente.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <div>
                  <h5 className="font-medium">Adicione os produtos</h5>
                  <p className="text-sm text-muted-foreground">Clique em "Cortina", "Persiana" ou "Outros" para adicionar itens ao orçamento.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                <div>
                  <h5 className="font-medium">Configure cada produto</h5>
                  <p className="text-sm text-muted-foreground">Selecione materiais, informe medidas e clique em "Salvar" em cada card.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">5</div>
                <div>
                  <h5 className="font-medium">Revise e finalize</h5>
                  <p className="text-sm text-muted-foreground">Na etapa de resumo, ajuste margem, aplique desconto e gere o PDF.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
              <Save className="h-4 w-4" /> Auto-Save Ativado!
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Os produtos são salvos automaticamente após 3 segundos de inatividade. Você também pode salvar manualmente a qualquer momento.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "visao-geral",
      title: "Visão Geral",
      icon: <Home className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O sistema Prisma Persianas é uma solução completa para gestão de empresas de cortinas e persianas, com 4 módulos integrados:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
              <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Orçamentos
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Criação de orçamentos com cálculo automático de materiais, custos e margens.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Users className="h-4 w-4" /> CRM
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Gestão de contatos, leads, clientes e pipeline de vendas.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <h4 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Factory className="h-4 w-4" /> Produção
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Kanban de produção, agenda de instalações e controle de etapas.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Financeiro
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Contas a pagar/receber, fluxo de caixa e conciliação bancária.
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">🔗 Fluxo Integrado</h4>
            <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
              <span className="px-3 py-1 bg-background rounded border">Orçamento</span>
              <span>→</span>
              <span className="px-3 py-1 bg-background rounded border">Contato CRM</span>
              <span>→</span>
              <span className="px-3 py-1 bg-background rounded border">Pagamento</span>
              <span>→</span>
              <span className="px-3 py-1 bg-background rounded border">Produção</span>
              <span>→</span>
              <span className="px-3 py-1 bg-background rounded border">Instalação</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">⚡ Automações do Sistema</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Contatos criados automaticamente ao fazer orçamentos</li>
              <li>• Status do orçamento atualizado conforme pagamentos</li>
              <li>• Contatos promovidos a "Cliente" quando pagamento é concluído</li>
              <li>• Pedidos de produção criados ao aprovar orçamentos</li>
              <li>• Follow-ups automáticos para orçamentos sem resposta</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "orcamentos",
      title: "Orçamentos",
      icon: <FileText className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "orcamentos-dashboard",
          title: "Dashboard",
          content: (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                O Dashboard de Orçamentos oferece uma visão completa da sua operação comercial.
              </p>

              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> KPIs Principais
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Total em Orçamentos</span>
                  <p className="text-sm text-muted-foreground">Valor total de todos os orçamentos do período</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Taxa de Conversão</span>
                  <p className="text-sm text-muted-foreground">Percentual de orçamentos que viraram vendas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Ticket Médio</span>
                  <p className="text-sm text-muted-foreground">Valor médio dos orçamentos aprovados</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Meta de Vendas</span>
                  <p className="text-sm text-muted-foreground">Progresso em relação à meta mensal</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Gráficos Disponíveis
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Faturamento Mensal:</strong> Evolução das vendas ao longo do tempo</li>
                <li>• <strong>Funil de Vendas:</strong> Quantidade de orçamentos por status</li>
                <li>• <strong>Ranking de Produtos:</strong> Produtos mais vendidos</li>
                <li>• <strong>Distribuição por Cidade:</strong> Vendas por região</li>
              </ul>
            </div>
          )
        },
        {
          id: "orcamentos-criar",
          title: "Criar Orçamento",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Etapa 1: Dados do Cliente
              </h4>
              <div className="p-4 border-l-4 border-blue-500 bg-muted/50 rounded-r-lg">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li><strong>Telefone:</strong> Digite para buscar cliente existente automaticamente</li>
                  <li><strong>Nome:</strong> Nome completo do cliente</li>
                  <li><strong>Endereço e Cidade:</strong> Local de instalação</li>
                  <li><strong>Observações:</strong> Notas gerais sobre o orçamento</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Se o cliente já existe no CRM, seus dados são preenchidos automaticamente ao digitar o telefone.
                </p>
              </div>

              <h4 className="font-semibold mt-6 flex items-center gap-2">
                <Package className="h-4 w-4" /> Etapa 2: Produtos
              </h4>
              <p className="text-sm text-muted-foreground">
                Adicione produtos clicando nos botões correspondentes:
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <Scissors className="h-4 w-4" /> Cortina
                  </h5>
                  <p className="text-sm text-muted-foreground">Cortinas com tecido, forro e trilho</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Persiana
                  </h5>
                  <p className="text-sm text-muted-foreground">Persianas horizontais, verticais, rolô, etc.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Acessórios
                  </h5>
                  <p className="text-sm text-muted-foreground">Itens avulsos como suportes, ganchos, etc.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <Wallpaper className="h-4 w-4" /> Papel de Parede
                  </h5>
                  <p className="text-sm text-muted-foreground">Cálculo automático de rolos necessários</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Motorização
                  </h5>
                  <p className="text-sm text-muted-foreground">Motores e automação para cortinas/persianas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" /> Outros
                  </h5>
                  <p className="text-sm text-muted-foreground">Produtos genéricos com preço manual</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg mt-4">
                <h5 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Save className="h-4 w-4" /> Auto-Save
                </h5>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Os produtos são salvos automaticamente após 3 segundos de inatividade quando o card está expandido. Um indicador "Salvo ✓" aparece confirmando o salvamento.
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="font-medium flex items-center gap-2 mb-2">
                  <GripVertical className="h-4 w-4" /> Reordenar Produtos
                </h5>
                <p className="text-sm text-muted-foreground">
                  Arraste os produtos pelo ícone de arrastar para reorganizar a ordem no orçamento.
                </p>
              </div>

              <h4 className="font-semibold mt-6 flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Etapa 3: Resumo
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li><strong>Margem de Lucro:</strong> Escolha entre margens pré-definidas ou personalize</li>
                <li><strong>Desconto:</strong> Aplique desconto em percentual ou valor fixo</li>
                <li><strong>Validade:</strong> Defina o prazo de validade do orçamento</li>
                <li><strong>Gerar PDF:</strong> Baixe o orçamento formatado para enviar ao cliente</li>
              </ul>
            </div>
          )
        },
        {
          id: "orcamentos-cortinas",
          title: "Configurar Cortinas",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold">Campos do Card de Cortina</h4>
              
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📏 Medidas</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Largura:</strong> Largura total da cortina em metros</li>
                    <li><strong>Altura:</strong> Altura total da cortina em metros</li>
                    <li><strong>Barra (cm):</strong> Tamanho da barra/bainha inferior</li>
                    <li><strong>Quantidade:</strong> Número de cortinas iguais</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">🎨 Materiais</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Tipo:</strong> Wave, Pregas, Ilhós, Rolô, etc.</li>
                    <li><strong>Tecido:</strong> Selecione do catálogo (filtros por fornecedor/linha)</li>
                    <li><strong>Forro:</strong> Opcional - adiciona forro à cortina</li>
                    <li><strong>Trilho:</strong> Tipo de trilho para instalação</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">✂️ Serviços Adicionais</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    Marque serviços de confecção extras como franzido, forro blackout, etc.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">🔧 Instalação</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Precisa instalação:</strong> Marque se o cliente contratou instalação</li>
                    <li><strong>Pontos:</strong> Número de pontos de instalação</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <h5 className="font-semibold text-amber-700 dark:text-amber-300">📐 Cálculo Automático</h5>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  O sistema calcula automaticamente o consumo de tecido considerando:
                </p>
                <ul className="text-sm text-amber-600 dark:text-amber-400 mt-2 space-y-1">
                  <li>• Coeficiente do tipo de cortina (wave = 2.5x, pregas = 2x, etc.)</li>
                  <li>• Largura do rolo do tecido</li>
                  <li>• Barra e margem de costura</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-persianas",
          title: "Configurar Persianas",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold">Campos do Card de Persiana</h4>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📏 Medidas e Identificação</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Nome/Ambiente:</strong> Identificação da persiana (ex: "Quarto 1")</li>
                    <li><strong>Largura x Altura:</strong> Medidas em metros</li>
                    <li><strong>Quantidade:</strong> Número de persianas iguais</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">🏭 Tipo e Material</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Tipo:</strong> Horizontal, Vertical, Rolô, Double Vision, etc.</li>
                    <li><strong>Material:</strong> Selecione do catálogo de persianas</li>
                    <li><strong>Fábrica:</strong> Fornecedor/fabricante</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">💰 Preço</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    O preço é calculado por m² baseado no material selecionado, ou pode ser informado manualmente.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Área mínima:</strong> Alguns materiais têm área mínima de faturamento. O sistema aplica automaticamente quando necessário.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-papel",
          title: "Papel de Parede",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Wallpaper className="h-4 w-4" /> Configuração de Papel de Parede
              </h4>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📐 Dimensões da Parede</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Largura:</strong> Largura total da parede em metros</li>
                    <li><strong>Altura:</strong> Altura da parede (pé-direito)</li>
                    <li><strong>Área total:</strong> Calculada automaticamente</li>
                  </ul>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">🎨 Material e Cálculo</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Papel:</strong> Selecione do catálogo</li>
                    <li><strong>Cobertura por rolo:</strong> m² que cada rolo cobre</li>
                    <li><strong>Perda (%):</strong> Margem de perda para recortes</li>
                    <li><strong>Rolos sugeridos:</strong> Calculado automaticamente</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h5 className="font-semibold text-green-700 dark:text-green-300">🧮 Fórmula de Cálculo</h5>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Rolos = ⌈(Área × (1 + Perda%)) ÷ Cobertura por rolo⌉
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  O valor é sempre arredondado para cima para garantir material suficiente.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-status",
          title: "Status e Fluxo",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" /> Ciclo de Vida do Orçamento
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="font-medium w-28">Rascunho</span>
                  <span className="text-sm text-muted-foreground">Orçamento em edição, ainda não enviado</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium w-28">Finalizado</span>
                  <span className="text-sm text-muted-foreground">Pronto para enviar ao cliente</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium w-28">Enviado</span>
                  <span className="text-sm text-muted-foreground">Cliente recebeu a proposta</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-medium w-28">Sem Resposta</span>
                  <span className="text-sm text-muted-foreground">Aguardando retorno do cliente</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="font-medium w-28">Em Negociação</span>
                  <span className="text-sm text-muted-foreground">Cliente está negociando valores</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="font-medium w-28">Parcial 40%</span>
                  <span className="text-sm text-muted-foreground">Entrada recebida</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-lime-500" />
                  <span className="font-medium w-28">Parcial 60%</span>
                  <span className="text-sm text-muted-foreground">Segunda parcela recebida</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium w-28">Pago</span>
                  <span className="text-sm text-muted-foreground">100% pago - venda concluída</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium w-28">Recusado</span>
                  <span className="text-sm text-muted-foreground">Cliente não aprovou</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <h5 className="font-semibold text-amber-700 dark:text-amber-300">⚡ Status Automático</h5>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  O status muda automaticamente conforme os pagamentos são registrados no módulo financeiro.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-pdf",
          title: "Gerar PDF",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" /> Gerando o PDF do Orçamento
              </h4>

              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Na etapa de Resumo, clique em "Gerar PDF"</li>
                <li>Defina a validade do orçamento (dias)</li>
                <li>Confirme para baixar o arquivo</li>
              </ol>

              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">📄 O PDF inclui:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Logo e dados da empresa</li>
                  <li>• Dados do cliente</li>
                  <li>• Lista de produtos com descrição e valores</li>
                  <li>• Subtotais e total geral</li>
                  <li>• Desconto aplicado (se houver)</li>
                  <li>• Data de validade</li>
                  <li>• Observações</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 O PDF mostra apenas os preços de venda, sem revelar custos ou margens de lucro.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "crm",
      title: "CRM",
      icon: <Users className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "crm-painel",
          title: "Painel do CRM",
          content: (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                O Painel do CRM é a central de informações sobre seus clientes e vendas.
              </p>
              
              <h4 className="font-semibold">📊 Métricas do CRM</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Total de Contatos</span>
                  <p className="text-sm text-muted-foreground">Leads + Clientes cadastrados</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Taxa de Conversão</span>
                  <p className="text-sm text-muted-foreground">% de orçamentos que viraram vendas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Valor em Pipeline</span>
                  <p className="text-sm text-muted-foreground">Total de oportunidades em aberto</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Follow-ups Pendentes</span>
                  <p className="text-sm text-muted-foreground">Atividades que precisam de atenção</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">📋 Pipeline de Vendas (Kanban)</h4>
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie oportunidades arrastando cards entre as colunas do funil.
              </p>
            </div>
          )
        },
        {
          id: "crm-contatos",
          title: "Gestão de Contatos",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Tipos de Contato
              </h4>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <span className="font-medium text-blue-700 dark:text-blue-300">Lead</span>
                  <p className="text-sm text-muted-foreground">Potencial cliente, ainda não comprou</p>
                </div>
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <span className="font-medium text-green-700 dark:text-green-300">Cliente</span>
                  <p className="text-sm text-muted-foreground">Já realizou compra</p>
                </div>
                <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-950/30">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Inativo</span>
                  <p className="text-sm text-muted-foreground">Não responde há tempo</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">➕ Criar Contato</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Novo Contato"</li>
                <li>Preencha nome e telefone (obrigatórios)</li>
                <li>Adicione email, cidade e observações</li>
                <li>Selecione o tipo (Lead/Cliente)</li>
                <li>Salve o contato</li>
              </ol>

              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ⚡ <strong>Automático:</strong> Contatos são criados automaticamente ao fazer orçamentos para telefones novos!
                </p>
              </div>

              <h4 className="font-semibold mt-4">🔄 Mesclar Contatos Duplicados</h4>
              <p className="text-sm text-muted-foreground">
                Na aba "Mesclar", selecione dois contatos duplicados e combine-os em um só, transferindo todos os orçamentos e atividades.
              </p>
            </div>
          )
        },
        {
          id: "crm-atividades",
          title: "Atividades e Follow-ups",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" /> Tipos de Atividades
              </h4>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="p-2 border rounded text-center">📞 Ligação</div>
                <div className="p-2 border rounded text-center">📧 Email</div>
                <div className="p-2 border rounded text-center">💬 WhatsApp</div>
                <div className="p-2 border rounded text-center">🤝 Reunião</div>
                <div className="p-2 border rounded text-center">📋 Tarefa</div>
                <div className="p-2 border rounded text-center">📝 Outro</div>
              </div>

              <h4 className="font-semibold mt-4">➕ Criar Atividade</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Nova Atividade"</li>
                <li>Selecione o tipo e preencha o título</li>
                <li>Vincule a um contato e/ou orçamento</li>
                <li>Defina data e hora do lembrete</li>
                <li>Salve a atividade</li>
              </ol>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg mt-4">
                <h5 className="font-semibold text-amber-700 dark:text-amber-300">🔔 Lembretes</h5>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Atividades com data de lembrete aparecem no sino de notificações e no painel de alertas.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "producao",
      title: "Produção",
      icon: <Factory className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "producao-dashboard",
          title: "Dashboard de Produção",
          content: (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                O Dashboard de Produção mostra o status de todos os pedidos em fabricação.
              </p>

              <h4 className="font-semibold">📊 Visão Geral</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Pedidos em Produção</span>
                  <p className="text-sm text-muted-foreground">Total de pedidos sendo fabricados</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Instalações Agendadas</span>
                  <p className="text-sm text-muted-foreground">Próximas instalações da semana</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Atrasados</span>
                  <p className="text-sm text-muted-foreground">Pedidos com prazo vencido</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Capacidade</span>
                  <p className="text-sm text-muted-foreground">Ocupação por etapa produtiva</p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "producao-kanban",
          title: "Kanban de Produção",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold">📋 Etapas do Fluxo</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="font-medium">Aguardando</span>
                  <span className="text-sm text-muted-foreground">→ Pedido aprovado, aguardando início</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Corte</span>
                  <span className="text-sm text-muted-foreground">→ Tecidos sendo cortados</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium">Costura</span>
                  <span className="text-sm text-muted-foreground">→ Em confecção</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-medium">Acabamento</span>
                  <span className="text-sm text-muted-foreground">→ Revisão e finalização</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Pronto</span>
                  <span className="text-sm text-muted-foreground">→ Aguardando instalação</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Arraste os cards entre as colunas para atualizar o status de cada item do pedido.
              </p>
            </div>
          )
        },
        {
          id: "producao-instalacao",
          title: "Agenda de Instalações",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Agendamento
              </h4>

              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Acesse a agenda de instalações</li>
                <li>Selecione o pedido que está pronto</li>
                <li>Escolha data e turno (manhã/tarde)</li>
                <li>Informe o instalador responsável</li>
                <li>Confirme o agendamento</li>
              </ol>

              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">📅 Visualização</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Dia:</strong> Instalações do dia selecionado</li>
                  <li>• <strong>Semana:</strong> Visão semanal com todas as instalações</li>
                  <li>• <strong>Mês:</strong> Calendário mensal com indicadores</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: "producao-ficha",
          title: "Ficha Técnica",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Ficha do Pedido
              </h4>

              <p className="text-muted-foreground">
                A ficha técnica contém todas as informações necessárias para a produção:
              </p>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📋 Dados do Pedido</h5>
                  <p className="text-sm text-muted-foreground">Número, cliente, endereço, prazo</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📦 Lista de Materiais</h5>
                  <p className="text-sm text-muted-foreground">Tecidos, trilhos, acessórios necessários</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📏 Especificações Técnicas</h5>
                  <p className="text-sm text-muted-foreground">Medidas, tipos, acabamentos de cada item</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📝 Observações</h5>
                  <p className="text-sm text-muted-foreground">Instruções especiais de produção</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Clique em "Gerar PDF" para imprimir a ficha e entregar à produção.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "financeiro",
      title: "Financeiro",
      icon: <DollarSign className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "financeiro-dashboard",
          title: "Dashboard Financeiro",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4" /> Visão Geral
              </h4>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <h5 className="font-medium text-green-600">Saldo do Período</h5>
                  <p className="text-sm text-muted-foreground">Entradas - Saídas</p>
                </div>
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <h5 className="font-medium text-blue-600">Total de Entradas</h5>
                  <p className="text-sm text-muted-foreground">Recebimentos do período</p>
                </div>
                <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/30">
                  <h5 className="font-medium text-red-600">Total de Saídas</h5>
                  <p className="text-sm text-muted-foreground">Pagamentos do período</p>
                </div>
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <h5 className="font-medium text-amber-600">Pendente</h5>
                  <p className="text-sm text-muted-foreground">A receber/pagar em aberto</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">📈 Gráficos</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Fluxo de Caixa:</strong> Evolução diária de entradas e saídas</li>
                <li>• <strong>Categorias:</strong> Distribuição de despesas por categoria</li>
                <li>• <strong>Fluxo Previsto:</strong> Projeção de caixa futuro</li>
              </ul>
            </div>
          )
        },
        {
          id: "financeiro-receber",
          title: "Contas a Receber",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Gerenciar Recebimentos
              </h4>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <span className="font-medium text-amber-700 dark:text-amber-300">Pendente</span>
                  <p className="text-sm text-muted-foreground">Aguardando pagamento</p>
                </div>
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <span className="font-medium text-blue-700 dark:text-blue-300">Parcial</span>
                  <p className="text-sm text-muted-foreground">Pagamento incompleto</p>
                </div>
                <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/30">
                  <span className="font-medium text-red-700 dark:text-red-300">Vencido</span>
                  <p className="text-sm text-muted-foreground">Prazo expirado</p>
                </div>
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <span className="font-medium text-green-700 dark:text-green-300">Recebido</span>
                  <p className="text-sm text-muted-foreground">100% pago</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">💰 Registrar Recebimento</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Encontre a conta/parcela desejada</li>
                <li>Clique em "Registrar Recebimento"</li>
                <li>Informe valor e forma de pagamento</li>
                <li>Confirme o recebimento</li>
              </ol>

              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg mt-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ⚡ <strong>Automático:</strong> Quando 100% é pago, o orçamento vinculado muda para "Pago" automaticamente.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "financeiro-pagar",
          title: "Contas a Pagar",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Gerenciar Pagamentos
              </h4>

              <h4 className="font-semibold mt-4">➕ Criar Conta a Pagar</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Nova Conta a Pagar"</li>
                <li>Preencha descrição, valor e vencimento</li>
                <li>Selecione categoria (Fornecedor, Operacional, etc.)</li>
                <li>Vincule a um orçamento se for custo direto</li>
                <li>Marque como recorrente se aplicável</li>
              </ol>

              <h4 className="font-semibold mt-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Contas Recorrentes
              </h4>
              <p className="text-sm text-muted-foreground">
                Contas marcadas como recorrentes são geradas automaticamente conforme a frequência (mensal, semanal, etc.).
              </p>
            </div>
          )
        },
        {
          id: "financeiro-conciliacao",
          title: "Conciliação Bancária",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Link className="h-4 w-4" /> Importar Extrato
              </h4>

              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Exporte o extrato do seu banco em formato OFX</li>
                <li>Clique em "Importar Extrato" e selecione o arquivo</li>
                <li>O sistema lista todas as movimentações</li>
                <li>Vincule cada movimentação a lançamentos existentes ou crie novos</li>
              </ol>

              <div className="p-3 border rounded-lg mt-4">
                <h5 className="font-medium mb-2">🤖 Sugestões Automáticas</h5>
                <p className="text-sm text-muted-foreground">
                  O sistema aprende com suas conciliações e sugere automaticamente correspondências baseadas em padrões anteriores.
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Configure regras de conciliação para automatizar lançamentos recorrentes (aluguel, telefone, etc.).
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "configuracoes",
      title: "Configurações",
      icon: <Settings className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "config-materiais",
          title: "Gestão de Materiais",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" /> Catálogo de Materiais
              </h4>

              <p className="text-muted-foreground">
                Gerencie todos os materiais usados nos orçamentos:
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Tecidos</h5>
                  <p className="text-sm text-muted-foreground">Tecidos para cortinas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Forros</h5>
                  <p className="text-sm text-muted-foreground">Forros e blackouts</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Trilhos</h5>
                  <p className="text-sm text-muted-foreground">Trilhos e varões</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Persianas</h5>
                  <p className="text-sm text-muted-foreground">Materiais de persianas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Acessórios</h5>
                  <p className="text-sm text-muted-foreground">Suportes, ganchos, etc.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Motorizados</h5>
                  <p className="text-sm text-muted-foreground">Motores e automação</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4 flex items-center gap-2">
                <Upload className="h-4 w-4" /> Importar Materiais
              </h4>
              <p className="text-sm text-muted-foreground">
                Importe materiais em massa via arquivo CSV. Baixe o modelo de planilha na seção de importação.
              </p>
            </div>
          )
        },
        {
          id: "config-servicos",
          title: "Serviços",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Scissors className="h-4 w-4" /> Serviços de Confecção
              </h4>
              <p className="text-sm text-muted-foreground">
                Configure serviços de costura como franzido, blackout, forro, etc. Cada serviço tem preço de custo e tabela.
              </p>

              <h4 className="font-semibold mt-4 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Serviços de Instalação
              </h4>
              <p className="text-sm text-muted-foreground">
                Configure o preço por ponto de instalação. O sistema multiplica pela quantidade de pontos em cada cortina.
              </p>

              <div className="p-3 border rounded-lg mt-4">
                <h5 className="font-medium mb-2">💰 Margem de Lucro</h5>
                <p className="text-sm text-muted-foreground">
                  Cada material e serviço tem preço de custo e preço de tabela. A margem é calculada automaticamente.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "config-categorias",
          title: "Categorias Financeiras",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold">📂 Categorias de Receita e Despesa</h4>

              <p className="text-muted-foreground">
                Organize seus lançamentos financeiros com categorias personalizadas.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <h5 className="font-medium text-green-700 dark:text-green-300">Receitas</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Vendas</li>
                    <li>• Serviços</li>
                    <li>• Outros recebimentos</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/30">
                  <h5 className="font-medium text-red-700 dark:text-red-300">Despesas</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Fornecedores</li>
                    <li>• Operacional</li>
                    <li>• Pessoal</li>
                    <li>• Impostos</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "dicas",
      title: "Dicas e Atalhos",
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
              <Save className="h-4 w-4" /> Auto-Save
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Os cards de produtos são salvos automaticamente após 3 segundos de inatividade. Quando você vê o badge "Salvo ✓", seus dados estão seguros!
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <GripVertical className="h-4 w-4" /> Reordenação
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Arraste produtos pelo ícone de arrastar para reorganizar a ordem no orçamento e no PDF.
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Copy className="h-4 w-4" /> Duplicar Produtos
            </h4>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Use o botão de duplicar para criar uma cópia de um produto. Útil para ambientes similares!
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Search className="h-4 w-4" /> Busca Rápida de Materiais
            </h4>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Use os filtros de fornecedor e linha para encontrar materiais rapidamente no selector.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold flex items-center gap-2">
              <Keyboard className="h-4 w-4" /> Navegação Eficiente
            </h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>Tab:</strong> Navegar entre campos</li>
              <li>• <strong>Enter:</strong> Confirmar seleção em dropdowns</li>
              <li>• <strong>Esc:</strong> Fechar modais e diálogos</li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Boas Práticas
            </h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Sempre preencha o ambiente de cada produto para facilitar identificação</li>
              <li>• Use observações internas para notas que não devem aparecer no PDF</li>
              <li>• Verifique as medidas antes de avançar para o resumo</li>
              <li>• Salve o orçamento antes de gerar o PDF</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subsections?.some(sub => sub.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const renderContent = () => {
    for (const section of sections) {
      if (section.id === activeSection) {
        return section.content;
      }
      if (section.subsections) {
        const subsection = section.subsections.find(sub => sub.id === activeSection);
        if (subsection) {
          return subsection.content;
        }
      }
    }
    return sections[0].content;
  };

  const getActiveTitle = () => {
    for (const section of sections) {
      if (section.id === activeSection) {
        return section.title;
      }
      if (section.subsections) {
        const subsection = section.subsections.find(sub => sub.id === activeSection);
        if (subsection) {
          return `${section.title} › ${subsection.title}`;
        }
      }
    }
    return "Documentação";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/gerarorcamento")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Manual do Sistema Prisma Persianas</h1>
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-72 border-r min-h-[calc(100vh-3.5rem)] py-6 pr-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no manual..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  {section.subsections ? (
                    <Collapsible
                      open={openSections.includes(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                        {section.icon}
                        <span className="flex-1 text-left">{section.title}</span>
                        {openSections.includes(section.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 space-y-1 mt-1">
                        {section.subsections.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveSection(sub.id)}
                            className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              activeSection === sub.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {sub.title}
                          </button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {section.icon}
                      {section.title}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-6 px-4 md:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">{getActiveTitle()}</h2>
            <Separator className="mb-6" />
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documentacao;
