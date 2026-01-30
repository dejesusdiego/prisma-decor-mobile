# StudioOS V5 - Scripts de Automação

Este documento contém os scripts de automação para criar a estrutura do monorepo V5.

## 🚀 Abordagem Recomendada: Híbrida

- **Automação**: Estrutura de pastas, configs (package.json, vite, etc.)
- **Manual**: Migração de código (requer discernimento de domínio)

## 📁 Script 1: Estrutura de Pastas

Arquivo: `scripts/v5-setup/create-monorepo-structure.sh`

```bash
#!/bin/bash
# Script de automação: Cria estrutura inicial do monorepo V5
# Uso: ./create-monorepo-structure.sh

set -e

echo "🚀 StudioOS V5 - The Clean Split: Setup Inicial"
echo "================================================"

# Verifica se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto (onde está package.json)"
    exit 1
fi

# Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."

mkdir -p apps/core/src/{pages,components,hooks,lib,types,contexts,integrations}
mkdir -p apps/platform/src/{pages,components,hooks,lib,types,contexts}
mkdir -p apps/portal/src/{pages,components,hooks,lib,types,contexts}
mkdir -p apps/marketing/src/{pages,components,hooks,lib}

mkdir -p shared/ui/src/{components,lib,hooks}
mkdir -p shared/types/src
mkdir -p shared/lib/src/{supabase,utils,constants}

mkdir -p infra/migrations
mkdir -p infra/vercel
mkdir -p infra/supabase/functions

echo "✅ Estrutura de pastas criada"

# Listar estrutura criada
echo ""
echo "📂 Estrutura criada:"
find apps shared infra -type d -maxdepth 3 | sort | sed 's/^/  /'

echo ""
echo "📝 Próximos passos:"
echo "  1. Executar: node scripts/v5-setup/generate-configs.js"
echo "  2. Executar: node scripts/v5-setup/setup-workspace.js"
echo "  3. Migrar código manualmente seguindo o guia docs/V5_MIGRATION_GUIDE.md"
```

## 📦 Script 2: Gerador de Configurações

Arquivo: `scripts/v5-setup/generate-configs.js`

```javascript
#!/usr/bin/env node
/**
 * Script de automação: Gera todos os arquivos de configuração do monorepo V5
 * Uso: node scripts/v5-setup/generate-configs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();

// ============================================================
// TEMPLATES DE CONFIGURAÇÃO
// ============================================================

const ROOT_PACKAGE_JSON = {
  "name": "studioos-v5",
  "private": true,
  "version": "5.0.0",
  "description": "StudioOS V5 - The Clean Split Architecture",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "core:dev": "pnpm --filter @studioos/core dev",
    "core:build": "pnpm --filter @studioos/core build",
    "platform:dev": "pnpm --filter @studioos/platform dev",
    "platform:build": "pnpm --filter @studioos/platform build",
    "portal:dev": "pnpm --filter @studioos/portal dev",
    "portal:build": "pnpm --filter @studioos/portal build",
    "marketing:dev": "pnpm --filter @studioos/marketing dev",
    "marketing:build": "pnpm --filter @studioos/marketing build",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset",
    "db:dump": "supabase db dump --data-only > backup/seed.sql"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "workspaces": [
    "apps/*",
    "shared/*"
  ]
};

const TURBO_JSON = {
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
};

const PNPM_WORKSPACE_YAML = `packages:
  - "apps/*"
  - "shared/*"
