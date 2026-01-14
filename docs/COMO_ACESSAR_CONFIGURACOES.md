# 📍 Como Acessar as Configurações da Empresa

## 🎯 Localização no Sistema

### Via Sidebar (Navegação Interna)

1. **No menu lateral (sidebar):**
   - Abra a seção **"Administração"** (ícone de chave inglesa 🔧)
   - Clique em **"Minha Empresa"** (ícone de prédio 🏢)
   - A página de configurações será exibida

2. **Estrutura do menu:**
   ```
   Sidebar → Administração → Minha Empresa
   ```

### Via URL Direta

- **Rota:** `/configuracoes/organizacao`
- **URL completa:** `https://seu-dominio.com/configuracoes/organizacao`

---

## 📋 O Que Você Verá

Na página de configurações, você encontrará:

1. **Tema de Cores** (no topo)
   - Grid com 8 temas disponíveis
   - Preview de cada tema
   - Toggle para ver em modo claro/escuro
   - Botão "Salvar Tema"

2. **Configurações da Empresa**
   - Logo da empresa
   - Nome e tagline
   - Informações de contato
   - Dados fiscais

---

## 🔐 Permissões

- **Tema de Cores:** Apenas **proprietários** podem alterar
- **Configurações Gerais:** Apenas **admins/proprietários** podem alterar

---

## 🛠️ Estrutura Técnica

### Arquivos Envolvidos

1. **Sidebar:**
   - `src/components/orcamento/OrcamentoSidebar.tsx`
   - Item: `configOrganizacao` na seção `administracaoNavItems`

2. **Página Principal:**
   - `src/pages/GerarOrcamento.tsx`
   - Renderiza `ThemeSelector` + `OrgSettingsForm` quando `view === 'configOrganizacao'`

3. **Componentes:**
   - `src/components/settings/ThemeSelector.tsx` - Seletor de temas
   - `src/components/settings/OrgSettingsForm.tsx` - Formulário de configurações

4. **Rota:**
   - `src/App.tsx` - Rota `/configuracoes/organizacao`

---

## 🐛 Troubleshooting

### Não consigo ver "Minha Empresa" no menu

**Possíveis causas:**
1. Você não é admin/proprietário
2. A seção "Administração" está colapsada (clique para expandir)
3. O sidebar está colapsado (expanda para ver os labels)

### A página não carrega

**Verifique:**
1. Se você está autenticado
2. Se você tem permissão de admin/proprietário
3. Se a rota está correta no navegador

### O seletor de temas não aparece

**Verifique:**
1. Se você é proprietário da organização
2. Se a migration SQL foi executada (`theme_name` na tabela `organizations`)
3. Console do navegador para erros

---

## ✅ Checklist de Acesso

- [ ] Estou logado no sistema
- [ ] Sou admin ou proprietário
- [ ] Vejo a seção "Administração" no sidebar
- [ ] Vejo o item "Minha Empresa" dentro de "Administração"
- [ ] Ao clicar, a página de configurações carrega
- [ ] Vejo o seletor de temas no topo
- [ ] Vejo o formulário de configurações abaixo

---

## 📸 Visualização

```
┌─────────────────────────────────────┐
│  Sidebar                            │
│  ┌─────────────────────────────┐   │
│  │ 🔧 Administração            │   │
│  │   ├─ Gestão de Materiais    │   │
│  │   ├─ Categorias e Pagamentos│   │
│  │   ├─ 🏢 Minha Empresa ← AQUI│   │
│  │   └─ Ajustes do Sistema     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```
