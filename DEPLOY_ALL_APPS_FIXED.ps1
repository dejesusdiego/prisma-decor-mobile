# ==========================================
# DEPLOY AUTOMÁTICO COM ENV VARS - WINDOWS
# ==========================================
$SUPABASE_URL = "https://tjwpqrlfhngibuwqodcn.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg1NTQsImV4cCI6MjA4MzkwNDU1NH0.BkT0lVPlfR8tGPAPFzaC-aywda8lh3wa8S-z3EpGvHQ"

Write-Host "🚀 Iniciando deploy de todos os apps com variáveis de ambiente..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# ==========================================
# FUNÇÃO: Deploy de um app
# ==========================================
function Deploy-App {
    param(
        [string]$AppName,
        [string]$AppDir,
        [string]$ProjectId
    )
    
    Write-Host ""
    Write-Host "📦 Processando: $AppName" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    
    Set-Location $AppDir
    
    # Verificar se está logado no Vercel
    Write-Host "✓ Verificando login Vercel..." -ForegroundColor Yellow
    $loginCheck = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Não logado no Vercel. Execute primeiro: vercel login" -ForegroundColor Red
        exit 1
    }
    
    # Adicionar env vars (se ainda não existirem)
    Write-Host "✓ Configurando VITE_SUPABASE_URL..." -ForegroundColor Yellow
    $envUrl = vercel env ls 2>&1 | Select-String "VITE_SUPABASE_URL"
    if (-not $envUrl) {
        $SUPABASE_URL | vercel env add VITE_SUPABASE_URL production --yes 2>$null
        Write-Host "  → VITE_SUPABASE_URL adicionada" -ForegroundColor Green
    } else {
        Write-Host "  → VITE_SUPABASE_URL já existe" -ForegroundColor Gray
    }
    
    Write-Host "✓ Configurando VITE_SUPABASE_ANON_KEY..." -ForegroundColor Yellow
    $envKey = vercel env ls 2>&1 | Select-String "VITE_SUPABASE_ANON_KEY"
    if (-not $envKey) {
        $SUPABASE_ANON_KEY | vercel env add VITE_SUPABASE_ANON_KEY production --yes 2>$null
        Write-Host "  → VITE_SUPABASE_ANON_KEY adicionada" -ForegroundColor Green
    } else {
        Write-Host "  → VITE_SUPABASE_ANON_KEY já existe" -ForegroundColor Gray
    }
    
    # Fazer deploy
    Write-Host "🚀 Fazendo deploy em produção..." -ForegroundColor Yellow
    vercel --prod --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $AppName deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro no deploy de $AppName" -ForegroundColor Red
    }
    
    Set-Location $PSScriptRoot
}

# ==========================================
# EXECUÇÃO SEQUENCIAL
# ==========================================

# Salvar diretório inicial
$rootDir = Get-Location

# 1. PLATFORM (Admin) - Prioridade máxima
Deploy-App -AppName "PLATFORM (Admin)" -AppDir "apps/platform"

# 2. PORTAL (Fornecedores)
Deploy-App -AppName "PORTAL (Fornecedores)" -AppDir "apps/portal"

# 3. CORE (ERP) - Se existir
if (Test-Path "apps/core") {
    Deploy-App -AppName "CORE (ERP)" -AppDir "apps/core"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "🎉 TODOS OS DEPLOYS CONCLUÍDOS!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs para testar (segundo seu dashboard Vercel):" -ForegroundColor Cyan
Write-Host "  • Platform (Admin): https://platform-two-mu.vercel.app" -ForegroundColor White
Write-Host "  • Portal (Fornecedores): https://portal-delta-peach.vercel.app" -ForegroundColor White
Write-Host "  • Core (ERP): https://studioos-core.vercel.app (se existir)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Aguarde 1-2 minutos e acesse as URLs acima." -ForegroundColor Yellow
Write-Host ""
Write-Host "Se ainda vir página em branco:" -ForegroundColor Yellow
Write-Host "  1. Abra DevTools (F12) → Console" -ForegroundColor Gray
Write-Host "  2. Verifique se há erros de 'env' ou 'supabase'" -ForegroundColor Gray
Write-Host "  3. Confirme no Vercel Dashboard que as env vars estão em 'Production'" -ForegroundColor Gray

# Voltar para diretório inicial
Set-Location $rootDir