`;

const APP_PACKAGE_JSON = (name, port, description) => ({
  "name": `@studioos/${name}`,
  "version": "5.0.0",
  "private": true,
  "description": description,
  "type": "module",
  "scripts": {
    "dev": "vite --port " + port,
    "build": "tsc && vite build",
    "preview": "vite preview --port " + port,
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@studioos/types": "workspace:*",
    "@studioos/lib": "workspace:*",
    "@studioos/ui": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.7",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
});

const VITE_CONFIG_TS = (port) => `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: ${port},
    strictPort: true,
  },
  preview: {
    port: ${port},
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
`;

const TSCONFIG_JSON = {
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
};

const TSCONFIG_NODE_JSON = {
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
};

const INDEX_HTML = (title) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
`;

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* App-specific styles */
`;

const VITE_ENV_TS = `/// <reference types="vite/client" />
`;

const ROUTER_TS = (appName) => `import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'

// TODO: Importar páginas conforme migração
// import { HomePage } from './pages/HomePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <div>${appName} - Home (migrar conteúdo)</div>,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
`;

const APP_LAYOUT_TSX = `import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Adicionar header/navegação específico do app */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
`;

const ERROR_BOUNDARY_TSX = `import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{error.status}</h1>
          <p className="text-muted-foreground">{error.statusText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Erro</h1>
        <p className="text-muted-foreground">Algo deu errado.</p>
      </div>
    </div>
  )
}
`;

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const contentStr = typeof content === 'string' 
    ? content 
    : JSON.stringify(content, null, 2);
  
  fs.writeFileSync(filePath, contentStr + '\\n', 'utf8');
  console.log('  ✓ ' + path.relative(ROOT_DIR, filePath));
}

function generateAppConfig(appName, port, description, title) {
  const appDir = path.join(ROOT_DIR, 'apps', appName);
  
  console.log('\\n📦 Configurando @studioos/' + appName + ' (porta ' + port + ')...');
  
  // package.json
  writeFile(
    path.join(appDir, 'package.json'),
    APP_PACKAGE_JSON(appName, port, description)
  );
  
  // vite.config.ts
  writeFile(
    path.join(appDir, 'vite.config.ts'),
    VITE_CONFIG_TS(port)
  );
  
  // tsconfig.json
  writeFile(
    path.join(appDir, 'tsconfig.json'),
    TSCONFIG_JSON
  );
  
  // tsconfig.node.json
  writeFile(
    path.join(appDir, 'tsconfig.node.json'),
    TSCONFIG_NODE_JSON
  );
  
  // index.html
  writeFile(
    path.join(appDir, 'index.html'),
    INDEX_HTML(title)
  );
  
  // src/main.tsx
  writeFile(
    path.join(appDir, 'src', 'main.tsx'),
    MAIN_TSX
  );
  
  // src/index.css
  writeFile(
    path.join(appDir, 'src', 'index.css'),
    INDEX_CSS
  );
  
  // src/vite-env.d.ts
  writeFile(
    path.join(appDir, 'src', 'vite-env.d.ts'),
    VITE_ENV_TS
  );
  
  // src/router.tsx
  writeFile(
    path.join(appDir, 'src', 'router.tsx'),
    ROUTER_TS(appName)
  );
  
  // src/components/AppLayout.tsx
  writeFile(
    path.join(appDir, 'src', 'components', 'AppLayout.tsx'),
    APP_LAYOUT_TSX
  );
  
  // src/components/ErrorBoundary.tsx
  writeFile(
    path.join(appDir, 'src', 'components', 'ErrorBoundary.tsx'),
    ERROR_BOUNDARY_TSX
  );
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

console.log('🚀 StudioOS V5 - Gerador de Configurações');
console.log('=========================================\\n');

// Verifica se está na raiz
if (!fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
  console.error('❌ Erro: Execute este script na raiz do projeto');
  process.exit(1);
}

// 1. Root configs
console.log('📁 Gerando configurações raiz...');
writeFile(path.join(ROOT_DIR, 'package.json'), ROOT_PACKAGE_JSON);
writeFile(path.join(ROOT_DIR, 'turbo.json'), TURBO_JSON);
writeFile(path.join(ROOT_DIR, 'pnpm-workspace.yaml'), PNPM_WORKSPACE_YAML);

// 2. Apps configs
const apps = [
  { name: 'core', port: 5173, desc: 'Core ERP - Orçamentos, Produção, Financeiro', title: 'StudioOS ERP' },
  { name: 'platform', port: 5174, desc: 'Platform Admin - Gestão de Super Admin', title: 'StudioOS Platform' },
  { name: 'portal', port: 5175, desc: 'Portal de Fornecedores', title: 'StudioOS Fornecedores' },
  { name: 'marketing', port: 5176, desc: 'Landing Pages e Site de Vendas', title: 'StudioOS' },
];

apps.forEach(app => generateAppConfig(app.name, app.port, app.desc, app.title));

// 3. Shared packages configs
console.log('\\n📦 Gerando configurações shared packages...');

const sharedPackages = [
  {
    name: 'types',
    content: {
      name: '@studioos/types',
      version: '5.0.0',
      private: true,
      main: './src/index.ts',
      types: './src/index.ts',
      scripts: {
        'type-check': 'tsc --noEmit'
      },
      devDependencies: {
        'typescript': '^5.2.2'
      }
    }
  },
  {
    name: 'lib',
    content: {
      name: '@studioos/lib',
      version: '5.0.0',
      private: true,
      main: './src/index.ts',
      scripts: {
        'type-check': 'tsc --noEmit'
      },
      dependencies: {
        '@studioos/types': 'workspace:*',
        '@supabase/supabase-js': '^2.39.0'
      },
      devDependencies: {
        'typescript': '^5.2.2'
      }
    }
  },
  {
    name: 'ui',
    content: {
      name: '@studioos/ui',
      version: '5.0.0',
      private: true,
      main: './src/index.ts',
      scripts: {
        'type-check': 'tsc --noEmit'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.294.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.2.0'
      },
      devDependencies: {
        '@types/react': '^18.2.43',
        'typescript': '^5.2.2'
      }
    }
  }
];

sharedPackages.forEach(pkg => {
  const pkgDir = path.join(ROOT_DIR, 'shared', pkg.name);
  writeFile(path.join(pkgDir, 'package.json'), pkg.content);
  writeFile(path.join(pkgDir, 'tsconfig.json'), {
    ...TSCONFIG_JSON,
    compilerOptions: {
      ...TSCONFIG_JSON.compilerOptions,
      declaration: true,
      outDir: './dist'
    }
  });
  console.log('  ✓ shared/' + pkg.name + '/package.json');
});

console.log('\\n✅ Configurações geradas com sucesso!');
console.log('\\n📝 Próximos passos:');
console.log('  1. pnpm install');
console.log('  2. pnpm core:dev (testar app core)');
console.log('  3. Seguir guia de migração de código');
```

