# 📊 Relatório Comparativo - Documentos do Projeto

**Data:** 2026-01-16  
**Objetivo:** Comparar documentos novos com documentos antigos e identificar inconsistências

---

## 📋 DOCUMENTOS ANALISADOS

### Documentos Novos (2026-01-16):
1. `EXPANSAO_ERP_GENERALIZACAO.md`
2. `PLANO_EXECUCAO_FUTURO.md`
3. `RESUMO_EXECUTIVO_EXPANSAO.md`

### Documentos Antigos (Relevantes):
1. `BACKLOG_FUNCIONALIDADES.md`
2. `REBRANDING_STUDIOOS.md`
3. `LANDING_PAGES_PERSONALIZADAS.md`
4. `REVISAO_ARQUITETURA_COMPLETA.md`
5. `REVISAO_ARQUITETURA_DETALHADA.md`
6. `RESUMO_AUDITORIA_SISTEMA.md`
7. `MODELO_NEGOCIO.md`
8. `DIAGNOSTICO_FEEDBACKS_USUARIOS.md`
9. `RESUMO_EXECUTIVO_FEEDBACKS.md`

---

## ✔️ FUNCIONALIDADES CONFIRMADAS (já existem e estão estáveis)

- Sistema multi-tenant completo
- Módulo de Orçamentos (wizard, PDF, importação)
- Módulo de CRM (contatos, pipeline, atividades, calendário)
- Módulo de Produção (Kanban, pedidos, instalações)
- Módulo Financeiro (contas pagar/receber, conciliação, comissões)
- Planos e Assinaturas (feature flags, limites)
- Autenticação e autorização (roles admin/user)
- Onboarding interativo
- Notificações do sistema
- Temas (light/dark mode)
- Gestão de usuários (criar, alterar senha)
- Landing Pages Personalizadas (base criada)
- RLS policies implementadas
- Triggers e funções RPC
- Histórico de alterações de status (`log_alteracoes_status`)
- Comissões básicas
- Conciliação bancária
- Relatórios financeiros (BI)
- Dashboard financeiro
- Dashboard de orçamentos
- Dashboard de produção
- Calendário integrado
- Solicitações de visita
- Importação de dados (CSV)
- Geração de PDF de orçamentos

---

## ➕ FUNCIONALIDADES PROPOSTAS (ainda não implementadas, mas presentes nos novos documentos)

### Módulo Site (Website Builder):
- Editor visual de páginas (drag & drop)
- Templates de páginas pré-definidos
- Gerenciamento de seções (Hero, Sobre, Produtos, Contato)
- Upload e gerenciamento de imagens
- Cores e temas personalizados
- Fontes customizadas
- Layout responsivo
- Preview em tempo real
- Versões de páginas (histórico)
- Editor de posts (rich text / markdown)
- Categorias e tags de blog
- Comentários (moderação)
- SEO (meta tags, sitemap, robots.txt)
- Agendamento de publicações
- Galeria de imagens
- Compartilhamento social
- RSS feed
- Busca de posts
- Controle de acesso por página
- Área de membros/clientes
- Login/registro de visitantes
- Permissões por perfil
- Analytics integrado
- Visitas e sessões
- Páginas mais visitadas
- Taxa de conversão
- Origem do tráfego
- Heatmaps
- Funil de conversão
- Relatórios exportáveis
- Integração com Google Analytics
- Sistema de avaliações/reviews
- Moderação de avaliações
- Exibição de avaliações no site
- Integração com Google Reviews
- Notificações de novas avaliações
- Widget de avaliações
- Badge de avaliação

### Landing Page de Vendas (StudioOS):
- Hero section com proposta de valor
- Demonstração do sistema (vídeo/demo)
- Planos e preços
- Depoimentos de clientes
- Comparativo de features
- FAQ
- CTA para trial/demo
- Integração com formulário de contato
- Link para área de login
- Trial gratuito
- Onboarding de novos clientes
- Conversão de visitantes em leads
- Integração com CRM

