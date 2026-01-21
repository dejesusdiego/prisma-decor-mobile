# ✅ Checklist de MVP - StudioOS

**Data de Criação:** 2026-01-16  
**Última Atualização:** 2026-01-16

---

## 🔴 FASE 1: CORREÇÕES CRÍTICAS (BLOQUEADORES)

### Bugs Críticos
- [ ] **🐞 CRÍTICO:** Corrigir popup de tour aparecendo em LPs públicas (`/studioos`, `/lp/:slug`)
  - [ ] Modificar `OnboardingProvider` para verificar rotas públicas
  - [ ] Testar em `/studioos`
  - [ ] Testar em `/lp/:slug`
  - [ ] Deploy e validação
  
- [ ] Remover botão "Novo Orçamento" duplicado
  - [ ] Identificar locais de duplicação
  - [ ] Remover duplicata
  - [ ] Testar navegação

- [ ] Testar "Esqueci minha senha"
  - [ ] Verificar funcionamento completo
  - [ ] Corrigir se necessário

---

## 🟠 FASE 2: MVP CORE (OBRIGATÓRIO)

### Sprint 1: Bugs e UX Básica
- [ ] Soft delete de usuários
  - [ ] Adicionar campo `deleted_at` ou `active` em users
  - [ ] UI para desativar usuário
  - [ ] Filtrar usuários deletados nas listagens

- [ ] Paginação em listagens
  - [ ] Orçamentos
  - [ ] Contas a receber
  - [ ] Contas a pagar
  - [ ] Contatos/CRM

- [ ] Filtros em orçamentos
  - [ ] Filtro por data
  - [ ] Filtro por vendedor
  - [ ] UI de filtros

- [ ] Ordenação de colunas
  - [ ] Tabelas clicáveis
  - [ ] Indicadores visuais (setas)

### Sprint 2: Estoque Simples OPCIONAL
- [ ] Criar tabelas
  - [ ] `inventory_items` (produto_id, quantidade_atual, estoque_minimo)
  - [ ] `inventory_movements` (tipo, quantidade, motivo)

- [ ] Adicionar campos de configuração
  - [ ] `controla_estoque BOOLEAN` em `organizations`
  - [ ] `controla_estoque BOOLEAN` em `materiais`

- [ ] UI de estoque
  - [ ] Dashboard de estoque (só aparece se habilitado)
  - [ ] Lista de itens
  - [ ] Entrada/saída rápida

- [ ] Trigger CONDICIONAL
  - [ ] Baixar estoque apenas se `controla_estoque = true`
  - [ ] Testar com estoque desabilitado

- [ ] Toggle em Configurações
  - [ ] "Controlar Estoque" (on/off)
  - [ ] Persistir configuração

### Sprint 3: Supplier V1 + Guia de Costura
- [ ] Criar tabelas
  - [ ] `suppliers` (nome, cnpj, contato, email, telefone)
  - [ ] `supplier_materials` (supplier_id, material_id, preco, codigo_fornecedor)

- [ ] UI de fornecedores
  - [ ] Cadastro de fornecedores
  - [ ] Lista de fornecedores
  - [ ] Vínculo fornecedor → materiais

- [ ] Importação de tabela de preços
  - [ ] Parser CSV
  - [ ] Validação de dados
  - [ ] Preview antes de importar

- [ ] Guia de costura em PDF
  - [ ] Template de PDF
  - [ ] Função `gerarPdfProducao.ts`
  - [ ] Botão na ficha do pedido
  - [ ] Conteúdo: item, medidas, materiais, observações

---

## 🟡 FASE 3: AUTOMAÇÕES E INTEGRAÇÕES

### Sprint 4: Automações Core
- [ ] Automação: Pedido pronto → sugerir agendar instalação
  - [ ] Trigger quando pedido status = 'pronto'
  - [ ] Criar notificação/alerta
  - [ ] UI para agendar instalação

- [ ] Automação: Instalação concluída → pedido entregue
  - [ ] Trigger quando instalação status = 'concluida'
  - [ ] Atualizar pedido status = 'entregue'

- [ ] Automação: Lead → Cliente automático
  - [ ] Quando orçamento aprovado
  - [ ] Atualizar `contatos.tipo = 'cliente'`