## 📋 Script 3: Setup Workspace

Arquivo: `scripts/v5-setup/setup-workspace.js`

```javascript
#!/usr/bin/env node
/**
 * Script de automação: Configura workspace do monorepo V5
 * Uso: node scripts/v5-setup/setup-workspace.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();

console.log('🚀 StudioOS V5 - Setup Workspace');
console.log('=================================\n');

// Verifica se está na raiz
if (!fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
  console.error('❌ Erro: Execute este script na raiz do projeto');
  process.exit(1);
}

// 1. Instala pnpm se não existir
try {
  require('child_process').execSync('pnpm --version', { stdio: 'ignore' });
  console.log('✅ pnpm já instalado');
} catch {
  console.log('📦 Instalando pnpm...');
  require('child_process').execSync('npm install -g pnpm', { stdio: 'inherit' });
}

// 2. Instala dependências
console.log('\n📦 Instalando dependências...');
require('child_process').execSync('pnpm install', { stdio: 'inherit' });

// 3. Gera tipos do Supabase
console.log('\n🔷 Gerando tipos do Supabase...');
try {
  require('child_process').execSync('supabase gen types typescript --project-id tjwpqrlfhngibuwqodcn --schema public > shared/types/src/database.ts', { stdio: 'inherit' });
  console.log('✅ Tipos gerados em shared/types/src/database.ts');
} catch (e) {
  console.log('⚠️  Erro ao gerar tipos. Execute manualmente: supabase gen types...');
}

// 4. Verifica estrutura
console.log('\n📂 Verificando estrutura...');
const requiredDirs = [
  'apps/core/src',
  'apps/platform/src',
  'apps/portal/src',
  'shared/types/src',
  'shared/lib/src',
  'shared/ui/src'
];

let allOk = true;
requiredDirs.forEach(dir => {
  const fullPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    console.log('  ✅ ' + dir);
  } else {
    console.log('  ❌ ' + dir + ' (não encontrado)');
    allOk = false;
  }
});

if (allOk) {
  console.log('\n✅ Workspace configurado com sucesso!');
  console.log('\n🧪 Teste os apps:');
  console.log('  pnpm core:dev      -> http://localhost:5173');
  console.log('  pnpm platform:dev  -> http://localhost:5174');
  console.log('  pnpm portal:dev    -> http://localhost:5175');
  console.log('  pnpm marketing:dev -> http://localhost:5176');
} else {
  console.log('\n⚠️  Alguns diretórios estão faltando. Execute primeiro: create-monorepo-structure.sh');
  process.exit(1);
}
```

## 🔄 Fluxo de Uso

### Dia 1: Setup Inicial

```bash
# 1. Criar estrutura de pastas
bash scripts/v5-setup/create-monorepo-structure.sh

# 2. Gerar todas as configurações
node scripts/v5-setup/generate-configs.js

# 3. Configurar workspace
node scripts/v5-setup/setup-workspace.js
```

### Dias 2-7: Migração Manual

A migração de código deve ser feita **manualmente** com discernimento:

1. **Copiar** (não mover) arquivos do legado para o novo app
2. **Atualizar imports** para usar `@studioos/*`
3. **Testar** no novo app isolado
4. **Remover** do legado após validação

## 📁 O Que é Automatizado vs Manual

| Tarefa | Método |
|--------|--------|
| Estrutura de pastas | ✅ Automação |
| package.json | ✅ Automação |
| vite.config.ts | ✅ Automação |
| tsconfig.json | ✅ Automação |
| Arquivos base (main.tsx, router.tsx) | ✅ Automação |
| **Migração de componentes/pages** | 📝 **Manual** |
| **Ajuste de imports/caminhos** | 📝 **Manual** |
| **Testes de integração** | 📝 **Manual** |

## 🎯 Próximos Passos

1. ✅ Criar scripts de automação (este documento)
2. ⏳ Executar scripts de setup
3. ⏳ Iniciar migração manual seguindo `V5_MIGRATION_GUIDE.md`
4. ⏳ Configurar Vercel multi-deploy
