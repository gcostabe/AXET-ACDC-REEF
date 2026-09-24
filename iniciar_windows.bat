@echo off
rem ==============================================================================
rem 🪟 ACDC - Cockpit de Precificação & Regras Atuariais (NTT DATA / MAPFRE)
rem Script de Execução Diária (One-Click Windows Launcher)
rem ==============================================================================

chcp 65001 > nul
title Cockpit ACDC - NTT DATA / MAPFRE
color 0A

set REPO_DIR=%~dp0
cd /d "%REPO_DIR%"

cls
echo ================================================================================
echo 🚀 INICIANDO COCKPIT ACDC - NTT DATA / MAPFRE
echo ================================================================================
echo Diretório: %REPO_DIR%
echo.

rem 1. Inicialização do MongoDB Local via Docker
echo 📦 [1/4] Verificando MongoDB Local...
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    docker info >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   Iniciando container acdc-mongodb via Docker...
        docker compose up -d acdc-mongodb >nul 2>&1
        echo   ✓ MongoDB ativo na porta 27017.
    ) else (
        echo   ℹ️ Docker Desktop não está rodando. O backend tentará conectar ou usar fallback.
    )
) else (
    echo   ℹ️ Docker não instalado. Usando configurações ativas da Área Administrativa.
)

rem 2. Inicialização do Local AI Gateway (porta 8766)
echo 🤖 [2/4] Verificando Local AI Gateway...
netstat -ano | findstr :8766 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Local AI Gateway já está ativo na porta 8766.
) else (
    echo   Iniciando Local AI Gateway na porta 8766...
    start "ACDC - AI Gateway" /min cmd /c "cd /d %REPO_DIR%gateway && python local_ai_gateway.py"
    echo   ✓ Local AI Gateway iniciado em segundo plano.
)

rem 3. Inicialização do Backend API (porta 4000)
echo ⚙️ [3/4] Iniciando Servidor Backend API (porta 4000)...
start "ACDC - Backend API" /min cmd /c "cd /d %REPO_DIR%server && npm run dev"
echo   ✓ Backend API iniciado.

rem 4. Inicialização do Frontend Vite (porta 5173)
echo 🌐 [4/4] Iniciando Interface Web Cockpit (porta 5173)...
start "ACDC - Frontend Web" /min cmd /c "cd /d %REPO_DIR%client && npm run dev"
echo   ✓ Frontend Web iniciado.

rem Aguarda inicialização dos serviços
echo.
echo Aguardando inicialização completa dos serviços...
timeout /t 3 /nobreak >nul

rem Abrir o navegador padrão automaticamente
echo.
echo ================================================================================
echo ✨ SISTEMA PRONTO PARA USO!
echo ================================================================================
echo 📍 Interface Web (Cockpit): http://localhost:5173/
echo 📍 Backend API:            http://localhost:4000/api
echo 📍 Gateway de IA & Okta:   http://127.0.0.1:8766/
echo ================================================================================
echo Abrindo o navegador automaticamente...
start http://localhost:5173/

echo.
echo ================================================================================
echo Mantenha esta janela aberta enquanto utiliza o Cockpit ACDC.
echo Para ENCERRAR a aplicação e fechar os serviços, pressione qualquer tecla abaixo.
echo ================================================================================
echo.
pause

echo.
echo 🛑 Encerrando processos do Cockpit ACDC...
taskkill /FI "WINDOWTITLE eq ACDC - Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ACDC - Frontend Web*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ACDC - AI Gateway*" /F >nul 2>&1
echo ✓ Serviços encerrados. Até logo!
timeout /t 2 /nobreak >nul
