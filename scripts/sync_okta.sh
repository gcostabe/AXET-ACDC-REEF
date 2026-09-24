#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Sincronizando Token Okta e Identidade AXET ==="
cd "$ROOT_DIR"

if ! command -v python3 &> /dev/null; then
    echo "ERRO: python3 não encontrado no sistema."
    exit 1
fi

export PYTHONPATH="$ROOT_DIR"
python3 -u gateway/sync_okta_identity.py
