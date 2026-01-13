# 🚀 MIGRAÇÃO COMPLETA - PRISMA DECOR ERP

Apenas **2 passos** para migrar tudo!

---

## PASSO 1: Executar o SQL (UMA VEZ)

1. Abra o SQL Editor do novo Supabase:
   ```
   https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql
   ```

2. Copie **TODO** o conteúdo do arquivo:
   ```
   docs/backup/MIGRACAO_COMPLETA.sql
   ```

3. Cole no SQL Editor e clique em **Run**

4. ✅ Pronto! Schema criado.

---

## PASSO 2: Importar os Dados (Script Automático)

### 2.1 Obter a Service Role Key

1. Acesse: `https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/settings/api`
2. Copie a **service_role key** (a chave SECRETA, não a anon!)
3. ⚠️ NUNCA compartilhe essa chave publicamente!

### 2.2 Executar o Script

```powershell
# No PowerShell, navegue até a pasta do projeto
cd "C:\Users\Gabri\Documents\JBD\Oferta Correios (1)\prisma-decor-mobile"

# Defina a chave (cole sua service_role key)
$env:SUPABASE_SERVICE_ROLE_KEY = "sua_service_role_key_aqui"

# Execute o script
node scripts/migrar-dados.js
```

**Alternativa**: Edite o arquivo `scripts/migrar-dados.js` e cole a chave diretamente.

---

## ✅ O QUE ACONTECE

| Passo | Descrição |
|-------|-----------|
| 1 | Script lê os CSVs de `Downloads\CSV TABELAS` |
| 2 | Conecta ao Supabase com Service Role Key |
| 3 | Insere dados respeitando ordem de dependências |
| 4 | Ignora duplicatas automaticamente |

---

## 📋 APÓS A MIGRAÇÃO

### Criar usuários e associar à organização

No SQL Editor do novo Supabase, após criar um usuário:

```sql
-- Associar usuário à organização Prisma
INSERT INTO organization_members (user_id, organization_id, role)
VALUES ('ID_DO_USUARIO_CRIADO', '11111111-1111-1111-1111-111111111111', 'owner')
ON CONFLICT DO NOTHING;

-- Dar role de admin
INSERT INTO user_roles (user_id, role)
VALUES ('ID_DO_USUARIO_CRIADO', 'admin')
ON CONFLICT DO NOTHING;
```

### Testar o frontend

Altere o `.env` para apontar para o novo Supabase e teste!

---

## 🔧 TROUBLESHOOTING

| Erro | Solução |
|------|---------|
| `relation does not exist` | Execute o PASSO 1 primeiro! |
| `permission denied` | Use a **service_role** key (não a anon) |
| `duplicate key` | Normal - script ignora duplicatas |
| `foreign key violation` | Verifique ordem das importações |
