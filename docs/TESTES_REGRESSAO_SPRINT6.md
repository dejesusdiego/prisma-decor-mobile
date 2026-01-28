# Testes de Regressão - Sprint 6 (Hotfixes)

## Checklist de Validação

### T6.1 - Popup Tour em LP Pública ✅
**Já estava corrigido - verificar:**
- [ ] Acessar landing page pública (ex: `/`, `/lp/empresa`)
- [ ] Confirmar que o tour não aparece
- [ ] Acessar dashboard interno
- [ ] Confirmar que o tour aparece (se não completado)

### T6.2 - RLS Recursão Supplier ✅
**Migration aplicada - verificar:**
- [ ] Executar script: `scripts/verificar-rls-supplier.sql`
- [ ] Fornecedor consegue fazer login no portal
- [ ] Fornecedor consegue visualizar seus materiais
- [ ] Fornecedor consegue editar catálogo

### T6.3 - Botão "Novo Orçamento" Duplicado ✅
**Código corrigido - verificar:**
- [ ] Acessar Dashboard de Orçamentos
- [ ] Verificar que existe apenas UM botão "Novo Orçamento" (na sidebar)
- [ ] Clicar no botão na sidebar - deve abrir wizard
- [ ] Verificar que não há botão "Criar primeiro orçamento" no empty state

### T6.4 - Sincronização Orçamento↔Financeiro ✅
**Migration aplicada - verificar:**
- [ ] Criar orçamento e mudar status para "pago"
- [ ] Verificar se conta_receber foi criada automaticamente
- [ ] Marcar orçamento como "cancelado"
- [ ] Verificar se conta_receber foi cancelada
- [ ] Marcar conta_receber como "pago"
- [ ] Verificar se status do orçamento mudou para "pago"

### T6.5 - Status Contas Receber (priorizar banco) ✅
**Código corrigido - verificar:**
- [ ] Acessar Financeiro > Contas a Receber
- [ ] Marcar conta como "pago" no banco
- [ ] Verificar que UI mostra "Pago" (não sobrescreve)
- [ ] Verificar que contas vencidas mas pagas mostram "Pago" (não "Atrasado")

### T6.6 - Recuperação de Senha ✅
**Já estava implementado - verificar:**
- [ ] Tela de login mostra link "Esqueci minha senha"
- [ ] Clicar no link abre dialog
- [ ] Inserir email válido e clicar "Enviar"
- [ ] Verificar que email de recuperação é enviado

### T6.7 - Soft Delete Usuários ✅
**Migration aplicada - verificar:**
- [ ] Acessar Configurações > Gerenciar Usuários
- [ ] Criar usuário de teste
- [ ] Clicar "Desativar" no usuário
- [ ] Verificar que usuário aparece na aba "Inativos"
- [ ] Tentar fazer login com usuário desativado (deve falhar)
- [ ] Clicar "Restaurar" no usuário inativo
- [ ] Verificar que usuário volta para "Ativos"
- [ ] Tentar fazer login novamente (deve funcionar)

---

## Comandos Úteis

### Verificar funções criadas:
```sql
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname IN ('soft_delete_user', 'restore_user', 'sync_contas_receber_from_orcamento', 'sync_parcelas_from_conta_receber');
```

### Verificar triggers:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_sync%';
```

### Verificar colunas user_roles:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles';
```

---

## Resultado dos Testes

| Teste | Status | Observações |
|-------|--------|-------------|
| T6.1 | ⬜ | |
| T6.2 | ⬜ | |
| T6.3 | ⬜ | |
| T6.4 | ⬜ | |
| T6.5 | ⬜ | |
| T6.6 | ⬜ | |
| T6.7 | ⬜ | |

**Data dos testes:** ___________
**Testador:** ___________
**Aprovado para deploy:** ⬜ Sim ⬜ Não
