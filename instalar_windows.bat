@echo off
rem ==============================================================================
rem 🪟 ACDC - Cockpit de Precificação & Regras Atuariais (NTT DATA / MAPFRE)
rem Instalador One-Click para Windows (Suporte Nativo e WSL2)
rem ==============================================================================

chcp 65001 > nul
title Instalador Cockpit ACDC - NTT DATA / MAPFRE
color 0B

echo.
echo ================================================================================
echo 🪟 ACDC - Configuração Inicial One-Click (Windows)
echo    NTT DATA / MAPFRE Insurance Technology
echo ================================================================================
echo Diretório da Solução: %~dp0
echo.

set REPO_DIR=%~dp0
cd /d "%REPO_DIR%"

rem 1. Detecção de WSL2
echo 🔍 [1/6] Verificando subsistema WSL2 / Windows...
where wsl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ WSL2 detectado no sistema operacional.
) else (
    echo   ℹ️ WSL2 não configurado. Prosseguindo em modo Windows nativo.
)

rem 2. Verificação do Node.js
echo 🔍 [2/6] Verificando ambiente Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo   ✓ Node.js detectado: %NODE_VER%
) else (
    echo   ⚠️ Node.js não encontrado no PATH.
    echo   Tentando instalar Node.js LTS via winget...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% NEQ 0 (
        echo   ❌ Por favor, instale o Node.js v20+ em https://nodejs.org/ e execute este instalador novamente.
        pause
        exit /b 1
    )
)

rem 3. Verificação do Python
echo 🔍 [3/6] Verificando ambiente Python 3...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
    echo   ✓ Python detectado: %PY_VER%
) else (
    echo   ⚠️ Python 3 não encontrado no PATH.
    echo   Tentando instalar Python 3.11 via winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% NEQ 0 (
        echo   ❌ Por favor, instale o Python 3.11+ em https://www.python.org/ e execute este instalador novamente.
        pause
        exit /b 1
    )
)

rem 4. Verificação do Docker
echo 🔍 [4/6] Verificando Docker Desktop...
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Docker detectado.
    docker info >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   ✓ Docker Desktop está ativo.
    ) else (
        echo   ⚠️ Docker Desktop não parece estar rodando no momento.
    )
) else (
    echo   ℹ️ Docker não instalado. O MongoDB poderá ser acessado remotamente via Área Administrativa.
)

rem 5. Instalação das dependências npm
echo 📦 [5/6] Instalando dependências npm (Backend e Frontend)...
echo   Instalando dependências do Servidor Backend...
cd /d "%REPO_DIR%server"
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ Falha ao instalar dependências do backend.
    cd /d "%REPO_DIR%"
    pause
    exit /b 1
)
echo   ✓ Backend pronto.

echo   Instalando dependências do Frontend Web...
cd /d "%REPO_DIR%client"
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ Falha ao instalar dependências do frontend.
    cd /d "%REPO_DIR%"
    pause
    exit /b 1
)
echo   ✓ Frontend pronto.

cd /d "%REPO_DIR%"

rem 6. Configuração dos Tokens do Gateway
echo 🔑 [6/6] Verificando configuração do Gateway de IA...
if not exist "%REPO_DIR%gateway\tokens.json" (
    if exist "%REPO_DIR%gateway\tokens.example.json" (
        copy "%REPO_DIR%gateway\tokens.example.json" "%REPO_DIR%gateway\tokens.json" >nul
        echo   ✓ Template de tokens copiado para gateway\tokens.json.
    )
)

rem 7. Criação do Atalho na Área de Trabalho (Desktop)
echo.
set DESKTOP_DIR=%USERPROFILE%\Desktop
set SHORTCUT_BAT=%DESKTOP_DIR%\Iniciar Cockpit NTT DATA.bat

echo 🖥️ Criando atalho na Área de Trabalho (Desktop)...
(
    echo @echo off
    echo cd /d "%REPO_DIR%"
    echo call "%REPO_DIR%iniciar_windows.bat"
) > "%SHORTCUT_BAT%"

if exist "%SHORTCUT_BAT%" (
    echo   ✓ Atalho 'Iniciar Cockpit NTT DATA.bat' criado na Área de Trabalho com sucesso!
)

echo.
echo ================================================================================
echo 🎉 Instalação Concluída com Sucesso!
echo ================================================================================
echo Para o uso diário, você pode:
echo   1. Dar duplo clique no atalho 'Iniciar Cockpit NTT DATA.bat' na sua Área de Trabalho.
echo   OU
echo   2. Dar duplo clique no arquivo 'iniciar_windows.bat' na raiz deste repositório.
echo.
echo O sistema iniciará o MongoDB, AI Gateway, Backend e Frontend, abrindo o navegador em:
echo http://localhost:5173/
echo ================================================================================
echo.
pause
