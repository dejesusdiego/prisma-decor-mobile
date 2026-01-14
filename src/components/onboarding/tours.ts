export interface TourStep {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export type TourId = 'dashboard' | 'wizard' | 'crm';

export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: 'novo-orcamento',
    title: 'Criar Novo Orçamento',
    description: 'Clique aqui para iniciar um novo orçamento. O sistema guiará você pelo processo em 3 etapas simples: cliente, produtos e resumo.',
    position: 'bottom',
  },
  {
    id: 'stats-cards',
    title: 'Métricas Principais',
    description: 'Acompanhe suas métricas em tempo real: total de orçamentos, valor total, taxa de conversão, valores a receber e tempo médio de conversão.',
    position: 'bottom',
  },
  {
    id: 'filtro-periodo',
    title: 'Filtro de Período',
    description: 'Filtre os dados por período: últimos 7 dias, 30 dias, 90 dias, 12 meses ou todo o histórico. Use o botão de refresh para atualizar os dados.',
    position: 'bottom',
  },
  {
    id: 'orcamentos-recentes',
    title: 'Orçamentos Recentes',
    description: 'Veja seus orçamentos mais recentes. Clique em qualquer um para ver detalhes completos, editar ou gerar PDF. Use "Ver todos" para acessar a lista completa.',
    position: 'top',
  },
];

export const WIZARD_TOUR: TourStep[] = [
  // Etapa 1 - Cliente
  {
    id: 'wizard-telefone',
    title: 'Telefone e Vínculo CRM',
    description: 'O telefone é usado para vincular automaticamente ao CRM. Se o contato existir, os dados serão preenchidos.',
    position: 'right',
  },
  {
    id: 'wizard-vendedor',
    title: 'Vendedor Responsável',
    description: 'Selecione o vendedor para cálculo automático de comissão.',
    position: 'right',
  },
  // Etapa 2 - Produtos
  {
    id: 'wizard-adicionar-produtos',
    title: 'Adicionar Produtos',
    description: 'Clique nos botões para adicionar cortinas, persianas, acessórios e outros produtos.',
    position: 'bottom',
  },
  {
    id: 'wizard-lista-produtos',
    title: 'Reordenar Itens',
    description: 'Arraste os itens pelo ícone de grade para reorganizar a ordem no orçamento.',
    position: 'top',
  },
  // Etapa 3 - Resumo
  {
    id: 'wizard-margem',
    title: 'Margem de Lucro',
    description: 'Escolha a margem de lucro: Padrão (61,5%), Promoção (50%) ou Personalizada.',
    position: 'right',
  },
  {
    id: 'wizard-desconto',
    title: 'Aplicar Desconto',
    description: 'Aplique desconto por percentual ou valor fixo. O histórico de descontos é registrado.',
    position: 'right',
  },
  {
    id: 'wizard-gerar-pdf',
    title: 'Gerar PDF',
    description: 'Finalize gerando o PDF para enviar ao cliente. Escolha a validade do orçamento.',
    position: 'top',
  },
];

export const CRM_TOUR: TourStep[] = [
  {
    id: 'lista-contatos',
    title: 'Lista de Contatos',
    description: 'Gerencie todos os seus leads e clientes em um só lugar. Filtre por status, origem e muito mais.',
    position: 'right',
  },
  {
    id: 'pipeline',
    title: 'Pipeline de Vendas',
    description: 'Acompanhe o funil de vendas e veja a progressão dos orçamentos por etapa.',
    position: 'bottom',
  },
  {
    id: 'atividades',
    title: 'Atividades e Follow-ups',
    description: 'Registre ligações, visitas, e-mails e outras interações com clientes.',
    position: 'left',
  },
];