### Painel Admin Supremo:
- Visão geral de todas as organizações
- Métricas globais (MRR, ARR, Churn)
- Organizações ativas/inativas
- Usuários totais
- Uso de recursos por organização
- Alertas e notificações
- Gráficos e visualizações
- Criar/editar/deletar organizações
- Ativar/desativar organizações
- Alterar planos de assinatura
- Gerenciar feature flags por organização
- Histórico de alterações
- Exportação de dados
- Listar todos os usuários
- Criar usuários super admin
- Gerenciar permissões
- Bloquear/desbloquear usuários
- Auditoria de ações
- Reset de senha
- Criar/editar/deletar planos
- Configurar limites e features
- Histórico de mudanças de preço
- Teste A/B de preços
- Receita por período
- Churn rate
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Uso de features por organização
- Exportação de relatórios
- Dashboards customizáveis
- Configurações do sistema
- Integrações (Stripe, Pagar.me, etc.)
- Templates de email
- Notificações do sistema
- Manutenção do sistema
- Backup e restore
- Tickets de suporte
- Chat com organizações
- Base de conhecimento
- Logs de erros
- Monitoramento de performance

### Generalização de Produtos:
- Tabela `product_categories` (substitui categorias hardcoded)
- Tabela `product_types` (configuração por tipo)
- Tabela `products` (substitui `materiais`)
- Tabela `product_variants` (variações de produtos)
- Tabela `order_items` (substitui `cortina_items`)
- Migração de dados existentes
- Componentes genéricos de produtos
- UI adaptativa baseada em configuração
- Cálculos genéricos (não hardcoded)

### Módulo de Estoque:
- Tabela `warehouses` (depósitos/lojas)
- Tabela `inventory_items` (itens em estoque)
- Tabela `inventory_movements` (movimentações)
- Controle de estoque por produto/depósito
- Alertas de estoque mínimo
- Histórico de movimentações
- Integração automática com orçamentos/pedidos
- Dashboard de estoque
- Entrada/saída rápida
- Relatórios de estoque

### Módulo de Integrações:
- Tabela `integration_categories` (Marketing, Fiscal, etc.)
- Tabela `integration_providers` (Google Ads, PlugNotas, etc.)
- Tabela `connected_integrations` (conexões ativas)
- Tabela `integration_logs` (logs de sincronização)
- UI de integrações plug-and-play
- Validação de credenciais
- Drivers abstratos para cada provedor
- Integração Google Ads
- Integração Meta Ads
- Integração Google Analytics
- Integração PlugNotas (NF-e)
- Integração WhatsApp Business API
- Webhook genérico

### Funcionalidades Avançadas:
- Permissões granulares por usuário/módulo
- Audit log completo (todas as ações)
- Timeline de pedidos/orçamentos (tipo Kibana)
- API pública REST documentada
- Módulo de tarefas/checklist
- Módulo de garantias e pós-venda
- Comissões avançadas (regras complexas)
- Módulo de metas e performance
- Calendário integrado (Google Calendar, Outlook)
- Sistema de arquivos/anexos
- Templates de orçamento personalizáveis
- Mensagens internas (chat/comentários)
- Painel Admin Multi-empresas expandido
- Multi-lojas/Multi-depósitos
- Integração com gateways de pagamento (Stripe, Pagar.me)
- Sistema de assinatura recorrente interno completo
- Webhooks de eventos
- Automações internas (workflows)
- Dashboards personalizáveis (widgets arrastáveis)
- Centros de custo
- Pipelines avançados (estágios customizáveis)

