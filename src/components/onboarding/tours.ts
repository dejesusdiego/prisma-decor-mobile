export interface TourStep {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: 'sidebar',
    title: 'Menu de Navegação',
    description: 'Use o menu lateral para acessar todos os módulos: Dashboard, Orçamentos, CRM, Produção e Financeiro.',
    position: 'right',
  },
  {
    id: 'novo-orcamento',
    title: 'Criar Novo Orçamento',
    description: 'Clique aqui para iniciar um novo orçamento. O sistema guiará você pelo processo em 3 etapas simples.',
    position: 'bottom',
  },
  {
    id: 'stats-cards',
    title: 'Métricas Principais',
    description: 'Acompanhe suas métricas em tempo real: total de orçamentos, valor total, taxa de conversão e mais.',
    position: 'bottom',
  },
  {
    id: 'filtro-periodo',
    title: 'Filtro de Período',
    description: 'Filtre os dados por período: últimos 7 dias, 30 dias, 90 dias ou todo o histórico.',
    position: 'bottom',
  },
  {
    id: 'orcamentos-recentes',
    title: 'Orçamentos Recentes',
    description: 'Veja seus orçamentos mais recentes. Clique em qualquer um para ver detalhes ou editar.',
    position: 'top',
  },
];

export const NOVO_ORCAMENTO_TOUR: TourStep[] = [
  {
    id: 'etapa-cliente',
    title: 'Dados do Cliente',
    description: 'Preencha os dados do cliente. O telefone é usado para vincular automaticamente ao CRM.',
    position: 'right',
  },
  {
    id: 'adicionar-produto',
    title: 'Adicionar Produtos',
    description: 'Adicione cortinas, persianas, papéis de parede e outros produtos ao orçamento.',
    position: 'bottom',
  },
  {
    id: 'calculos-automaticos',
    title: 'Cálculos Automáticos',
    description: 'Os custos são calculados automaticamente com base nos materiais e serviços selecionados.',
    position: 'left',
  },
  {
    id: 'gerar-pdf',
    title: 'Gerar PDF',
    description: 'Finalize gerando o PDF do orçamento para enviar ao cliente.',
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
