@echo off
chcp 65001 >nul
echo ==========================================
echo DEPLOY AUTOMATICO COM ENV VARS - WINDOWSecho ==========================================
echo.

set SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg1NTQsImV4cCI6MjA4MzkwNDU1NH0.BkT0lVPlfR8tGPAPFzaC-aywda8lh3wa8S-z3EpGvHQ

echo 🚀 Iniciando deploy de todos os apps...
echo ==================================================
echo.

REM ==========================================
REM FUNCAO: Deploy de um app
REM ==========================================
:deploy_app
set APP_NAME=%1
set APP_DIR=%2

echo.
echo 📦 Processando: %APP_NAME%
echo --------------------------------------------------

cd %APP_DIR%

echo ✓ Configurando VITE_SUPABASE_URL...
echo %SUPABASE_URL% | vercel env add VITE_SUPABASE_URL production --yes 2>nul

echo ✓ Configurando VITE_SUPABASE_ANON_KEY...
echo %SUPABASE_ANON_KEY% | vercel env add VITE_SUPABASE_ANON_KEY production --yes 2>nul

echo 🚀 Fazendo deploy em producao...
vercel --prod --yes

if errorlevel 1 (
    echo ❌ Erro no deploy de %APP_NAME%
) else (
    echo ✅ %APP_NAME% finalizado!
)

cd ..\..
goto :eof

REM ==========================================
REM EXECUCAO
REM ==========================================

echo.
echo 📦 Processando: PLATFORM (Admin)
echo --------------------------------------------------
cd apps/platform
echo ✓ Configurando VITE_SUPABASE_URL...
echo %SUPABASE_URL% | vercel env add VITE_SUPABASE_URL production --yes 2>nul
echo ✓ Configurando VITE_SUPABASE_ANON_KEY...
echo %SUPABASE_ANON_KEY% | vercel env add VITE_SUPABASE_ANON_KEY production --yes 2>nul
echo 🚀 Fazendo deploy em producao...
vercel --prod --yes
if errorlevel 1 (echo ❌ Erro no deploy) else (echo ✅ PLATFORM finalizado!)
cd ..\..

echo.
echo 📦 Processando: PORTAL (Fornecedores)
echo --------------------------------------------------
cd apps/portal
echo ✓ Configurando VITE_SUPABASE_URL...
echo %SUPABASE_URL% | vercel env add VITE_SUPABASE_URL production --yes 2>nul
echo ✓ Configurando VITE_SUPABASE_ANON_KEY...
echo %SUPABASE_ANON_KEY% | vercel env add VITE_SUPABASE_ANON_KEY production --yes 2>nul
echo 🚀 Fazendo deploy em producao...
vercel --prod --yes
if errorlevel 1 (echo ❌ Erro no deploy) else (echo ✅ PORTAL finalizado!)
cd ..\..

echo.
echo ==================================================
echo 🎉 TODOS OS DEPLOYS CONCLUIDOS!
echo ==================================================
echo.
echo URLs para testar (segundo seu dashboard Vercel):
echo   • Platform (Admin): https://platform-two-mu.vercel.app
echo   • Portal (Fornecedores): https://portal-delta-peach.vercel.app
echo.
echo ⚠️  Aguarde 1-2 minutos e acesse as URLs acima.
echo.
echo Se ainda vir pagina em branco:
echo   1. Abra DevTools (F12) → Console
echo   2. Verifique se ha erros de 'env' ou 'supabase'
echo   3. Confirme no Vercel Dashboard que as env vars estao em 'Production'
echo.
pause
