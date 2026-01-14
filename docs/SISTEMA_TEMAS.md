# 🎨 Sistema de Temas Multi-Tenancy

## 📊 Resumo

Sistema completo de temas de cores com suporte a light/dark mode para cada organização.

---

## ✅ Funcionalidades Implementadas

### 1. Sistema de Temas
- ✅ 8 temas pré-definidos:
  - **Clássico** (default) - Preto e dourado (padrão atual)
  - **Azul Profissional** - Azul moderno e confiável
  - **Verde Natural** - Verde fresco e sustentável
  - **Roxo Criativo** - Roxo inovador e criativo
  - **Vermelho Energético** - Vermelho vibrante e dinâmico
  - **Laranja Vibrante** - Laranja caloroso e acolhedor
  - **Teal Moderno** - Teal elegante e moderno
  - **Indigo Profissional** - Indigo sofisticado e profissional

### 2. Light/Dark Mode
- ✅ Cada tema possui versão clara e escura
- ✅ Toggle de dark mode no sidebar
- ✅ Preferência salva no localStorage
- ✅ Detecção automática da preferência do sistema

### 3. Integração Multi-Tenancy
- ✅ Tema armazenado por organização (`theme_name` na tabela `organizations`)
- ✅ Aplicação automática ao carregar organização
- ✅ Seletor de temas na página de configurações
- ✅ Preview de temas antes de salvar

### 4. Componentes Criados
- ✅ `src/lib/themes.ts` - Definição de todos os temas
- ✅ `src/hooks/useTheme.ts` - Hook para gerenciar temas
- ✅ `src/components/settings/ThemeSelector.tsx` - Seletor visual de temas
- ✅ `src/components/ThemeInitializer.tsx` - Inicializador de tema

---

## 🎯 Como Usar

### Para Administradores

1. **Acessar Configurações:**
   - Ir em "Configurações da Empresa"
   - Seção "Tema de Cores" no topo

2. **Selecionar Tema:**
   - Visualizar preview de cada tema
   - Alternar entre modo claro/escuro para preview
   - Clicar no tema desejado
   - Clicar em "Salvar Tema"

3. **Toggle Dark Mode:**
   - Usar botão no sidebar (ícone de lua/sol)
   - Preferência é salva automaticamente

---

## 🛠️ Estrutura Técnica

### Migration SQL
```sql
-- Adiciona campo theme_name na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'default';
```

### Hook useTheme
```typescript
const { currentTheme, theme, isDark, toggleDarkMode, availableThemes } = useTheme();
```

### Aplicar Tema Programaticamente
```typescript
import { getTheme, applyTheme } from '@/lib/themes';

const theme = getTheme('blue');
applyTheme(theme, isDark);
```

---

## 📋 Temas Disponíveis

| Nome | Display | Descrição | Cor Primária | Cor Accent |
|------|---------|-----------|--------------|------------|
| default | Clássico | Preto e dourado elegante | #1a1a1a | #d4af37 |
| blue | Azul Profissional | Azul moderno e confiável | #3b82f6 | #3b82f6 |
| green | Verde Natural | Verde fresco e sustentável | #059669 | #10b981 |
| purple | Roxo Criativo | Roxo inovador e criativo | #7c3aed | #a78bfa |
| red | Vermelho Energético | Vermelho vibrante e dinâmico | #dc2626 | #ef4444 |
| orange | Laranja Vibrante | Laranja caloroso e acolhedor | #ea580c | #f97316 |
| teal | Teal Moderno | Teal elegante e moderno | #0d9488 | #14b8a6 |
| indigo | Indigo Profissional | Indigo sofisticado e profissional | #4f46e5 | #6366f1 |

---

## 🎨 Customização

### Adicionar Novo Tema

1. **Definir tema em `src/lib/themes.ts`:**
```typescript
const newTheme: Theme = {
  name: 'pink',
  displayName: 'Rosa Elegante',
  description: 'Tema rosa suave e elegante',
  preview: {
    primary: '#ec4899',
    accent: '#f472b6',
  },
  light: { /* cores light mode */ },
  dark: { /* cores dark mode */ },
};
```

2. **Adicionar ao objeto themes:**
```typescript
export const themes: Record<ThemeName, Theme> = {
  // ... temas existentes
  pink: newTheme,
};
```

3. **Atualizar tipo ThemeName:**
```typescript
export type ThemeName = 'default' | 'blue' | ... | 'pink';
```

4. **Atualizar constraint no banco:**
```sql
ALTER TABLE organizations 
DROP CONSTRAINT IF EXISTS organizations_theme_name_check;

ALTER TABLE organizations 
ADD CONSTRAINT organizations_theme_name_check 
CHECK (theme_name IN ('default', 'blue', ..., 'pink'));
```

---

## 🔄 Transições

- ✅ Transições suaves entre temas (0.3s)
- ✅ Transições suaves entre light/dark mode
- ✅ Sem "flash" de conteúdo durante mudanças

---

## 📝 Próximos Passos

- [ ] Adicionar mais temas conforme demanda
- [ ] Permitir customização de cores individuais (futuro)
- [ ] Preview em tempo real ao passar mouse sobre temas
- [ ] Exportar/importar temas customizados

---

## ✅ Status

**Sistema completo e funcional!** 🎉

- ✅ 8 temas implementados
- ✅ Light/dark mode para cada tema
- ✅ Integração com multi-tenancy
- ✅ Seletor visual na configurações
- ✅ Toggle dark mode no sidebar
- ✅ Transições suaves
