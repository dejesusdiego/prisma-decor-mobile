# Config Manifest - StudioOS V5

**Versão:** 5.0.0  
**Data:** 2026-01-30  
**Propósito:** Documentar a estratégia de múltiplas configurações e plano de unificação

---

## Visão Geral

O projeto StudioOS V5 opera com 4 conjuntos de configurações separados:
- 1 root package.json (V4 legacy)
- 3 package.json nas aplicações V5 (core, platform, portal)

Esta é uma situação temporária durante a transição da arquitetura V4 para V5.

---

## Configurações Atuais

### 1. Root Package.json (V4 Legacy)

**Arquivo:** `/package.json`

```json
{
  "name": "studioos",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint ."
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    // ... 68 dependências totais
    "react": "^18.3.1",
    "react-router-dom": "^6.30.1"
  }
}
```

**Status:** DEPRECATED - Mantido apenas para referência

**Problemas:**
- 68 dependências (muitas não utilizadas nas apps V5)
- Configuração de build para app única (obsoleto)
- React Router v6 (divergente das apps V5 que usam v7)

---

### 2. Core ERP Package.json

**Arquivo:** `/apps/core/package.json`

```json
{
  "name": "@studioos/core",
  "version": "5.0.0",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    // ... 12 dependências focadas
  }
}
```

**Status:** ACTIVE - ERP principal

**Características:**
- 12 dependências (focado)
- Porta 5173
- React Router v6 (mais antigo que platform/portal)
- Maior variedade de componentes UI

---

### 3. Platform Admin Package.json

**Arquivo:** `/apps/platform/package.json`

```json
{
  "name": "@studioos/platform",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0",
    "@tanstack/react-query": "^5.62.0",
    "react": "^18.3.1",
    "react-router-dom": "^7.0.2",
    // ... 11 dependências focadas
  }
}
```

**Status:** ACTIVE - Admin platform

**Características:**
- 11 dependências
- Porta 5174
- React Router v7 (major diferente!)
- Componentes UI básicos

---

### 4. Portal Fornecedores Package.json

**Arquivo:** `/apps/portal/package.json`

```json
{
  "name": "@studioos/portal",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 5175",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0",
    "@tanstack/react-query": "^5.62.0",
    "react": "^18.3.1",
    "react-router-dom": "^7.0.2",
    // ... 11 dependências focadas
  }
}
```

**Status:** ACTIVE - Portal de fornecedores

**Características:**
- 11 dependências
- Porta 5175
- React Router v7 (igual platform)
- Componentes UI básicos

---

## Análise de Divergências

### Versões de Dependências

| Pacote | Root | Core | Platform | Portal | Recomendado |
|--------|------|------|----------|--------|-------------|
| **react** | 18.3.1 | 18.2.0 | 18.3.1 | 18.3.1 | 18.3.1 |
| **react-dom** | 18.3.1 | 18.2.0 | 18.3.1 | 18.3.1 | 18.3.1 |
| **react-router-dom** | 6.30.1 | 6.21.0 | 7.0.2 | 7.0.2 | 7.0.2 |
| **vite** | 5.4.19 | 5.0.8 | 5.4.11 | 5.4.11 | 5.4.19 |
| **typescript** | 5.8.3 | 5.2.2 | 5.7.2 | 5.7.2 | 5.8.3 |
| **tailwindcss** | 3.4.17 | 3.4.0 | 3.4.17 | 3.4.17 | 3.4.17 |

### Problemas Identificados

1. **React Router v6 vs v7:** Core usa v6, Platform/Portal usam v7 (breaking changes)
2. **React 18.2 vs 18.3:** Core desatualizado
3. **Vite 5.0 vs 5.4:** Core desatualizado
4. **TypeScript 5.2 vs 5.8:** Core desatualizado

---

## Vite Configurations

### Estrutura Comum

Todas as apps V5 têm configurações similares:

