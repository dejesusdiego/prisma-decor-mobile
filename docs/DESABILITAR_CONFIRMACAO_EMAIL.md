# 📧 Desabilitar Confirmação de Email (MVP) - OBRIGATÓRIO

## 🎯 Problema

O Supabase está exigindo confirmação de email antes de permitir login. Como temos **aprovação manual de fornecedores**, não precisamos de confirmação por email. Além disso, o link de confirmação estava apontando para `localhost:3000` ao invés do domínio de produção.

## ✅ Solução: Desabilitar no Supabase Dashboard (OBRIGATÓRIO)

### ⚠️ IMPORTANTE: Esta configuração é OBRIGATÓRIA para o funcionamento do sistema

### Passo a Passo:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn)
2. Vá em **Authentication** → **Settings** (ou **Providers** → **Email**)
3. Encontre a opção **"Confirm email"** ou **"Enable email confirmations"**
4. **Desabilite** essa opção (toggle OFF) - **ISSO É OBRIGATÓRIO**
5. Salve as alterações

### Por que desabilitar?

- ✅ Temos **aprovação manual** de fornecedores (não precisamos de confirmação por email)
- ✅ O link de confirmação estava apontando para `localhost:3000` (erro)
- ✅ Simplifica o fluxo: cadastro → aprovação manual → acesso
- ✅ Evita confusão: fornecedor não precisa confirmar email E aguardar aprovação

### Alternativa: Configurar via SQL

Se preferir via SQL, execute no SQL Editor:

```sql
-- Verificar configuração atual
SELECT * FROM auth.config WHERE key = 'email_confirmation_enabled';

-- Desabilitar confirmação de email (se a tabela existir)
-- Nota: Isso pode não funcionar dependendo da versão do Supabase
-- A forma recomendada é via Dashboard
```

## 🔧 Solução Técnica Implementada

A migration `20260117000001_supplier_self_service_registration.sql` já tenta confirmar o email automaticamente via função RPC:

```sql
-- Confirmar email automaticamente (MVP)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = v_user_id_final
  AND email_confirmed_at IS NULL;
```

**Porém**, isso pode não funcionar por questões de segurança do Supabase. A solução definitiva é desabilitar a confirmação no Dashboard.

## 📝 Tratamento de Erro no Frontend

O código já trata o erro "Email not confirmed" de forma mais amigável:

- **Cadastro:** Tenta fazer login automaticamente se o email já estiver cadastrado
- **Login:** Mostra mensagem clara: "Email não confirmado. Verifique sua caixa de entrada ou entre em contato com o suporte."

## ⚠️ Importante

Após desabilitar a confirmação de email no Dashboard:
- Novos cadastros não precisarão confirmar email
- Usuários existentes que não confirmaram ainda precisarão confirmar ou ter o email confirmado manualmente via Dashboard

## 🔍 Verificar se Está Funcionando

1. Faça um novo cadastro de fornecedor
2. Tente fazer login imediatamente após o cadastro
3. Se funcionar sem erro de "Email not confirmed", está correto!

---

**Última atualização:** 2026-01-17
