#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Iniciando Local AI Gateway Corporativo (:8766) ==="
cd "$ROOT_DIR"

if ! command -v python3 &> /dev/null; then
    echo "ERRO: python3 não encontrado no sistema."
    exit 1
fi

export PYTHONPATH="$ROOT_DIR"
python3 -u gateway/local_ai_gateway.py
