# 📊 Plano Oficial de MVP - StudioOS ERP

**Data:** 2026-01-16  
**Status:** Esqueleto Oficial do MVP + Plano de Ação  
**Versão:** 1.0

---

## 📌 SOBRE ESTE DOCUMENTO

Este é o **plano oficial de MVP e execução do StudioOS**. Ele foi criado através de análise cruzada de todos os documentos do projeto, alinhamento com o modelo de negócio, e consolidação das prioridades.

**Este documento deve ser usado como:**
- ✅ Referência definitiva para o desenvolvimento do MVP
- ✅ Base para planejamento de sprints
- ✅ Guia de decisões de priorização (P0/P1/P2)
- ✅ Documento de alinhamento entre equipe e stakeholders

**Princípios fundamentais que guiam este MVP:**
- StudioOS é o ERP que **mais trabalha sozinho** (automação máxima, input mínimo)
- Fluxo totalmente integrado: LP → CRM → Orçamento → Financeiro → Produção → Instalação
- **Onboarding em até 1h**: da venda até LP + ERP funcionando
- Painel Admin Supremo (futuro) com BI e inteligência de mercado agregada

---

## 🎯 PRINCÍPIOS DO STUDIOOS

**Filosofia Central:** O StudioOS não quer ser "o ERP com mais funcionalidades". O StudioOS quer ser **o ERP que mais trabalha sozinho**.

### Princípios Fundamentais:

1. **Automação máxima, input mínimo:** Tudo que puder ser derivado de outro dado não deve ser digitado de novo. O sistema existe para trabalhar sozinho, não para ser um "Excel bonito".

2. **Fluxo totalmente integrado:** LP → CRM → Orçamento → Financeiro → Produção → Instalação → Pós-venda. Todos os módulos se alimentam entre si automaticamente.

3. **Onboarding em 1 hora:** O objetivo operacional é que, ao vender o StudioOS para uma nova empresa, o super admin consiga:
   - criar a organização,
   - configurar o mínimo de dados (nome da empresa, dados fiscais básicos, contatos principais),
   - conectar o domínio da LP,
   - e entregar **LP de captação + ERP funcional** em **menos de 1 hora**.

4. **Complexidade atrás das câmeras:** Para o usuário final, tudo precisa ser simples e óbvio. A complexidade (multi-tenant, integrações, triggers, estoques opcionais, BI) fica escondida na arquitetura.

5. **Escalável por design:** Cada nova empresa deve ser uma "instância configurada", não um projeto custom. Quanto mais rápido criarmos, configurarmos e colocarmos no ar, mais o StudioOS se torna um negócio de escala.

**⚠️ Esses princípios devem guiar TODAS as decisões de desenvolvimento. Se uma feature não reduz input manual ou não automatiza algo, questionar se realmente é necessária no MVP.**

---

## 📋 RESUMO EXECUTIVO (15 Bullets)

1. **Visão do Produto:** ERP SaaS multi-tenant focado em decoração (cortinas/persianas hoje, expandindo para móveis, tapetes, decoração), com foco em automação máxima entre módulos

2. **Filosofia:** Sistema que "faz sozinho" - minimizar input manual, maximizar automação, tudo interligado (LP → CRM → Orçamento → Financeiro → Produção → Instalação), com o objetivo operacional de **entregar LP + ERP configurado para uma nova empresa em menos de 1 hora** após a venda. Ver seção "Princípios do StudioOS" no início do documento.

3. **Módulos Principais:** CRM (leads, pipeline), Orçamentos (wizard, cálculos), Produção (Kanban), Instalação (agendamento), Financeiro (contas pagar/receber), Multi-tenant (organizações, usuários, permissões)

4. **Automações Existentes:** ✅ Trigger cria conta a receber quando orçamento muda para status de pagamento; ✅ Trigger cria pedido automaticamente quando orçamento é pago; ✅ Trigger sincroniza status do orçamento quando conta receber é atualizada; ✅ Trigger cria contas a pagar baseado em custos; ✅ Trigger verifica materiais completos e muda status de produção

5. **Problemas Críticos:** ❌ Status de contas a receber não atualiza corretamente após pagamento (bug de lógica); ❌ Não há sincronização bidirecional perfeita entre orçamento ↔ contas a receber; ❌ Dashboard com dados zerados (queries/filtros); ❌ Botão "Novo Orçamento" duplicado

6. **Problemas Altos:** ❌ Sem "Esqueci minha senha"; ❌ Sem paginação visível em listagens; ⚠️ Sem legendas em gráficos (P1); ⚠️ Sem tooltips em ícones (P1); ⚠️ Campo endereço único (deveria ser separado - P2)

7. **Problemas Médios:** ❌ Sem filtros por data/vendedor em orçamentos; ❌ Sem ordenação de colunas; ❌ Sem histórico de atividades completo; ❌ Não há funcionalidade de apagar/desativar usuário

8. **Hard-code "Cortina Only":** Tabela `cortina_items` específica; Componentes `CortinaCard`, `PersianaCard`, etc.; Cálculos hardcoded (`calcularCustosCortina`, coeficientes fixos); Fluxo de produção fixo (corte → costura → acabamento); Textos hardcoded ("Cortinas", "Persianas")

9. **Funcionalidades Planejadas:** Generalização de produtos (cortina_items → order_items); Módulo de estoque completo; Módulo de integrações plug-and-play; Supplier V1 (cadastro + vínculo + importação de tabela); Guia de costura automática (PDF)

10. **Contradições Identificadas e Resolvidas:** 
    - **API pública**: NÃO é MVP (P2/futuro, provavelmente Enterprise-only conforme MODELO_NEGOCIO.md)
    - **WhatsApp e NF-e**: NÃO são MVP (P2/futuro, features Business/Enterprise conforme MODELO_NEGOCIO.md)
    - **Estoque completo**: NÃO é MVP (estoque simples e opcional é P0, estoque completo com multi-depósito é P1/P2)
    - **Generalização de produtos**: NÃO é MVP (P2, sistema pode funcionar com cortinas/persianas enquanto valida o produto)
    - **Permissões granulares**: NÃO é MVP (P2, MVP funciona com roles básicos admin/user)

11. **Supplier (Fornecedor):** Existe campo `fornecedor` em `materiais`, mas não há módulo completo; Apenas ideia V1 (cadastro + vínculo + importação de tabela) para MVP