- [ ] Automação: Preencher orçamento com dados do lead
  - [ ] Quando criar orçamento a partir de lead
  - [ ] Preencher automaticamente dados do cliente

### Sprint 5: Integração LP → CRM
- [ ] Criar endpoint/Edge Function
  - [ ] `POST /api/leads` (ou Edge Function Supabase)
  - [ ] Aceitar dados do formulário da LP

- [ ] Criar lead automaticamente
  - [ ] Inserir em `contatos` com `tipo = 'lead'`
  - [ ] Se houver solicitação de visita, criar `solicitacoes_visita`

- [ ] Documentação
  - [ ] Documentar integração
  - [ ] Exemplos de uso
  - [ ] Guia para conectar LPs externas

---

## 🟢 FASE 4: ADIÇÕES AO MVP

### Sprint 6: Funcionalidades Adicionais
- [ ] Sistema de rodízio de vendedores no WhatsApp
  - [ ] Campos em `organizations`: `whatsapp_rodizio_ativo`, `whatsapp_vendedores`
  - [ ] Função helper para obter próximo vendedor
  - [ ] Atualizar `WhatsAppButton` nas LPs
  - [ ] UI em Configurações para gerenciar lista

- [ ] Geração de recibos de pagamento em PDF
  - [ ] Template de recibo
  - [ ] Função `gerarPdfRecibo.ts`
  - [ ] Campo `numero_recibo` em `parcelas_receber`
  - [ ] Botão "Gerar Recibo" na UI de pagamentos

- [ ] Geração de guias de produção/costureira em PDF
  - [ ] Template de guia de produção (mais detalhado)
  - [ ] Função `gerarPdfGuiaProducao.ts`
  - [ ] Botão "Gerar Guia de Produção" na ficha do pedido

- [ ] Estrutura inicial do portal de fornecedores
  - [ ] Criar tabela `suppliers` com `user_id`
  - [ ] RLS básico para fornecedores
  - [ ] Rota `/fornecedor/login` e `/fornecedor/dashboard`
  - [ ] Página de login para fornecedores
  - [ ] Dashboard básico (placeholder)
  - [ ] Configurar subdomínio `fornecedores.studioos.pro` (DNS)

---

## 🔵 FASE 5: PAINEL SUPREMO E MELHORIAS

### Sprint 7: Painel Supremo Básico
- [ ] Rota `/admin` (protegida para super admins)
  - [ ] Verificar role de super admin
  - [ ] Redirecionar se não for super admin

- [ ] Listar organizações
  - [ ] Query todas as organizações (bypass RLS)
  - [ ] Campos: nome, CNPJ/ID, cidade/UF, plano, status, data criação, contagem de usuários

- [ ] Ações administrativas
  - [ ] Ativar/desativar organizações
  - [ ] Ajustar plano de cada organização
  - [ ] Ver uso básico (número de orçamentos, pedidos, etc.)

### Sprint 8: Melhorias de UX
- [ ] Legendas em gráficos
  - [ ] Componente `Legend` renderizado
  - [ ] Testar em todos os gráficos

- [ ] Tooltips em ícones
  - [ ] Adicionar `Tooltip` em ícones explicativos
  - [ ] Textos descritivos

- [ ] Melhorar feedback visual em automações
  - [ ] Toast quando trigger dispara
  - [ ] Indicadores visuais de automação

---

## 📊 PROGRESSO GERAL

### Por Fase
- **Fase 1 (Críticas):** 0/3 (0%)
- **Fase 2 (MVP Core):** 0/15 (0%)
- **Fase 3 (Automações):** 0/5 (0%)
- **Fase 4 (Adições):** 0/4 (0%)
- **Fase 5 (Painel/Melhorias):** 0/3 (0%)

### Total Geral
- **Concluído:** 0/30 (0%)
- **Pendente:** 30/30 (100%)

---

## 📝 NOTAS

- Este checklist deve ser atualizado conforme o progresso
- Marque cada item como concluído quando finalizado e testado
- Priorize Fase 1 (Críticas) antes de qualquer outra fase
- Fase 2 (MVP Core) é obrigatória para considerar MVP completo
- Fases 3-5 podem ser feitas em paralelo ou após MVP completo

---

**Última atualização:** 2026-01-16