### Correções de Bugs (do DIAGNOSTICO_FEEDBACKS):
- Apagar/desativar usuário
- Melhorar edição de contas a receber
- Corrigir status "atrasado" após pagamento
- Sincronizar orçamento ↔ contas a receber
- Corrigir dashboard com dados zerados
- Remover botão "Novo Orçamento" duplicado
- Adicionar legendas nos gráficos
- Adicionar tooltips nos ícones
- Separar campo de endereço (rua, número, CEP)
- Implementar "Esqueci minha senha"
- Adicionar paginação visível
- Adicionar filtros (data, vendedor)
- Adicionar ordenação de colunas
- Adicionar histórico de atividades

---

## 🔄 FUNCIONALIDADES DUPLICADAS (mesma ideia listada em documentos diferentes)

- **Módulo Site - Personalização**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Módulo Site - Blog**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Módulo Site - Métricas**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Módulo Site - Avaliações**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Landing Page de Vendas**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Painel Admin Supremo**: Listado em `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md`
- **Módulo de Estoque**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` e mencionado como "falta" em comparação com ERPs
- **Módulo de Integrações**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` e mencionado como "falta" em comparação com ERPs
- **Permissões Granulares**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e `DIAGNOSTICO_FEEDBACKS_USUARIOS.md` (implícito)
- **Audit Log Completo**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como "histórico de atividades" em `DIAGNOSTICO_FEEDBACKS_USUARIOS.md`
- **API Pública**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como "Enterprise only" em `MODELO_NEGOCIO.md`
- **Webhooks**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (módulo integrações) e mencionado como funcionalidade a adaptar de ERPs genéricos
- **Multi-loja**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como usar `warehouses` no módulo de estoque
- **Templates de Orçamento**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como funcionalidade padrão em ERPs
- **Mensagens Internas**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como funcionalidade padrão em ERPs
- **Calendário Integrado**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e já existe parcialmente (mencionado em `REVISAO_ARQUITETURA_COMPLETA.md`)
- **Sistema de Arquivos/Anexos**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como funcionalidade padrão em ERPs
- **Comissões Avançadas**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e já existe básico (mencionado em `REVISAO_ARQUITETURA_COMPLETA.md`)
- **Metas e Performance**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como funcionalidade padrão em ERPs
- **Garantias e Pós-venda**: Listado em `EXPANSAO_ERP_GENERALIZACAO.md` (melhorias essenciais) e mencionado como "falta" em comparação com ERPs de nicho

---

## ⚠️ FUNCIONALIDADES INCOERENTES OU CONTRADITÓRIAS

### 1. Estoque - Nível de Complexidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Propõe módulo completo com `warehouses`, `inventory_items`, `inventory_movements`, alertas, relatórios
- **REVISAO_ARQUITETURA_COMPLETA.md**: Menciona que estoque "falta" mas não detalha complexidade
- **MODELO_NEGOCIO.md**: Não menciona estoque em nenhum plano
- **Contradição**: Um documento propõe estoque completo, outros não mencionam ou mencionam como simples

### 2. API Pública - Disponibilidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Lista como "Must-Have (P0)" e propõe implementação em Q2 2026
- **MODELO_NEGOCIO.md**: Lista como "Enterprise only" (plano mais caro)
- **Contradição**: Um documento diz que é essencial, outro diz que é apenas para Enterprise

### 3. WhatsApp Integrado - Disponibilidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Lista como integração no módulo de integrações (plug-and-play)
- **MODELO_NEGOCIO.md**: Lista como "Enterprise only"
- **Contradição**: Um documento propõe como integração genérica, outro como feature Enterprise

### 4. NF-e - Disponibilidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Lista como integração PlugNotas no módulo de integrações
- **MODELO_NEGOCIO.md**: Lista como "Business e Enterprise only"
- **Contradição**: Um documento propõe como integração genérica, outro como feature de planos específicos

### 5. Módulo de Estoque - Opcionalidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Propõe como módulo completo e essencial
- **REVISAO_ARQUITETURA_COMPLETA.md**: Menciona como "falta" mas não detalha
- **MODELO_NEGOCIO.md**: Não menciona em nenhum plano
- **Contradição**: Um documento propõe como essencial, outros não mencionam ou mencionam como opcional