12. **Estoque:** Não existe módulo de estoque; Apenas tabela `materiais_pedido` para controle de materiais por pedido; MVP precisa de estoque simples (baixa quando orçamento/pedido aprovado)

13. **Permissões:** Apenas roles básicos (admin/user) via `user_roles`; Não há permissões granulares por módulo/funcionalidade; MVP pode manter básico, mas precisa de soft delete de usuários

14. **Instalação:** ✅ Tabela `instalacoes` conectada a `pedidos`; ✅ Agenda de instalações implementada; ✅ Integração com produção funcional; ⚠️ Falta automação: quando pedido fica "pronto", sugerir agendar instalação (P0 - Sprint 5)

15. **Automações Faltantes no MVP (P0 - Sprint 5):** ❌ Quando instalação concluída, não atualiza status do pedido automaticamente; ❌ Quando lead vira cliente, não preenche automaticamente dados no orçamento (P1 - Sprint 5); ❌ Quando orçamento aprovado, não sugere agendar visita/instalação automaticamente (P1 - Sprint 5)

---

## 🔹 SEÇÃO 1 — INVENTÁRIO DE FUNCIONALIDADES

### CRM

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Gestão de Contatos/Leads | ✅ Implementado | `src/components/crm/ListaContatosV2.tsx`, `src/hooks/useCRMData.ts` |
| Pipeline de Oportunidades | ✅ Implementado | `src/components/crm/PipelineVendas.tsx` |
| Atividades e Follow-ups | ✅ Implementado | `src/components/crm/AtividadesCRM.tsx` |
| Solicitações de Visita | ✅ Implementado | `src/components/crm/SolicitacoesVisita.tsx` |
| Calendário Integrado | ✅ Implementado | `src/components/calendario/CalendarioGeral.tsx` |
| Jornada do Cliente | ✅ Implementado | `src/hooks/useJornadaCliente.ts` |
| Merge de Contatos | ✅ Implementado | `src/components/crm/MergeContatos.tsx` |
| **Lead → Cliente automático** | ❌ Não implementado | - |
| **Preencher orçamento com dados do lead** | ❌ Não implementado | - |

