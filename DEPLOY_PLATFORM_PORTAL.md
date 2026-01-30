# Deploy Platform e Portal - Comandos Manuais

> ⚠️ **Importante**: Execute estes comandos manualmente no terminal, pois o sistema bloqueia execução automática com tokens Vercel.

## Pré-requisitos

Você está em: `apps/core`
Precisa ir para: `apps/platform` e `apps/portal`

## Comandos para Executar

### 1. Deploy Platform (Admin)

```bash
# Navegar para platform (do core, volte uma pasta e entre em platform)
cd ../platform

# Deploy na Vercel
vercel --token ADsg2JTsTtxhdtYQjNEXDl6A --yes
```

Aguarde o deploy completar. Anote a URL gerada (ex: `studioos-platform-xxx.vercel.app`)

### 2. Deploy Portal (Fornecedores)

```bash
# Navegar para portal (da platform, volte uma pasta e entre em portal)
cd ../portal

# Deploy na Vercel
vercel --token ADsg2JTsTtxhdtYQjNEXDl6A --yes
```

Aguarde o deploy completar. Anote a URL gerada (ex: `studioos-portal-xxx.vercel.app`)

## URLs Esperadas

| App | URL Preview | Domínio Final |
|-----|-------------|---------------|
| Core (ERP) | ✅ Já deployado | app.studioos.pro |
| Platform (Admin) | Aguardando deploy | panel.studioos.pro |
| Portal (Fornecedores) | Aguardando deploy | fornecedores.studioos.pro |

## Após o Deploy

1. Copie as URLs geradas
2. Configure os domínios personalizados no dashboard da Vercel
3. Atualize as variáveis de ambiente se necessário

## Troubleshooting

Se der erro de `Cannot find module 'tailwindcss-animate'`:
- O fix já foi aplicado em todos os package.json
- Execute `npm install` antes do deploy se necessário

Se der erro de path:
- Certifique-se de estar na pasta correta (`apps/platform` ou `apps/portal`)
- Use `cd` para navegar corretamente