### 6. Permissões - Nível de Granularidade
- **EXPANSAO_ERP_GENERALIZACAO.md**: Propõe permissões granulares por módulo/funcionalidade (Must-Have P0)
- **REVISAO_ARQUITETURA_COMPLETA.md**: Menciona apenas roles básicos (admin/user) como implementado
- **DIAGNOSTICO_FEEDBACKS_USUARIOS.md**: Não menciona permissões granulares
- **Contradição**: Um documento propõe como essencial, outros não mencionam necessidade

### 7. Audit Log - Nível de Completude
- **EXPANSAO_ERP_GENERALIZACAO.md**: Propõe "log completo de todas as ações" (Must-Have P0)
- **REVISAO_ARQUITETURA_COMPLETA.md**: Menciona `log_alteracoes_status` como existente (apenas status)
- **DIAGNOSTICO_FEEDBACKS_USUARIOS.md**: Menciona "sem histórico de atividades" como bug
- **Contradição**: Um documento propõe log completo, outro menciona que já existe parcialmente, outro diz que falta

### 8. Rebranding - Status
- **REBRANDING_STUDIOOS.md**: Lista todas as áreas a atualizar (Frontend, Landing Page, Documentação, Banco, Integrações)
- **PLANO_EXECUCAO_FUTURO.md**: Menciona "Sistema renomeado para StudioOS" mas não lista como tarefa
- **Contradição**: Um documento lista como checklist completo, outro apenas menciona como feito

### 9. Landing Pages Personalizadas - Status
- **LANDING_PAGES_PERSONALIZADAS.md**: Lista como "✅ Implementado" com base criada
- **PLANO_EXECUCAO_FUTURO.md**: Lista como "✅ Criada base de Landing Pages Personalizadas"
- **BACKLOG_FUNCIONALIDADES.md**: Não menciona landing pages personalizadas
- **Contradição**: Alguns documentos dizem que está implementado, outros não mencionam

### 10. Multi-loja - Implementação
- **EXPANSAO_ERP_GENERALIZACAO.md**: Propõe usar `warehouses` como lojas (melhorias essenciais)
- **REVISAO_ARQUITETURA_COMPLETA.md**: Não menciona multi-loja
- **MODELO_NEGOCIO.md**: Não menciona multi-loja
- **Contradição**: Um documento propõe, outros não mencionam

---

## 🗑️ FUNCIONALIDADES PARA REMOVER (obsoletas / específicas demais / irrelevantes)

### Específicas para Cortinas/Persianas (serão substituídas):
- Tabela `cortina_items` (substituir por `order_items`)
- Tabela `materiais` com categorias hardcoded (substituir por `products`)
- Interface `Cortina` específica (substituir por interface genérica)
- Componentes específicos: `CortinaCard`, `PersianaCard`, `PapelCard`, `MotorizadoCard`, `AcessoriosCard` (substituir por componentes genéricos)
- Funções de cálculo específicas: `calcularCustosCortina()`, `calcularConsumoMaterial()` (substituir por cálculos genéricos)
- Coeficientes hardcoded: `COEFICIENTES_CORTINA`, `COEFICIENTES_FORRO` (mover para configuração)
- Fluxo de produção hardcoded: 'corte', 'costura', 'acabamento' (substituir por fluxo configurável)
- Textos hardcoded: "Cortinas", "Persianas" em vários componentes (substituir por textos dinâmicos)

### Obsoletas ou Não Relevantes:
- Nenhuma funcionalidade obsoleta identificada (sistema está em evolução, não há funcionalidades antigas a remover)

---

## 📌 FUNCIONALIDADES FALTANTES (deveriam estar no ERP mas não estão listadas em lugar nenhum)

