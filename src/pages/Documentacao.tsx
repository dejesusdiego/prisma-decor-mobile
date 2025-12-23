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
  Search
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
  const [openSections, setOpenSections] = useState<string[]>(["visao-geral"]);
  const [activeSection, setActiveSection] = useState("visao-geral");

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections: Section[] = [
    {
      id: "visao-geral",
      title: "Visão Geral do Sistema",
      icon: <Home className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O sistema Prisma Persianas é composto por três módulos principais que trabalham de forma integrada:
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Users className="h-4 w-4" /> CRM
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Gestão de contatos, leads, clientes e acompanhamento de vendas
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
              <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Orçamentos
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Criação, gestão e acompanhamento de orçamentos
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Financeiro
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Contas a receber, pagar e fluxo de caixa
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">🔗 Integrações Automáticas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Orçamentos criam contatos automaticamente se o telefone for novo</li>
              <li>• Mudança de status do orçamento atualiza o funil de vendas</li>
              <li>• Pagamentos registrados atualizam o status do orçamento</li>
              <li>• Contatos são promovidos a "Cliente" quando um orçamento é pago</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "crm",
      title: "CRM - Gestão de Relacionamento",
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
              
              <h4 className="font-semibold">📊 Cards de Resumo</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Total de Contatos</span>
                  <p className="text-sm text-muted-foreground">Quantidade total de leads e clientes cadastrados</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Orçamentos</span>
                  <p className="text-sm text-muted-foreground">Total de orçamentos criados</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Taxa de Conversão</span>
                  <p className="text-sm text-muted-foreground">Percentual de orçamentos que viraram vendas</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="font-medium">Follow-ups Pendentes</span>
                  <p className="text-sm text-muted-foreground">Atividades agendadas que precisam de atenção</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">📈 Funil de Vendas</h4>
              <p className="text-sm text-muted-foreground">
                Visualização das oportunidades por etapa: Qualificação → Proposta → Negociação → Fechado
              </p>

              <h4 className="font-semibold mt-4">📋 Pipeline de Orçamentos</h4>
              <p className="text-sm text-muted-foreground">
                Arraste os cards entre colunas para atualizar o status dos orçamentos (Kanban).
              </p>

              <h4 className="font-semibold mt-4">🕐 Atividades Recentes</h4>
              <p className="text-sm text-muted-foreground">
                Lista das últimas ações realizadas (ligações, emails, reuniões, etc.)
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
                <UserPlus className="h-4 w-4" /> Criar Novo Contato
              </h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Novo Contato"</li>
                <li>Preencha nome e telefone (obrigatórios)</li>
                <li>Adicione email, cidade e observações (opcionais)</li>
                <li>Selecione o tipo: Lead, Cliente ou Inativo</li>
                <li>Clique em "Salvar"</li>
              </ol>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Contatos são criados automaticamente ao fazer orçamentos para novos telefones!
                </p>
              </div>

              <h4 className="font-semibold mt-4">🔍 Buscar e Filtrar</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use a barra de busca para encontrar por nome, telefone ou email</li>
                <li>• Filtre por tipo: Lead, Cliente ou Inativo</li>
                <li>• Clique no contato para ver detalhes completos</li>
              </ul>

              <h4 className="font-semibold mt-4">👤 Detalhes do Contato</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Estatísticas: total de orçamentos, valor médio, taxa de conversão</li>
                <li>• Timeline: histórico de todas as interações</li>
                <li>• Orçamentos: lista de orçamentos vinculados</li>
                <li>• Atividades: tarefas e follow-ups relacionados</li>
              </ul>

              <h4 className="font-semibold mt-4">🔄 Mesclar Contatos Duplicados</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Acesse a aba "Mesclar" no CRM</li>
                <li>Selecione dois contatos para mesclar</li>
                <li>Escolha qual será o contato principal</li>
                <li>Confirme a mesclagem (orçamentos e atividades são transferidos)</li>
              </ol>
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
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">📞 Ligação</div>
                <div className="p-3 border rounded-lg">📧 Email</div>
                <div className="p-3 border rounded-lg">🤝 Reunião</div>
                <div className="p-3 border rounded-lg">📋 Tarefa</div>
                <div className="p-3 border rounded-lg">💬 WhatsApp</div>
                <div className="p-3 border rounded-lg">📝 Outro</div>
              </div>

              <h4 className="font-semibold mt-4">➕ Criar Nova Atividade</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Nova Atividade"</li>
                <li>Selecione o tipo da atividade</li>
                <li>Preencha título e descrição</li>
                <li>Vincule a um contato e/ou orçamento</li>
                <li>Defina data e hora do lembrete (opcional)</li>
                <li>Salve a atividade</li>
              </ol>

              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg mt-4">
                <h4 className="font-semibold text-green-700 dark:text-green-300">⚡ Atividades Automáticas</h4>
                <ul className="text-sm text-green-600 dark:text-green-400 mt-2 space-y-1">
                  <li>• Orçamento enviado → cria atividade "Proposta enviada"</li>
                  <li>• Status "Sem Resposta" → cria atividade de follow-up</li>
                  <li>• Orçamento pago → cria atividade "Venda fechada"</li>
                </ul>
              </div>

              <h4 className="font-semibold mt-4">✅ Marcar como Concluída</h4>
              <p className="text-sm text-muted-foreground">
                Clique no checkbox ao lado da atividade para marcá-la como concluída.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: "orcamentos",
      title: "Orçamentos",
      icon: <FileText className="h-4 w-4" />,
      content: null,
      subsections: [
        {
          id: "orcamentos-criar",
          title: "Criar Orçamento",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Passo a Passo
              </h4>
              
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-blue-500 bg-muted/50 rounded-r-lg">
                  <h5 className="font-medium">1️⃣ Dados do Cliente</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Digite o telefone para buscar cliente existente</li>
                    <li>• Se não encontrar, preencha nome e dados</li>
                    <li>• O contato é criado automaticamente se for novo</li>
                  </ul>
                </div>

                <div className="p-3 border-l-4 border-green-500 bg-muted/50 rounded-r-lg">
                  <h5 className="font-medium">2️⃣ Adicionar Produtos</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Clique em "+ Cortina" ou outro tipo de produto</li>
                    <li>• Selecione tecido, trilho e acessórios</li>
                    <li>• Informe largura e altura</li>
                    <li>• Configure opções de instalação</li>
                  </ul>
                </div>

                <div className="p-3 border-l-4 border-amber-500 bg-muted/50 rounded-r-lg">
                  <h5 className="font-medium">3️⃣ Resumo e Desconto</h5>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Revise todos os itens e valores</li>
                    <li>• Aplique desconto se necessário (% ou R$)</li>
                    <li>• Adicione observações gerais</li>
                    <li>• Clique em "Salvar Orçamento"</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-status",
          title: "Status do Orçamento",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" /> Fluxo de Status
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="font-medium">Rascunho</span>
                  <span className="text-sm text-muted-foreground">→ Orçamento ainda não finalizado</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Finalizado</span>
                  <span className="text-sm text-muted-foreground">→ Pronto para enviar ao cliente</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium">Enviado</span>
                  <span className="text-sm text-muted-foreground">→ Cliente recebeu a proposta</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-medium">Sem Resposta</span>
                  <span className="text-sm text-muted-foreground">→ Aguardando retorno do cliente</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Pago</span>
                  <span className="text-sm text-muted-foreground">→ Venda concluída (100% pago)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">Recusado/Cancelado</span>
                  <span className="text-sm text-muted-foreground">→ Venda não concretizada</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  💡 <strong>Status Automático:</strong> O status muda automaticamente conforme os pagamentos são registrados (40%, 60%, 100%).
                </p>
              </div>
            </div>
          )
        },
        {
          id: "orcamentos-acoes",
          title: "Ações do Orçamento",
          content: (
            <div className="space-y-4">
              <h4 className="font-semibold">🔧 Ações Disponíveis</h4>
              
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📄 Gerar PDF</h5>
                  <p className="text-sm text-muted-foreground">Baixar orçamento formatado para enviar ao cliente</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">💰 Gerar Conta a Receber</h5>
                  <p className="text-sm text-muted-foreground">Criar parcelas de pagamento vinculadas ao orçamento</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📋 Registrar Custos</h5>
                  <p className="text-sm text-muted-foreground">Lançar contas a pagar (matéria-prima, fornecedores, etc.)</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📊 Ver Resumo Financeiro</h5>
                  <p className="text-sm text-muted-foreground">Visualizar lucro, custos e rentabilidade do orçamento</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">📜 Timeline</h5>
                  <p className="text-sm text-muted-foreground">Histórico de todas as alterações e atividades</p>
                </div>
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
              <h4 className="font-semibold">📊 Visão Geral</h4>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-green-600">Saldo do Período</h5>
                  <p className="text-sm text-muted-foreground">Entradas - Saídas = Resultado líquido</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-blue-600">Total de Entradas</h5>
                  <p className="text-sm text-muted-foreground">Soma de todos os recebimentos</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-red-600">Total de Saídas</h5>
                  <p className="text-sm text-muted-foreground">Soma de todos os pagamentos</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-amber-600">Pendente</h5>
                  <p className="text-sm text-muted-foreground">Valores a receber/pagar em aberto</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4">🔍 Filtros de Período</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Últimos 7, 30 ou 90 dias</li>
                <li>• Mês atual ou mês anterior</li>
                <li>• Período personalizado</li>
              </ul>

              <h4 className="font-semibold mt-4">📈 Gráficos</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fluxo de Caixa: evolução diária de entradas e saídas</li>
                <li>• Categorias: distribuição de despesas por categoria</li>
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

              <h4 className="font-semibold mt-4">➕ Criar Conta a Receber</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique em "Nova Conta a Receber"</li>
                <li>Preencha cliente, descrição e valor total</li>
                <li>Defina número de parcelas e data de vencimento</li>
                <li>Vincule a um orçamento (opcional)</li>
                <li>Salve para gerar as parcelas automaticamente</li>
              </ol>

              <h4 className="font-semibold mt-4">💰 Registrar Recebimento</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique na conta/parcela desejada</li>
                <li>Clique em "Registrar Recebimento"</li>
                <li>Informe valor recebido e forma de pagamento</li>
                <li>Confirme o recebimento</li>
              </ol>

              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ⚡ <strong>Automático:</strong> Quando 100% é pago, o orçamento vinculado muda para "Pago" e o contato é promovido a "Cliente".
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
                <li>Preencha descrição, valor e data de vencimento</li>
                <li>Selecione categoria (Fornecedor, Operacional, etc.)</li>
                <li>Vincule a um orçamento se for custo direto</li>
                <li>Marque como recorrente se aplicável</li>
              </ol>

              <h4 className="font-semibold mt-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Contas Recorrentes
              </h4>
              <p className="text-sm text-muted-foreground">
                Contas marcadas como recorrentes são geradas automaticamente conforme a frequência configurada (mensal, semanal, etc.).
              </p>

              <h4 className="font-semibold mt-4">✅ Registrar Pagamento</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Clique na conta desejada</li>
                <li>Clique em "Marcar como Pago"</li>
                <li>Informe a data de pagamento</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>
          )
        }
      ]
    },
    {
      id: "integracoes",
      title: "Integrações Automáticas",
      icon: <RefreshCw className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O sistema possui diversas automações para facilitar o trabalho:
          </p>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400">📝 Ao Criar Orçamento</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Contato criado automaticamente (se telefone novo)</li>
                <li>✓ Orçamento vinculado ao contato</li>
                <li>✓ Oportunidade criada no funil de vendas</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400">📤 Ao Mudar Status do Orçamento</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Oportunidade atualizada no funil</li>
                <li>✓ Atividade registrada automaticamente</li>
                <li>✓ Follow-up criado (quando aplicável)</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600 dark:text-green-400">💰 Ao Registrar Pagamento</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Status do orçamento atualizado (40% → 60% → 100%)</li>
                <li>✓ Contato promovido a "Cliente" (quando 100%)</li>
                <li>✓ Valor total gasto do contato recalculado</li>
                <li>✓ Oportunidade fechada como "Ganho"</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-red-600 dark:text-red-400">❌ Ao Recusar/Cancelar Orçamento</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Oportunidade fechada como "Perdido"</li>
                <li>✓ Atividade de perda registrada</li>
              </ul>
            </div>
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
            <h1 className="font-semibold">Manual do Sistema</h1>
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 border-r min-h-[calc(100vh-3.5rem)] py-6 pr-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
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
