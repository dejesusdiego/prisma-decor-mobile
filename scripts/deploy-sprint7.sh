#!/bin/bash

# Script de Deploy - Sprint 7: Painel Admin Supremo
# Uso: ./scripts/deploy-sprint7.sh

set -e

echo "🚀 Iniciando deploy da Sprint 7..."

# Verificar se está na branch correta
current_branch=$(git branch --show-current)
if [ "$current_branch" != "sprint7/admin-supremo-parte1" ]; then
    echo "⚠️  AVISO: Você não está na branch sprint7/admin-supremo-parte1"
    echo "Branch atual: $current_branch"
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se há alterações não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ ERRO: Há alterações não commitadas"
    git status
    exit 1
fi

echo "📦 Fazendo push para o repositório..."
git push origin sprint7/admin-supremo-parte1

echo "🔧 Build do projeto..."
npm run build

echo "🚀 Deploy para Vercel..."
# Usar token fornecido ou solicitar login
if [ -n "$VERCEL_TOKEN" ]; then
    vercel --token "$VERCEL_TOKEN" --prod
else
    echo "⚠️  VERCEL_TOKEN não definido. Fazendo login..."
    vercel --prod
fi

echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Aplicar migrations no Supabase"
echo "   - 20260129000000_add_super_admin_role.sql"
echo "2. Executar script de promoção de super_admin:"
echo "   - scripts/promover-super-admin.sql"
echo "3. Deploy das Edge Functions:"
echo "   - supabase functions deploy calculate-mrr"
echo "   - supabase functions deploy update-feature-flag"
echo "4. Inserir seeds de feature_flags (se necessário)"
echo ""
echo "🌐 Acesse o Painel Admin Supremo em:"
echo "   https://studioos.com.br/admin-supremo"