### Gestão e Administração:
- Backup e restore de dados (mencionado em Admin Supremo mas não detalhado)
- Exportação completa de dados (mencionado mas não detalhado)
- Importação de dados em massa (existe CSV mas não detalhado para todos os módulos)
- Versionamento de configurações
- Rollback de alterações
- Logs de sistema (erros, performance)
- Monitoramento de saúde do sistema
- Alertas de sistema (downtime, erros críticos)

### Segurança:
- Autenticação de dois fatores (2FA)
- Sessões simultâneas (limite de dispositivos)
- Logs de acesso (login/logout)
- Bloqueio de IPs suspeitos
- Política de senhas (complexidade, expiração)
- Criptografia de dados sensíveis (além do padrão)

### Comunicação:
- Notificações por email (mencionado mas não detalhado)
- Notificações push (navegador)
- Notificações SMS
- Central de notificações (histórico)
- Preferências de notificação por usuário

### Relatórios e Analytics:
- Exportação de relatórios em múltiplos formatos (PDF, Excel, CSV)
- Agendamento de relatórios (envio automático)
- Relatórios customizáveis pelo usuário
- Comparativos de períodos
- Projeções e previsões
- Análise de tendências avançada

### Integrações Específicas:
- Integração com ERPs externos (SAP, TOTVS, etc.)
- Integração com marketplaces (Mercado Livre, Amazon, etc.)
- Integração com sistemas de frete (Jadlog, TNT, etc.)
- Integração com sistemas de pagamento online (Stripe, Pagar.me - mencionado mas não detalhado)
- Integração com sistemas de contabilidade (Contábil, etc.)

### Funcionalidades de Negócio:
- Gestão de fornecedores (cadastro completo, avaliações)
- Gestão de transportadoras
- Cálculo de frete automático
- Gestão de devoluções
- Gestão de trocas
- Cupons de desconto
- Promoções e campanhas
- Programa de fidelidade
- Gestão de contratos
- Gestão de propostas comerciais
- Assinatura digital de documentos
- Gestão de documentos (upload, versionamento)

### Produção Avançada:
- Gestão de equipes de produção
- Alocação de recursos
- Capacidade de produção
- Previsão de entrega automática
- Gestão de qualidade (checklists, inspeções)
- Rastreabilidade de produtos
- Gestão de lotes e séries

### Financeiro Avançado:
- DRE (Demonstração de Resultados)
- Balanço patrimonial
- Fluxo de caixa projetado (além do previsto)
- Análise de rentabilidade por produto
- Análise de rentabilidade por cliente
- Análise de rentabilidade por vendedor
- Gestão de inadimplência
- Cobrança automática
- Conciliação automática avançada (IA)
- Previsão de recebimentos
- Previsão de pagamentos

### CRM Avançado:
- Segmentação de clientes
- Campanhas de marketing
- Email marketing integrado
- SMS marketing
- Automação de follow-ups
- Score de leads
- Previsão de vendas
- Gestão de contratos
- Gestão de SLA

### Suporte:
- Base de conhecimento para clientes
- Chat em tempo real
- Sistema de tickets (mencionado em Admin Supremo mas não detalhado)
- FAQ dinâmico
- Tutoriais interativos
- Vídeos de ajuda

---

## 📈 SUGESTÕES DE ADIÇÃO (funcionalidades úteis identificadas a partir da comparação)

### Essenciais para ERP Profissional:
- Sistema de backup automático (diário, semanal, mensal)
- Restore point-in-time
- Exportação completa de dados (compliance LGPD)
- Importação de dados em massa (todos os módulos)
- Versionamento de configurações críticas
- Logs de auditoria completos (quem, quando, o que, antes, depois)
- Monitoramento de performance em tempo real
- Alertas proativos (estoque baixo, vencimentos, etc.)
- Dashboard de saúde do sistema
- Métricas de uso por organização
- Limites de uso por plano (além de feature flags)
- Autenticação de dois fatores (2FA)
- Política de senhas configurável
- Sessões simultâneas (limite de dispositivos)
- Logs de acesso (login/logout, IPs)
- Criptografia de dados sensíveis
- Notificações por email configuráveis
- Notificações push (navegador)
- Central de notificações (histórico, preferências)
- Exportação de relatórios (PDF, Excel, CSV)
- Agendamento de relatórios (envio automático)
- Relatórios customizáveis pelo usuário
- Comparativos de períodos
- Projeções e previsões
- Análise de tendências avançada