### Orçamentos

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Wizard de Criação (multi-etapas) | ✅ Implementado | `src/components/orcamento/wizard/EtapaProdutos.tsx`, `EtapaCliente.tsx`, `EtapaResumo.tsx` |
| Cálculos Automáticos | ✅ Implementado | `src/lib/calculosOrcamento.ts` |
| Geração de PDF | ✅ Implementado | `src/lib/gerarPdfOrcamento.ts` |
| Importação de Dados (CSV) | ✅ Implementado | `src/components/orcamento/ImportarDados.tsx` |
| Histórico de Alterações | ✅ Implementado | `src/components/orcamento/VisualizarOrcamento.tsx` |
| Descontos | ✅ Implementado | `src/components/orcamento/wizard/EtapaResumo.tsx` |
| Listagem de Orçamentos | ⚠️ Parcial | `src/components/orcamento/ListaOrcamentos.tsx` - Falta: paginação, filtros data/vendedor, ordenação |
| **Orçamento → Conta Receber automático** | ✅ Implementado | `supabase/migrations/20251229194157_*.sql` (trigger) |
| **Orçamento → Pedido automático** | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` (trigger) |

### Produção

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Kanban de Produção | ✅ Implementado | `src/components/producao/KanbanProducao.tsx` |
| Gestão de Pedidos | ✅ Implementado | `src/hooks/useProducaoData.ts` |
| Timeline/Histórico | ✅ Implementado | `src/components/producao/RelatorioProducao.tsx` |
| Ficha de Pedido | ✅ Implementado | `src/components/producao/FichaPedido.tsx` |
| Lista de Materiais | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` (tabela `materiais_pedido`) |
| **Guia de Costura (PDF)** | ❌ Não implementado | - |
| **Materiais completos → em_producao automático** | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` (trigger) |
| **Pedido pronto → sugerir instalação** | ❌ Não implementado | - |

### Instalação

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Agendamento de Instalação | ✅ Implementado | `src/components/producao/DialogAgendarInstalacao.tsx` |
| Agenda de Instalações | ✅ Implementado | `src/components/producao/AgendaInstalacoes.tsx` |
| Integração com Produção | ✅ Implementado | `src/hooks/useProducaoData.ts` (join com pedidos) |
| **Instalação concluída → pedido entregue** | ❌ Não implementado | - |
| **Pedido pronto → alerta para agendar** | ❌ Não implementado | - |

### Financeiro

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Contas a Receber | ⚠️ Parcial | `src/components/financeiro/ContasReceber.tsx` - Bug: status não atualiza corretamente |
| Contas a Pagar | ✅ Implementado | `src/components/financeiro/ContasPagar.tsx` |
| Conciliação Bancária | ✅ Implementado | `src/components/financeiro/ConciliacaoBancaria.tsx` |
| Lançamentos Financeiros | ✅ Implementado | `src/components/financeiro/LancamentosFinanceiros.tsx` |
| Comissões | ✅ Implementado | `src/components/financeiro/Comissoes.tsx` |
| Dashboard Financeiro | ✅ Implementado | `src/components/financeiro/DashboardFinanceiro.tsx` |
| **Conta Receber → Orçamento sincronização** | ⚠️ Parcial | `supabase/migrations/20251223200921_*.sql` (trigger existe, mas bug) |
| **Custos → Contas Pagar automático** | ✅ Implementado | `supabase/migrations/20251231194451_*.sql` (trigger) |

### Usuários/Organizações

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Multi-tenant (Organizações) | ✅ Implementado | `supabase/migrations/20260107190857_*.sql` |
| Gestão de Usuários | ⚠️ Parcial | `src/pages/GerenciarUsuarios.tsx` - Falta: apagar/desativar |
| Roles Básicos (admin/user) | ✅ Implementado | `supabase/migrations/*user_roles*.sql` |
| Feature Flags | ✅ Implementado | `supabase/migrations/20260114_feature_flags.sql` |
| **Soft Delete de Usuários** | ❌ Não implementado | - |
| **Permissões Granulares** | ❌ Não implementado | - |

### Permissões

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Roles Básicos | ✅ Implementado | `src/hooks/useUserRole.ts` |
| Admin-only Views | ✅ Implementado | `src/pages/GerarOrcamento.tsx` (ADMIN_ONLY_VIEWS) |
| **Permissões por Módulo** | ❌ Não implementado | - |
| **Permissões por Ação** | ❌ Não implementado | - |

### Supplier (Fornecedor)

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Campo `fornecedor` em materiais | ✅ Implementado | `supabase/migrations/20251125165640_*.sql` |
| **Cadastro de Fornecedores** | ❌ Não implementado | - |
| **Vínculo Fornecedor → Materiais** | ⚠️ Parcial | Existe campo, mas não há UI |
| **Importação de Tabela de Preços** | ❌ Não implementado | - |

### Estoque

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| **Controle de Estoque** | ❌ Não implementado | - |
| **Baixa Automática** | ❌ Não implementado | - |
| Materiais por Pedido | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` (tabela `materiais_pedido`) |
| **Dashboard de Estoque** | ❌ Não implementado | - |
| **Alertas de Estoque Mínimo** | ❌ Não implementado | - |
| **⚠️ IMPORTANTE:** Estoque deve ser **OPCIONAL** - empresas que trabalham sob medida ou com parcerias não precisam usar | - | - |

### Automação (Gatilhos entre Módulos)

| Funcionalidade | Status | Arquivos Principais |
|---------------|--------|---------------------|
| Orçamento pago → Conta Receber | ✅ Implementado | `supabase/migrations/20251229194157_*.sql` |
| Orçamento pago → Pedido | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` |
| Conta Receber atualizada → Orçamento | ⚠️ Parcial | `supabase/migrations/20251223200921_*.sql` (bug) |
| Custos → Contas Pagar | ✅ Implementado | `supabase/migrations/20251231194451_*.sql` |
| Materiais completos → em_producao | ✅ Implementado | `supabase/migrations/20260102212520_*.sql` |
| **Pedido pronto → Sugerir instalação** | ❌ Não implementado | - |
| **Instalação concluída → Pedido entregue** | ❌ Não implementado | - |
| **Lead → Cliente automático** | ❌ Não implementado | - |

---

## 🔹 SEÇÃO 2 — BUGS E DÍVIDAS TÉCNICAS PRIORITÁRIAS

### 🔴 CRÍTICOS (Alto Impacto)

| Bug / Problema | Impacto | Módulo | Arquivos Relacionados | Status no Código |
|----------------|---------|--------|----------------------|------------------|
| Status de contas a receber não atualiza corretamente após pagamento | Alto | Financeiro | `src/components/financeiro/ContasReceber.tsx` (linhas 106-140), `src/lib/calculosFinanceiros.ts` | Lógica de cálculo dinâmico pode estar sobrescrevendo status do banco |
| Dashboard com dados zerados ("0 dias", gráficos vazios) | Alto | Dashboard | `src/hooks/useMetricasCentralizadas.ts`, `src/hooks/useDashboardData.ts` | Queries podem estar retornando vazias ou filtros de data incorretos |
| Botão "Novo Orçamento" duplicado (header + sidebar) | Alto | UI | `src/components/orcamento/DashboardContent.tsx`, `src/components/orcamento/OrcamentoSidebar.tsx` | Componentes duplicados sem coordenação |
| Sincronização bidirecional Orçamento ↔ Contas Receber com bugs | Alto | Financeiro | `supabase/migrations/20251223200921_*.sql` (trigger), `src/lib/integracaoOrcamentoFinanceiro.ts` | Trigger existe mas pode ter race conditions |

### 🟡 ALTOS (Médio Impacto)

| Bug / Problema | Impacto | Módulo | Arquivos Relacionados | Status no Código |
|----------------|---------|--------|----------------------|------------------|
| Sem legendas em gráficos | Médio | Dashboard | `src/components/orcamento/charts/GraficoCustos.tsx` | Componente `Legend` importado mas não renderizado |
| Sem tooltips em ícones | Médio | UI | Vários componentes | Falta componente `Tooltip` em ícones explicativos |
| Campo endereço único (deveria ser separado) | Médio | Orçamentos | `src/components/orcamento/wizard/EtapaCliente.tsx`, schema `orcamentos` | Schema tem apenas `endereco TEXT`, não separado |
| Sem "Esqueci minha senha" | Médio | Auth | `src/pages/Auth.tsx` | Não implementado `resetPasswordForEmail()` |
| Sem paginação visível em listagens | Médio | Orçamentos | `src/components/orcamento/ListaOrcamentos.tsx` | Query sem `limit`/`offset`, UI sem paginação |

### 🟢 MÉDIOS (Baixo Impacto)

| Bug / Problema | Impacto | Módulo | Arquivos Relacionados | Status no Código |
|----------------|---------|--------|----------------------|------------------|
| Sem filtros por data/vendedor em orçamentos | Baixo | Orçamentos | `src/components/orcamento/ListaOrcamentos.tsx` | Query sem filtros, UI sem controles |
| Sem ordenação de colunas | Baixo | Orçamentos | `src/components/orcamento/ListaOrcamentos.tsx` | Tabela não clicável |
| Sem histórico de atividades completo | Baixo | Sistema | `supabase/migrations/*log_alteracoes_status*.sql` | Existe apenas para status, não para todas ações |
| Não há funcionalidade de apagar/desativar usuário | Baixo | Usuários | `src/pages/GerenciarUsuarios.tsx` | Apenas criar e alterar senha |

---

## 🔹 SEÇÃO 3 — HARD-CODE "CORTINA ONLY" QUE PRECISA SER GENERALIZADO

### Tabelas / Migrations Específicas

| Item | Arquivo | Por que impede generalização | Recomendação |
|------|---------|------------------------------|--------------|
| Tabela `cortina_items` | `supabase/migrations/20251120154349_*.sql` | Nome e estrutura específica para cortinas (tipo_cortina, tecido_id, forro_id, trilho_id, barra_cm) | Refatorar para `order_items` genérico com campos configuráveis |
| Tabela `materiais` com categorias hardcoded | `supabase/migrations/20251223194222_*.sql` | Categorias fixas (tecido, forro, trilho, motorizado, acessorio, persiana, papel) | Refatorar para `products` com `product_categories` dinâmico |
| Tabela `itens_pedido` com FK para `cortina_items` | `supabase/migrations/20251224195604_*.sql` | `cortina_item_id` força vínculo com cortinas | Refatorar para `order_item_id` genérico |
| Fluxo de produção hardcoded | `src/components/producao/KanbanProducao.tsx` | Colunas fixas: 'fila', 'corte', 'costura', 'acabamento' | Mover para configuração em `product_types.production_workflow` (JSONB) |

### Componentes React Específicos

| Item | Arquivo | Por que impede generalização | Recomendação |
|------|---------|------------------------------|--------------|
| `CortinaCard.tsx` | `src/components/orcamento/wizard/CortinaCard.tsx` | Totalmente específico para cortinas (tecido, forro, trilho, barra) | Criar componente genérico `ProductCard` com configuração dinâmica |
| `PersianaCard.tsx` | `src/components/orcamento/wizard/PersianaCard.tsx` | Específico para persianas (material_principal, tipo, fabrica) | Mesmo que acima |
| `PapelCard.tsx` | `src/components/orcamento/wizard/PapelCard.tsx` | Específico para papéis de parede | Mesmo que acima |
| `MotorizadoCard.tsx` | `src/components/orcamento/wizard/MotorizadoCard.tsx` | Específico para motorização | Mesmo que acima |
| `AcessoriosCard.tsx` | `src/components/orcamento/wizard/AcessoriosCard.tsx` | Específico para acessórios | Mesmo que acima |
| `EtapaProdutos.tsx` | `src/components/orcamento/wizard/EtapaProdutos.tsx` | Renderização condicional por `tipoProduto` com componentes específicos | Refatorar para renderização dinâmica baseada em `product_type` config |

### Cálculos Específicos

| Item | Arquivo | Por que impede generalização | Recomendação |
|------|---------|------------------------------|--------------|
| `calcularCustosCortina()` | `src/lib/calculosOrcamento.ts` (linhas 277-363) | Coeficientes fixos por tipo de cortina (wave: 3.5, prega: 3.5), lógica específica de panos/rolos | Mover para `product_types.calculation_rules` (JSONB) e função genérica |
| `calcularConsumoMaterial()` | `src/lib/calculosOrcamento.ts` (linhas 83-123) | Assume sempre tecido em rolo, cálculo por altura vs largura | Mesmo que acima |
| `COEFICIENTES_CORTINA` e `COEFICIENTES_FORRO` | `src/lib/calculosOrcamento.ts` (linhas 91-114) | Valores hardcoded por tipo de cortina | Mover para `product_types` |
| `MARGEM_COSTURA_SUPERIOR = 0.16` | `src/lib/calculosOrcamento.ts` | Constante específica para cortinas | Mover para configuração |
| `LARGURA_ROLO_PADRAO = 2.80` | `src/lib/calculosOrcamento.ts` | Assume rolo de tecido | Mover para configuração do material |

### Textos Hardcoded

| Item | Arquivo | Por que impede generalização | Recomendação |
|------|---------|------------------------------|--------------|
| "Cortinas", "Persianas" em links | `src/components/landing/LandingPageNavbar.tsx`, `src/components/landing/LandingPageFooter.tsx` | Textos fixos no código | Usar textos dinâmicos baseados em `product_categories` |
| "cortinas e persianas" em mensagem | `src/components/WhatsAppButton.tsx` | Texto fixo | Usar texto configurável por organização |
| Categorias fixas em importação | `src/components/orcamento/ImportarDados.tsx` | `CATEGORIAS` e `SERVICOS` hardcoded | Usar categorias do banco |

---

## 🔹 SEÇÃO 4 — DEFINIÇÃO DO MVP REALISTA

### P0 – INDISPENSÁVEL PARA VENDER O PRODUTO

#### Já Implementado (só precisa ajustes/bugfix)
- ✅ Multi-tenant completo
- ✅ CRM básico (contatos, pipeline, atividades)
- ✅ Orçamentos (wizard, cálculos, PDF)
- ✅ Produção (Kanban, pedidos, histórico)
- ✅ Instalação (agendamento, agenda)
- ✅ Financeiro básico (contas pagar/receber, conciliação)
- ✅ Automações core (orçamento → conta receber → pedido)

#### Parcial (precisa completar)
- ⚠️ **Corrigir bugs críticos de financeiro** (status não atualiza, sincronização) - Sprint 1
- ⚠️ **Corrigir dashboard com dados zerados** - Sprint 1
- ⚠️ **Remover botão duplicado "Novo Orçamento"** - Sprint 1
- ⚠️ **Adicionar paginação em listagens** (orçamentos) - Sprint 6
- ⚠️ **Adicionar "Esqueci minha senha"** - Sprint 1
- ⚠️ **Implementar soft delete de usuários** - Sprint 1

#### Não Existe (precisa criar)
- ❌ **Estoque simples OPCIONAL** (baixa quando orçamento/pedido aprovado, sem multi-depósito) 
  - **⚠️ CRÍTICO:** Deve ser **100% OPCIONAL** - empresas que trabalham só sob medida ou com parcerias (sem estoque próprio) devem poder desabilitar completamente
  - Configuração por organização: `controla_estoque BOOLEAN` (default: false)
  - Configuração por material: `controla_estoque BOOLEAN` (default: false)
  - Se desabilitado, sistema funciona normalmente SEM controle de estoque
  - UI de estoque só aparece se habilitado
- ❌ **Supplier V1** (cadastro + vínculo fornecedor → materiais + importação de tabela CSV)
- ❌ **Guia de costura automática** (PDF simples gerado do pedido)
- ❌ **Automação: Pedido pronto → sugerir agendar instalação**
- ❌ **Automação: Instalação concluída → pedido entregue**

### P1 – MUITO IMPORTANTE, MAS PODE VIR LOGO DEPOIS

#### Já Implementado
- ✅ Comissões básicas
- ✅ Relatórios financeiros
- ✅ Calendário integrado

#### Parcial
- ⚠️ **Melhorar sincronização Orçamento ↔ Financeiro** (bidirecional perfeita)
- ⚠️ **Adicionar filtros (data, vendedor) em orçamentos**
- ⚠️ **Adicionar ordenação de colunas**

#### Não Existe
- ❌ **Automação: Lead → Cliente automático** (quando orçamento aprovado) - Sprint 5
- ❌ **Automação: Preencher orçamento com dados do lead** (quando criar orçamento a partir de lead) - Sprint 5
- ❌ **Alertas de estoque mínimo** (quando estoque baixo) - Sprint 2 (só se estoque habilitado)
- ❌ **Painel Supremo / Owner Dashboard básico** (lista de organizações, planos, status, contagem de usuários) - **CRÍTICO para operação do SaaS** - Sprint 6 ou 7
- ❌ **Importação simples de clientes via CSV** (para onboarding dos primeiros clientes legados) - Sprint 6 ou Sprint 1 (se necessário)
- ❌ **Landing Page de Vendas do StudioOS** (LP genérica para vender o ERP, diferente de LP personalizada por organização) - P1, pode ser Next.js/Vercel separada

### P2 – LEGAL TER, MAS NÃO TRAVA O MVP

#### Não Existe
- ❌ **Permissões granulares** (por módulo/funcionalidade) - P2, MVP funciona com roles básicos
- ❌ **Histórico de atividades completo** (audit log de todas ações) - P2, já existe `log_alteracoes_status` parcial
- ❌ **Separar campo endereço** (rua, número, CEP) - P2, dor de usuário identificada mas não crítica
- ❌ **Generalização de produtos** (cortina_items → order_items) - P2, sistema pode funcionar com cortinas/persianas enquanto valida o produto
- ❌ **Módulo de integrações completo** (webhook, NF-e, WhatsApp, etc.) - P2, features Business/Enterprise conforme MODELO_NEGOCIO.md
- ❌ **API pública avançada** - P2, provavelmente Enterprise-only conforme MODELO_NEGOCIO.md
- ❌ **Website builder completo** - P2, não é MVP
- ❌ **Blog, SEO, heatmaps, funil avançado** - P2, não é MVP
- ❌ **BI avançado, dashboards customizáveis** - P2, não é MVP
- ❌ **Painel Supremo completo** (MRR/ARR, BI, one-click onboarding) - **Fase 2+ do painel** (P2)

---

## 🔹 SEÇÃO 5 — PROPOSTA DE SPRINTS

### Sprint 1 – Revisão Técnica + Bugs Críticos + Rebranding Mínimo (1-2 semanas)

**Objetivo:** Corrigir bugs que impedem uso básico do sistema + Rebranding StudioOS

**Tarefas:**
- Corrigir status de contas a receber não atualizando após pagamento
- Corrigir dashboard com dados zerados (queries/filtros)
- Remover botão "Novo Orçamento" duplicado
- Melhorar sincronização bidirecional Orçamento ↔ Contas Receber
- Adicionar "Esqueci minha senha" na tela de login
- Implementar soft delete de usuários (campo `deleted_at` ou `active`)
- **Rebranding StudioOS mínimo:**
  - Atualizar nome no `package.json`
  - Atualizar título da aplicação (`index.html`)
  - Atualizar logo/favicon (se disponível)
  - Atualizar textos de branding nas telas públicas (login, etc.)
  - Atualizar nome nos PDFs de orçamento
  - Atualizar metadados (title, description, og:tags)

**Entregáveis:**
- Sistema financeiro funcionando corretamente
- Dashboard exibindo dados reais
- Usuários podem recuperar senha e serem desativados
- Sistema rebranded para StudioOS em todas as telas públicas e documentos

---

### Sprint 2 – Estoque Simples + Baixa Automática (1-2 semanas)

**Objetivo:** Implementar controle de estoque básico **OPCIONAL** com baixa automática

**⚠️ DESIGN OPCIONAL:**
- Adicionar campo `controla_estoque BOOLEAN DEFAULT false` em `organizations` (configuração por organização)
- Adicionar campo `controla_estoque BOOLEAN DEFAULT false` em `materiais` (configuração por material)
- **Se `controla_estoque = false` na organização ou no material, sistema funciona normalmente SEM controle de estoque**
- Empresas que trabalham só sob medida ou com parcerias podem desabilitar completamente

**Tarefas:**
- Criar tabela `inventory_items` (produto_id, quantidade_atual, estoque_minimo, organization_id)
- Criar tabela `inventory_movements` (tipo: entrada/saída, quantidade, motivo, pedido_id/orcamento_id)
- Adicionar campo `controla_estoque` em `organizations` e `materiais`
- Criar UI básica: dashboard de estoque (só aparece se `controla_estoque = true`), lista de itens, entrada/saída rápida
- Implementar trigger **CONDICIONAL**: quando orçamento aprovado/pedido criado, **SÓ baixar estoque se `controla_estoque = true`** na organização E no material
- Implementar alertas de estoque mínimo (notificação quando abaixo do mínimo) - **só se estoque habilitado**
- Integrar com `materiais_pedido` (quando material recebido, entrada no estoque) - **só se estoque habilitado**
- Adicionar toggle em Configurações da Organização: "Controlar Estoque" (on/off)

**Entregáveis:**
- Estoque funcionando com baixa automática **OPCIONAL**
- Sistema funciona normalmente SEM estoque (empresas sob medida/parcerias)
- Alertas de estoque mínimo (só se habilitado)
- UI básica para gestão de estoque (só aparece se habilitado)

---

### Sprint 3 – Supplier V1 (Fornecedor Básico) (1 semana)

**Objetivo:** Cadastro de fornecedores e vínculo com materiais

**Tarefas:**
- Criar tabela `suppliers` (nome, cnpj, contato, email, telefone, organization_id)
- Criar tabela `supplier_materials` (supplier_id, material_id, preco, codigo_fornecedor)
- Criar UI: cadastro de fornecedores, lista, vínculo fornecedor → materiais
- Implementar importação de tabela de preços (CSV: material_id, preco, codigo_fornecedor)
- Atualizar campo `fornecedor` em `materiais` para usar FK para `suppliers`

**Entregáveis:**
- Cadastro de fornecedores funcionando
- Vínculo fornecedor → materiais
- Importação de tabela de preços funcionando

---

### Sprint 4 – Guia de Costura + Melhorias de Produção (1 semana)

**Objetivo:** Gerar PDF de guia de costura automaticamente do pedido

**Tarefas:**
- Criar template de guia de costura (PDF simples com: item, medidas, materiais, observações)
- Implementar geração de PDF em `src/lib/gerarPdfProducao.ts` (similar a `gerarPdfOrcamento.ts`)
- Adicionar botão "Gerar Guia de Costura" na ficha do pedido
- Melhorar visualização de materiais por pedido na ficha

**Entregáveis:**
- Guia de costura em PDF funcionando
- Botão de geração na ficha do pedido

---

### Sprint 5 – Automações Core + Integração LP → CRM (1 semana)

**Objetivo:** Completar automações entre módulos + Conectar LP externa ao CRM

**Tarefas:**
- **Automações Core (P0):**
  - Implementar trigger: quando pedido status = 'pronto', criar notificação/alerta para agendar instalação
  - Implementar trigger: quando instalação status = 'concluida', atualizar pedido status = 'entregue'
- **Automações CRM (P1):**
  - Implementar: quando orçamento aprovado, lead vira cliente automaticamente (atualizar `contatos.tipo = 'cliente'`)
  - Implementar: quando criar orçamento a partir de lead, preencher automaticamente dados do cliente (nome, email, telefone, endereço)
  - Implementar: quando orçamento aprovado, sugerir criar atividade de follow-up no CRM
- **Integração LP → CRM:**
  - Criar endpoint/API simples: `POST /api/leads` (ou Edge Function Supabase)
  - Aceitar dados do formulário da LP (nome, email, telefone, mensagem, origem)
  - Criar lead automaticamente no CRM (`contatos` com `tipo = 'lead'`)
  - Se houver solicitação de visita, criar `solicitacoes_visita` automaticamente
  - Retornar confirmação para a LP
  - **Alternativa simples:** Se LP for Next.js/Vercel, criar Edge Function que insere direto no Supabase
  - Documentar integração para facilitar conexão de LPs externas

**Entregáveis:**
- Automações funcionando entre todos os módulos
- Fluxo completo: Lead → Orçamento → Pedido → Instalação → Entregue
- **LP externa conectada ao CRM** - formulário cria lead automaticamente
- Documentação de integração LP → CRM

---

### Sprint 6 – Melhorias de UX e Completude (1 semana)

**Objetivo:** Melhorar experiência do usuário e completar funcionalidades básicas

**Tarefas:**
- **UX Básica (P0):**
  - Adicionar paginação em listagens (orçamentos, contas receber, etc.)
  - Adicionar filtros (data, vendedor) em orçamentos
  - Adicionar ordenação de colunas em tabelas
- **Melhorias de UX (P1):**
  - Adicionar legendas em gráficos (bug alto identificado)
  - Adicionar tooltips em ícones explicativos (bug alto identificado)
  - Melhorar feedback visual em automações (toast quando trigger dispara)
- **Opcional (se houver tempo):**
  - Painel Supremo básico (P1) - pode entrar aqui ou como Sprint 7 separada

**Entregáveis:**
- UX melhorada com paginação, filtros, ordenação
- Gráficos com legendas
- Tooltips explicativos

---

## 👑 PAINEL SUPREMO / OWNER DASHBOARD

**⚠️ CRÍTICO:** O Painel Supremo não é prioridade de MVP para o cliente final, mas é **fundamental para o negócio StudioOS como SaaS**. Ele será construído em fases.

### Fase 1 – Painel Supremo Básico (P1 - Logo após MVP)

**Objetivo:** Permitir que o dono do StudioOS (nós) gerencie o SaaS sem gambiarra.

**Funcionalidades mínimas:**
- Listar todas as organizações (clientes) com:
  - nome, CNPJ/ID, cidade/UF,
  - plano atual,
  - status (ativo/inativo),
  - data de criação,
  - contagem de usuários.
- Ativar/desativar organizações.
- Ajustar plano de cada organização.
- Ver uso básico de recursos (número de orçamentos, pedidos, etc.).

**Isso já permite:**
- ✅ **Onboarding rápido** de novos clientes via painel.
- ✅ Controle operacional sem precisar entrar direto no banco.
- ✅ Visão macro do negócio (quantas empresas, planos, status).

**Implementação:**
- Rota `/admin` (protegida para super admins)
- Componente `src/pages/AdminSupremo.tsx`
- Query simples listando `organizations` com joins para planos/usuários
- Tabela básica com ações (ativar/desativar, mudar plano)

**Sprint sugerida:** Pode entrar no Sprint 6 (Melhorias de UX) ou como Sprint 7 separada (1 semana)

---

### Fase 2 – One-Click Onboarding (P2, mas já considerado no design)

**Objetivo:** Transformar a venda em **um clique operacional**.

**Fluxo desejado:**
1. No Painel Supremo, o super admin clica em **"Criar Nova Empresa"**.
2. Preenche alguns campos mínimos:
   - Nome fantasia / Razão Social
   - CNPJ/CPF
   - Segmento (cortinas/persianas, decoração, etc.)
   - Contato principal (nome, email, telefone)
   - Vendedor responsável (usuário interno nosso)
3. Define:
   - Plano inicial
   - Se a empresa vai usar **estoque** ou não
4. O sistema:
   - Cria a organização no multi-tenant
   - Cria os usuários iniciais
   - Aplica as feature flags do plano
   - Gera dados padrão (status de orçamento, pipeline básico, categorias iniciais, etc.)
5. O cliente:
   - recebe email de boas-vindas com link de acesso
   - pode conectar o domínio da LP (manual ou via instruções guiadas)

**Objetivo final:** da venda até LP + ERP funcionando em **menos de 1 hora**, com o esforço humano limitado a **uma chamada de onboarding + alguns cliques**.

**Nota:** Essa fase usa o que já existe (multi-tenant, feature flags, LP base) mas empacotado em um fluxo único. Pode ser implementada após MVP validado.

---

### Fase 3 – BI Intenso e Inteligência de Mercado (Visão Estratégica, fora do MVP)

**Objetivo:** Transformar o Painel Supremo em um **módulo de BI e inteligência de mercado**, cruzando dados de todas as empresas clientes.

**Ideia geral:**
- Coletar dados agregados e anonimizados de:
  - volume de orçamentos por região
  - taxas de conversão por tipo de produto
  - ticket médio por segmento
  - prazos médios de produção/instalação
  - tipos de produtos mais vendidos
- Permitir dashboards como:
  - "Mapa de calor de vendas por cidade/estado"
  - "Tendências de materiais (ex.: tecidos X, trilhos Y, etc.)"
  - "Performance média de empresas por porte"
- Tudo agrupado e sem expor dados sensíveis de clientes específicos.

**Valor estratégico:**
- Isso vira um **ativo de mercado**: inteligência sobre o segmento de decoração/cortinas.
- Abre portas para:
  - relatórios premium
  - consultoria baseada em dados
  - tomadas de decisão melhores para nossos próprios produtos e posicionamento.

**Importante:**
- **Não é MVP**, mas o design do sistema (estrutura das tabelas, logs, métricas) já deve considerar que esses dados serão usados no futuro.

---

## 🌐 REBRANDING STUDIOOS + LP GENÉRICA

### Rebranding Mínimo (Sprint 1)

**Objetivo:** Garantir que o nome StudioOS e a identidade atual apareçam em todos os pontos de contato.

**Tarefas:**
- Atualizar nome no `package.json`
- Atualizar título da aplicação (`index.html`)
- Atualizar logo/favicon (se disponível)
- Atualizar textos de branding nas telas públicas (login, etc.)
- Atualizar nome nos PDFs de orçamento
- Atualizar metadados (title, description, og:tags)

**Ver:** Sprint 1 - Tarefas de Rebranding

---

### LP Genérica + Integração LP → CRM (Sprint 5)

**Objetivo:** Ter uma LP genérica (pode ser Next.js/Vercel separada) que capture leads e os envie automaticamente para o CRM.

**Fluxo desejado:**
1. Visitante preenche formulário na LP (nome, email, telefone, mensagem)
2. Formulário envia dados para endpoint/API do StudioOS
3. Sistema cria lead automaticamente no CRM (`contatos` com `tipo = 'lead'`)
4. Se houver solicitação de visita, cria `solicitacoes_visita` automaticamente
5. Lead já aparece no CRM para o vendedor seguir

**Implementação:**
- Criar Edge Function Supabase: `create-lead-from-lp`
- Ou endpoint simples: `POST /api/leads`
- Aceitar dados do formulário da LP
- Inserir em `contatos` com `tipo = 'lead'` e `origem = 'site'`
- Retornar confirmação para a LP
- Documentar integração para facilitar conexão de LPs externas

**Ver:** Sprint 5 - Integração LP → CRM

**Nota:** A LP em si pode ser construída fora do sistema (Next.js, Vercel, etc.), mas a integração com o CRM é essencial para o fluxo automático.

---

## 📥 IMPORTAÇÃO DE DADOS LEGADOS

**Contexto:** Dependendo de como vão ser os primeiros clientes, pode ser essencial ter uma forma de importar dados existentes (planilhas Excel, sistemas antigos, etc.).

### Importação Simples via CSV (P1)

**Objetivo:** Facilitar onboarding dos primeiros clientes trazendo dados legados.

**Funcionalidades:**
- Importação de **clientes/contatos** via CSV
  - Campos: nome, email, telefone, cidade, endereço, tipo (lead/cliente)
  - Validação básica (email válido, telefone formatado)
  - Duplicatas detectadas (mesmo email/telefone)
- Importação de **materiais/produtos** via CSV
  - Campos: nome, categoria, tipo, cor, fornecedor, preço, etc.
  - Validação de categorias existentes
  - Criação automática de categorias se não existirem

**Implementação:**
- Usar estrutura similar a `src/components/orcamento/ImportarDados.tsx`
- Criar componente `src/components/admin/ImportarClientes.tsx`
- Criar componente `src/components/admin/ImportarMateriais.tsx`
- Parser CSV com validação e preview antes de importar

**Sprint sugerida:** Pode entrar no Sprint 6 (Melhorias de UX) ou como tarefa adicional no Sprint 1 se necessário para onboarding dos primeiros clientes.

---

## ⚠️ AVISOS IMPORTANTES

### ⚠️ CRÍTICO: Estoque Deve Ser 100% Opcional

**Problema Identificado:** Empresas que trabalham **só sob medida** ou com **parcerias/terceirização** não têm estoque próprio e não devem ser forçadas a usar controle de estoque.

**Solução no MVP:**

1. **Configuração por Organização:**
   - Campo `controla_estoque BOOLEAN DEFAULT false` em `organizations`
   - Toggle em Configurações: "Controlar Estoque" (on/off)
   - **Se `false`:** Sistema funciona normalmente, módulo de estoque não aparece, nenhuma baixa automática acontece

2. **Configuração por Material (granularidade):**
   - Campo `controla_estoque BOOLEAN DEFAULT false` em `materiais`
   - Permite controlar estoque só de alguns materiais (ex: tecidos próprios) mas não de outros (ex: materiais de parceiros)

3. **Comportamento quando desabilitado:**
   - ✅ Orçamentos funcionam normalmente
   - ✅ Pedidos funcionam normalmente
   - ✅ Produção funciona normalmente
   - ✅ Financeiro funciona normalmente
   - ❌ Dashboard de estoque não aparece
   - ❌ Alertas de estoque não aparecem
   - ❌ Baixa automática não acontece
   - ❌ Tabela `inventory_items` não é populada

4. **Casos de Uso:**
   - **Empresa só sob medida (sem estoque):** `controla_estoque = false` → Sistema funciona 100% sem estoque
   - **Empresa com parcerias (terceirização):** `controla_estoque = false` → Sistema funciona 100% sem estoque
   - **Empresa mista (alguns produtos próprios, outros terceirizados):** `controla_estoque = true` na org, mas `false` em materiais específicos → Controle seletivo
   - **Empresa com estoque próprio:** `controla_estoque = true` → Controle completo de estoque

**Implementação Técnica:**
- Todos os triggers de baixa devem verificar: `IF organization.controla_estoque = true AND material.controla_estoque = true THEN ...`
- UI de estoque só renderiza se `organization.controla_estoque = true`
- Queries de estoque só executam se habilitado

### ⚠️ Alinhamento com Modelo de Negócio e Documentos

**Decisões de Priorização Aplicadas:**

1. **API Pública:**
   - **EXPANSAO_ERP_GENERALIZACAO.md**: Listava como P0 (Must-Have)
   - **MODELO_NEGOCIO.md**: Lista como "Enterprise only"
   - **Decisão MVP**: **P2/futuro, provavelmente Enterprise-only**. API pública requer documentação, rate limiting, autenticação robusta. Não é MVP.

2. **WhatsApp e NF-e:**
   - **EXPANSAO_ERP_GENERALIZACAO.md**: Propunha como integrações genéricas plug-and-play
   - **MODELO_NEGOCIO.md**: Lista WhatsApp como "Enterprise only", NF-e como "Business e Enterprise only"
   - **Decisão MVP**: **P2/futuro, features Business/Enterprise**. No MVP, focar em integração LP → CRM (Sprint 5).

3. **Estoque:**
   - **EXPANSAO_ERP_GENERALIZACAO.md**: Propunha estoque completo (multi-depósito, relatórios avançados)
   - **Decisão MVP**: **Estoque simples e opcional é P0** (Sprint 2). Estoque completo (multi-depósito, relatórios avançados) é P1/P2.

4. **Generalização de Produtos:**
   - **EXPANSAO_ERP_GENERALIZACAO.md**: Listava como P0 (Q1 2026 - Fundação)
   - **Decisão MVP**: **P2**. O sistema pode funcionar com cortinas/persianas enquanto valida o produto. Generalização é importante, mas não é MVP.

5. **Permissões Granulares:**
   - **EXPANSAO_ERP_GENERALIZACAO.md**: Listava como "Must-Have P0"
   - **Decisão MVP**: **P2**. Permissões granulares são importantes, mas MVP pode funcionar com roles básicos (admin/user).

**Nota:** Alguns documentos antigos (`EXPANSAO_ERP_GENERALIZACAO.md`, etc.) superestimaram certas features como P0. A definição atual de MVP as rebaixa para P1/P2, alinhando com o modelo de negócio e a filosofia de MVP enxuto.

### Funcionalidades que NÃO devem entrar no MVP

Conforme solicitado, estas funcionalidades devem ficar como **P2 / futuro / maquiagem**:

- Website builder completo
- Blog, SEO, heatmaps, funil avançado do site
- Módulo de tickets de suporte completo
- Chat interno avançado
- App próprio para fornecedor (V2+)
- BI avançado, dashboards muito customizáveis
- Gamificação
- Configurador 3D
- Integrações complexas (Google Ads, Meta Ads, etc.)
- API pública avançada

---

## 📊 RESUMO DO MVP

### O que o MVP precisa ter:
1. ✅ **Automações core funcionando** (orçamento → financeiro → produção → instalação)
2. ✅ **Bugs críticos corrigidos** (financeiro, dashboard)
3. ✅ **Estoque simples OPCIONAL** (baixa automática apenas se habilitado - empresas sob medida/parcerias podem desabilitar)
4. ✅ **Supplier V1** (cadastro + vínculo + importação)
5. ✅ **Guia de costura** (PDF)
6. ✅ **UX básica completa** (paginação, filtros, ordenação)
7. ✅ **Rebranding StudioOS** (nome, logo, textos em todas as telas públicas)
8. ✅ **Integração LP → CRM** (formulário da LP cria lead automaticamente)
9. ⚠️ **Painel Supremo básico** (P1 - logo após MVP, mas essencial para operação do SaaS)

### O que pode ficar para depois:
- Generalização de produtos (cortina_items → order_items) - P2
- Permissões granulares - P2
- Módulo de integrações completo (webhooks, NF-e, WhatsApp) - P2, features Business/Enterprise
- API pública avançada - P2, provavelmente Enterprise-only
- Website builder completo - P2
- BI avançado - P2

---

## 🎯 DECISÕES DE PRIORIZAÇÃO

### P0 – MVP Obrigatório (Indispensável para vender o produto)

**Bugs Críticos:**
- Corrigir status de contas a receber não atualizando após pagamento
- Corrigir dashboard com dados zerados
- Remover botão "Novo Orçamento" duplicado
- Melhorar sincronização bidirecional Orçamento ↔ Contas Receber
- Adicionar "Esqueci minha senha"
- Implementar soft delete de usuários

**Automações Core:**
- Orçamento → Conta Receber → Pedido (já implementado, ajustar bugs)
- Pedido pronto → Sugerir agendar instalação
- Instalação concluída → Pedido entregue

**Funcionalidades Novas:**
- Estoque simples e 100% opcional (baixa automática, sem multi-depósito)
- Supplier V1 (cadastro + vínculo + importação CSV)
- Guia de costura em PDF
- UX básica: paginação, filtros, ordenação
- Rebranding StudioOS mínimo
- Integração LP → CRM (formulário cria lead automaticamente)

---

### P1 – Logo Após MVP (Muito importante, mas não trava a venda)

**Melhorias de Sincronização:**
- Sincronização Orçamento ↔ Financeiro bidirecional perfeita
- Filtros por data/vendedor em orçamentos
- Ordenação de colunas

**Automações CRM:**
- Lead → Cliente automático (quando orçamento aprovado)
- Preencher orçamento com dados do lead (quando criar orçamento a partir de lead)

**Melhorias de UX:**
- Legendas em gráficos (bug alto identificado)
- Tooltips em ícones (bug alto identificado)

**Funcionalidades Operacionais:**
- Painel Supremo básico (lista de organizações, planos, status, contagem de usuários) - **CRÍTICO para operação do SaaS**
- Importação de dados legados via CSV (clientes e materiais)
- Landing Page de Vendas do StudioOS (LP genérica para vender o ERP, diferente de LP personalizada por organização)
- Alertas de estoque mínimo (quando estoque habilitado)

---

### P2 – Pós-MVP / Futuro / Planos Superiores

**Generalização e Expansão:**
- Generalização de produtos (cortina_items → order_items)
- Permissões granulares por módulo/ação
- Histórico de atividades completo (audit log) - já existe `log_alteracoes_status` parcial

**Módulo de Integrações:**
- Módulo de integrações completo (webhooks, NF-e, WhatsApp) - features Business/Enterprise conforme MODELO_NEGOCIO.md
- API pública avançada - provavelmente Enterprise-only conforme MODELO_NEGOCIO.md

**Funcionalidades Avançadas:**
- Website builder completo
- Blog, SEO, heatmaps, funil avançado
- BI avançado, dashboards totalmente customizáveis
- Painel Supremo completo (MRR/ARR, BI, one-click onboarding) - Fase 2+
- Separar campo endereço (rua, número, CEP) - dor de usuário identificada mas não crítica

---

**Este documento é o esqueleto oficial do MVP + plano de execução do StudioOS.**
