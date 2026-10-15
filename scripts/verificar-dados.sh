#!/usr/bin/env bash
# Bloqueia o deploy se algum arquivo com cara de dado, segredo ou identidade pessoal estiver no repositório.
set -euo pipefail

suspeitos=$(git ls-files | grep -E '(^|/)(\.env($|\.)|exports/|backups/|assets/|logo[_-]|chaves\.json$|estado-.*\.json$)|\.zip$' | grep -v '\.env\.example$' || true)

if [ -n "$suspeitos" ]; then
  echo "Arquivos que não podem estar no repositório público:"
  echo "$suspeitos"
  exit 1
fi
echo "Nenhum arquivo de dados ou segredo encontrado."