### Integrações Comerciais:
- Integração com marketplaces (Mercado Livre, Amazon)
- Integração com sistemas de frete (Jadlog, TNT, Correios)
- Integração com sistemas de contabilidade
- Integração com ERPs externos (SAP, TOTVS)
- Gateway de pagamento completo (Stripe, Pagar.me)

### Funcionalidades de Negócio:
- Gestão de fornecedores completa
- Gestão de transportadoras
- Cálculo de frete automático
- Gestão de devoluções
- Gestão de trocas
- Cupons de desconto
- Promoções e campanhas
- Programa de fidelidade
- Gestão de contratos
- Assinatura digital de documentos
- Gestão de documentos (upload, versionamento)

### Produção Avançada:
- Gestão de equipes de produção
- Alocação de recursos
- Capacidade de produção
- Previsão de entrega automática
- Gestão de qualidade (checklists, inspeções)
- Rastreabilidade de produtos
- Gestão de lotes e séries

### Financeiro Avançado:
- DRE (Demonstração de Resultados)
- Balanço patrimonial
- Análise de rentabilidade por produto/cliente/vendedor
- Gestão de inadimplência
- Cobrança automática
- Conciliação automática avançada (IA)
- Previsão de recebimentos/pagamentos

### CRM Avançado:
- Segmentação de clientes
- Campanhas de marketing
- Email marketing integrado
- SMS marketing
- Automação de follow-ups
- Score de leads
- Previsão de vendas
- Gestão de SLA

### Suporte ao Cliente:
- Base de conhecimento para clientes
- Chat em tempo real
- Sistema de tickets completo
- FAQ dinâmico
- Tutoriais interativos
- Vídeos de ajuda

---

## 📝 OBSERVAÇÕES FINAIS

### Documentos Bem Alinhados:
- `BACKLOG_FUNCIONALIDADES.md` e `PLANO_EXECUCAO_FUTURO.md` estão bem alinhados sobre Módulo Site e Admin Supremo
- `REVISAO_ARQUITETURA_COMPLETA.md` e `REVISAO_ARQUITETURA_DETALHADA.md` são consistentes sobre estrutura atual
- `DIAGNOSTICO_FEEDBACKS_USUARIOS.md` e `RESUMO_EXECUTIVO_FEEDBACKS.md` são consistentes sobre bugs

### Documentos com Divergências:
- `EXPANSAO_ERP_GENERALIZACAO.md` propõe funcionalidades que conflitam com `MODELO_NEGOCIO.md` (API, WhatsApp, NF-e)
- `EXPANSAO_ERP_GENERALIZACAO.md` propõe estoque completo, mas `MODELO_NEGOCIO.md` não menciona
- `REBRANDING_STUDIOOS.md` lista checklist completo, mas `PLANO_EXECUCAO_FUTURO.md` apenas menciona

### Recomendações:
1. **Unificar visão de API/Integrações**: Decidir se API pública é Enterprise-only ou disponível para todos
2. **Definir escopo de Estoque**: Decidir se estoque é módulo completo ou opcional
3. **Priorizar Rebranding**: Se StudioOS é o nome oficial, completar checklist do `REBRANDING_STUDIOOS.md`
4. **Resolver contradições de planos**: Alinhar `MODELO_NEGOCIO.md` com propostas de `EXPANSAO_ERP_GENERALIZACAO.md`
5. **Consolidar funcionalidades duplicadas**: Criar documento único de referência

---

**Este relatório deve ser usado para revisão manual e decisões de priorização.**
