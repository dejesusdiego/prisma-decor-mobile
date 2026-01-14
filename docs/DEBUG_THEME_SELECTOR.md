# 🔍 Debug - ThemeSelector Não Aparece

## 📍 Onde Deveria Aparecer

O seletor de temas deveria aparecer **no topo** da página "Configurações da Empresa", **antes** do formulário de configurações.

## 🔍 Como Verificar

### 1. Abrir Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá na aba "Console"
- Procure por: `ThemeSelector renderizado`

### 2. Verificar se o Componente Está Sendo Renderizado

**No console, você deve ver:**
```
ThemeSelector renderizado { isOwner: true/false, isLoading: false, organizationId: "...", themeName: "..." }
```

### 3. Verificar Erros

Procure por erros em vermelho no console, especialmente:
- `Cannot find module '@/lib/themes'`
- `Cannot find module '@/hooks/useTheme'`
- `Cannot read property 'theme_name' of undefined`

---

## 🐛 Possíveis Problemas

### Problema 1: Componente não está sendo importado
**Sintoma:** Erro no console sobre módulo não encontrado

**Solução:** Verificar se os arquivos existem:
- ✅ `src/lib/themes.ts` - Deve existir
- ✅ `src/hooks/useTheme.ts` - Deve existir
- ✅ `src/components/settings/ThemeSelector.tsx` - Deve existir

### Problema 2: Usuário não é Owner
**Sintoma:** Componente renderiza mas mostra apenas mensagem "Apenas proprietários podem alterar"

**Solução:** Verificar role do usuário na tabela `organization_members`:
```sql
SELECT om.role, u.email 
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
WHERE om.organization_id = 'SEU_ORG_ID';
```

### Problema 3: Componente renderiza mas não é visível
**Sintoma:** Sem erros no console, mas não aparece na tela

**Solução:** 
1. Verificar se precisa scrollar para cima
2. Verificar CSS (pode estar com `display: none` ou `opacity: 0`)
3. Verificar se está dentro de um container com `overflow: hidden`

### Problema 4: View não está sendo setada corretamente
**Sintoma:** Página de configurações não carrega

**Solução:** Verificar se ao clicar em "Minha Empresa" no sidebar, a view muda para `configOrganizacao`

---

## ✅ Checklist de Verificação

1. [ ] Abri o console do navegador (F12)
2. [ ] Vejo a mensagem "ThemeSelector renderizado" no console
3. [ ] Não há erros em vermelho no console
4. [ ] Estou na página "Configurações da Empresa"
5. [ ] Rolei a página para cima para ver o topo
6. [ ] Sou owner da organização (verificar no banco)

---

## 🛠️ Teste Rápido

Adicione este código temporariamente no início do `ThemeSelector` para forçar renderização:

```typescript
export function ThemeSelector() {
  // TESTE: Forçar renderização
  return (
    <Card className="border-2 border-red-500">
      <CardHeader>
        <CardTitle className="text-red-500">TESTE - ThemeSelector está funcionando!</CardTitle>
      </CardHeader>
    </Card>
  );
  
  // ... resto do código
}
```

Se você ver um card vermelho com "TESTE", significa que o componente está sendo renderizado.

---

## 📞 Informações para Debug

Quando reportar o problema, inclua:

1. **Console do navegador:**
   - Mensagens de erro (se houver)
   - Mensagem "ThemeSelector renderizado" (se aparecer)

2. **Sua role:**
   - Você é owner, admin ou member?

3. **URL atual:**
   - Qual URL está no navegador?

4. **Como acessou:**
   - Via sidebar "Minha Empresa"?
   - Via URL direta `/configuracoes/organizacao`?
