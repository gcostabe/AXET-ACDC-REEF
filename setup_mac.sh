#!/usr/bin/env bash
# ==============================================================================
# 🍏 ACDC - Cockpit de Precificação & Regras Atuariais (NTT DATA / MAPFRE)
# Script de Configuração Inicial One-Click para macOS
# ==============================================================================

set -e

# Posiciona no diretório raiz do repositório
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo ""
echo "================================================================================"
echo "🍏 ACDC - Configuração Inicial One-Click (macOS)"
echo "   NTT DATA / MAPFRE Insurance Technology"
echo "================================================================================"
echo "Diretório do projeto: $REPO_DIR"
echo ""

# 1. Verificação do Node.js
echo "🔍 [1/6] Verificando ambiente Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "  ✓ Node.js detectado: $NODE_VER"
else
    echo "  ⚠️ Node.js não encontrado no PATH."
    if command -v brew >/dev/null 2>&1; then
        echo "  Instalando Node.js via Homebrew..."
        brew install node
    else
        echo "  ❌ Instale o Node.js v20+ em https://nodejs.org/ antes de continuar."
        exit 1
    fi
fi

# 2. Verificação do Python 3
echo "🔍 [2/6] Verificando ambiente Python 3..."
if command -v python3 >/dev/null 2>&1; then
    PY_VER=$(python3 --version 2>&1)
    echo "  ✓ Python detectado: $PY_VER"
else
    echo "  ⚠️ Python 3 não encontrado."
    if command -v brew >/dev/null 2>&1; then
        echo "  Instalando Python via Homebrew..."
        brew install python
    else
        echo "  ❌ Instale o Python 3.11+ em https://www.python.org/ antes de continuar."
        exit 1
    fi
fi

# 3. Verificação do Docker
echo "🔍 [3/6] Verificando Docker..."
if command -v docker >/dev/null 2>&1; then
    echo "  ✓ Docker detectado: $(docker --version)"
    if docker info >/dev/null 2>&1; then
        echo "  ✓ Docker daemon está em execução."
    else
        echo "  ⚠️ Docker Desktop não está rodando. O MongoDB local precisará que o Docker esteja ativo."
    fi
else
    echo "  ⚠️ Docker não detectado. Você poderá utilizar uma instância remota de MongoDB pela interface de Administração."
fi

# 4. Concessão de permissões de execução nos scripts
echo "🔧 [4/6] Configurando permissões de execução nos scripts..."
chmod +x "$REPO_DIR"/setup_mac.sh 2>/dev/null || true
chmod +x "$REPO_DIR"/iniciar_mac.command 2>/dev/null || true
chmod +x "$REPO_DIR"/scripts/*.sh 2>/dev/null || true
echo "  ✓ Permissões atribuídas."

# 5. Instalação de dependências npm
echo "📦 [5/6] Instalando dependências npm (Backend e Frontend)..."
echo "  Instalando dependências do Servidor Backend..."
(cd "$REPO_DIR/server" && npm install --silent)
echo "  ✓ Backend pronto."

echo "  Instalando dependências do Frontend Web..."
(cd "$REPO_DIR/client" && npm install --silent)
echo "  ✓ Frontend pronto."

# 6. Sincronização de credenciais e tokens do Okta (AXET)
echo "🔑 [6/6] Verificando credenciais do Gateway de IA & Okta..."
if [ -f "$REPO_DIR/scripts/sync_okta.sh" ]; then
    bash "$REPO_DIR/scripts/sync_okta.sh" || {
        echo "  ⚠️ Não foi possível sincronizar o AXET CLI agora. O template tokens.example.json foi copiado."
    }
fi

# 7. Criação do atalho na Mesa (Desktop)
echo ""
DESKTOP_DIR="$HOME/Desktop"
SHORTCUT_PATH="$DESKTOP_DIR/Iniciar Cockpit NTT DATA.command"

if [ -d "$DESKTOP_DIR" ]; then
    echo "🖥️ Criando atalho na Mesa (Desktop): $SHORTCUT_PATH"
    cat <<EOF > "$SHORTCUT_PATH"
#!/usr/bin/env bash
# Atalho de Inicialização do ACDC - NTT DATA
cd "$REPO_DIR"
exec ./iniciar_mac.command
EOF
    chmod +x "$SHORTCUT_PATH"
    echo "  ✓ Atalho 'Iniciar Cockpit NTT DATA.command' criado na Mesa com sucesso!"
fi

echo ""
echo "================================================================================"
echo "🎉 Instalação Concluída com Sucesso!"
echo "================================================================================"
echo "Para o uso diário, você pode:"
echo "  1. Dar duplo clique no atalho 'Iniciar Cockpit NTT DATA.command' na sua Mesa (Desktop)."
echo "  OU"
echo "  2. Executar no terminal: ./iniciar_mac.command"
echo ""
echo "A aplicação iniciará todos os módulos e abrirá seu navegador em http://localhost:5173/"
echo "================================================================================"