```typescript
// apps/*/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Diferenças

| Aspecto | Core | Platform | Portal |
|---------|------|----------|--------|
| **Porta** | 5173 | 5174 | 5175 |
| **Plugin** | @vitejs/plugin-react | @vitejs/plugin-react | @vitejs/plugin-react |
| **Server config** | Padrão | Padrão | Padrão |

**Observação:** Todas as configs são quase idênticas. Ideal para extração para config compartilhada.

---

## Tailwind Configurations

### Configurações Idênticas

```javascript
// apps/*/tailwind.config.js
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mesmas configurações de cores, fontes, etc.
    }
  }
};
```

**Duplicação:** 100% idêntico entre as 3 apps. **Candidato para extração.**

---

## TypeScript Configurations

### Estrutura

| Arquivo | Propósito |
|---------|-----------|
| `tsconfig.json` | Config principal |
| `tsconfig.node.json` | Config para Vite |

### Divergências

Todas as configs são similares, mas com pequenas diferenças nas versões de tipos.

---

## Estratégia de Unificação

### Fase 1: Sincronização Imediata (Curto Prazo)

**Objetivo:** Alinhar versões entre as apps V5

1. **Atualizar apps/core:**
   ```bash
   cd apps/core
   npm update react react-dom
   npm install react-router-dom@^7.0.2
   npm install vite@^5.4.19
   npm install typescript@^5.8.3
   ```

2. **Verificar breaking changes** do React Router v6 → v7

3. **Testar builds** de todas as apps

### Fase 2: Shared Configuration (Médio Prazo)

**Objetivo:** Criar configurações compartilhadas

```
packages/
├── config/
│   ├── package.json
│   ├── tsconfig.base.json
│   ├── vite.config.base.ts
│   └── tailwind.config.base.js
└── shared-ui/
    └── ...
```

**Configuração Base:**
```typescript
// packages/config/vite.config.base.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export const baseConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};
```

**Uso nas Apps:**
```typescript
// apps/core/vite.config.ts
import { defineConfig } from 'vite';
import { baseConfig } from '@studioos/config/vite';

export default defineConfig({
  ...baseConfig,
  server: { port: 5173 },
});
```

### Fase 3: Workspace Root (Longo Prazo)

**Objetivo:** Configurar monorepo com workspaces

**package.json root:**
```json
{
  "name": "studioos-workspace",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:core": "cd apps/core && npm run dev",
    "dev:platform": "cd apps/platform && npm run dev",
    "dev:portal": "cd apps/portal && npm run dev",
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces"
  }
}
```

**Alternativa com pnpm:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## Plano de Ação

### Imediato (Esta Semana)

- [ ] Sincronizar versões de React nas 3 apps V5
- [ ] Atualizar apps/core para React Router v7
- [ ] Documentar breaking changes
- [ ] Testar builds após atualização

### Curto Prazo (Próximo Mês)

- [ ] Criar `packages/config/`
- [ ] Extrair tailwind.config.js compartilhado
- [ ] Extrair tsconfig.json base
- [ ] Criar vite.config.base.ts

### Médio Prazo (Próximo Trimestre)

- [ ] Configurar workspaces no root
- [ ] Migrar para pnpm/npm workspaces
- [ ] Criar scripts unificados de build
- [ ] Implementar pipeline CI/CD unificado

### Longo Prazo (6+ Meses)

- [ ] Remover package.json legado do root
- [ ] Consolidar todos os builds
- [ ] Implementar deploy automatizado multi-app
- [ ] Depreciar código V4 completamente

---

## Benefícios da Unificação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Manutenção** | 4 configs separadas | 1 config base + overrides |
| **Updates** | Update em 4 lugares | Update em 1 lugar |
| **Consistência** | Divergências de versão | Versões alinhadas |
| **Onboarding** | Complexo | Simples |
| **Build** | Scripts separados | Script unificado |

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Breaking changes React Router | Alto | Testes extensivos, migration guide |
| Incompatibilidade de tipos | Médio | Type checking em CI/CD |
| Build failures | Médio | Rollback strategy, version pinning |
| Perda de config específica | Baixo | Overrides preservados |

---

## Referências

- [V5 Migration Guide](./V5_MIGRATION_GUIDE.md)
- [Architecture](./ARCHITECTURE.md)
- [V5 Deploy Guide](./V5_DEPLOY_GUIDE.md)

---

**Documento mantido por:** StudioOS Team  
**Última atualização:** 2026-01-30
