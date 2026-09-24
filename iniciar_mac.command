#!/usr/bin/env bash
# ==============================================================================
# 🍏 ACDC - Cockpit de Precificação & Regras Atuariais (NTT DATA / MAPFRE)
# Script de Execução Diária (One-Click macOS Launcher)
# ==============================================================================

# Posiciona no diretório raiz do repositório
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

clear
echo "================================================================================"
echo "🚀 INICIANDO COCKPIT ACDC - NTT DATA / MAPFRE"
echo "================================================================================"
echo "Diretório: $REPO_DIR"
echo ""

# Função de encerramento gracioso ao fechar o terminal ou pressionar Ctrl+C
cleanup() {
    echo ""
    echo "================================================================================"
    echo "🛑 Encerrando processos do Cockpit ACDC..."
    kill $(jobs -p) 2>/dev/null || true
    echo "✓ Processos finalizados. Até logo!"
    echo "================================================================================"
    exit 0
}
trap cleanup INT TERM EXIT

# 1. Checagem e Inicialização do MongoDB Local via Docker
echo "📦 [1/4] Verificando banco de dados MongoDB..."
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "  Iniciando container acdc-mongodb via Docker..."
    docker compose up -d acdc-mongodb 2>/dev/null || true
    echo "  ✓ MongoDB pronto na porta 27017."
else
    echo "  ℹ️ Docker daemon não detectado ou inativo. O backend usará conexão configurada ou fallback."
fi

# 2. Inicialização do Local AI Gateway (AXET / Okta)
echo "🤖 [2/4] Verificando Local AI Gateway..."
if lsof -Pi :8766 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  ✓ Local AI Gateway já está ativo na porta 8766."
else
    echo "  Iniciando Local AI Gateway (porta 8766)..."
    python3 "$REPO_DIR/gateway/local_ai_gateway.py" > "$REPO_DIR/gateway/gateway.log" 2>&1 &
    GATEWAY_PID=$!
    sleep 1
    if lsof -Pi :8766 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ✓ Local AI Gateway iniciado com sucesso (PID: $GATEWAY_PID)."
    else
        echo "  ⚠️ Gateway em inicialização em segundo plano."
    fi
fi

# 3. Inicialização do Backend Node.js
echo "⚙️ [3/4] Iniciando Servidor Backend API (porta 4000)..."
(cd "$REPO_DIR/server" && npm run dev) &
SERVER_PID=$!

# 4. Inicialização do Frontend Vite
echo "🌐 [4/4] Iniciando Interface Web Cockpit (porta 5173)..."
(cd "$REPO_DIR/client" && npm run dev) &
CLIENT_PID=$!

# Aguarda 2 segundos para o Vite e Express subirem
sleep 2

# Abre automaticamente o navegador na interface do sistema
echo ""
echo "================================================================================"
echo "✨ SISTEMA PRONTO PARA USO!"
echo "================================================================================"
echo "📍 Interface Web (Cockpit): http://localhost:5173/"
echo "📍 Backend API:            http://localhost:4000/api"
echo "📍 Gateway de IA & Okta:   http://127.0.0.1:8766/"
echo "================================================================================"
echo "Abrindo o navegador automaticamente..."
open "http://localhost:5173/" 2>/dev/null || true

echo ""
echo "Pressione [Ctrl + C] nesta janela a qualquer momento para encerrar a aplicação."
echo ""

# Mantém a janela ativa até o usuário encerrar
wait
