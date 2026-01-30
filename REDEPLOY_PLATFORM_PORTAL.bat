@echo off
echo ========================================
echo REDEPLOY PLATFORM E PORTAL PARA VERCEL
echo ========================================
echo.

echo [1/2] Fazendo deploy do Platform (Admin)...
cd apps/platform
call vercel --token ADsg2JTsTtxhdtYQjNEXDl6A --prod
if errorlevel 1 (
    echo ERRO no deploy do Platform
    pause
    exit /b 1
)

echo.
echo [2/2] Fazendo deploy do Portal (Fornecedores)...
cd ../portal
call vercel --token ADsg2JTsTtxhdtYQjNEXDl6A --prod
if errorlevel 1 (
    echo ERRO no deploy do Portal
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Verifique as URLs:
echo - Platform: https://prisma-platform.vercel.app
echo - Portal: https://prisma-portal.vercel.app
echo.
pause
