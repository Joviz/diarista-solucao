#!/usr/bin/env bash
set -euo pipefail
fail=0

echo "→ Procurando segredos (gitleaks)..."
gitleaks detect --no-banner --redact || fail=1

echo "→ Verificando se algum .env real está versionado..."
if git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.example$'; then
  echo "ERRO: arquivo .env versionado."; fail=1
fi

echo "→ Procurando segredos no bundle de produção (dist/)..."
if [ -d dist ]; then
  if grep -rEn "(sk_live_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |EC )?PRIVATE KEY|ghp_[A-Za-z0-9]{30,})" dist; then
    echo "ERRO: possível segredo no bundle."; fail=1
  fi
  if find dist -name "*.map" | grep -q .; then
    echo "ERRO: source maps publicados em produção."; fail=1
  fi
fi

echo "→ Procurando padrões perigosos no código..."
if grep -rEn "dangerouslySetInnerHTML|eval\(|new Function\(|\.innerHTML\s*=" src --include=*.ts --include=*.tsx \
   | grep -v "sanitize"; then
  echo "AVISO: uso de API perigosa sem sanitização. Revise."; fail=1
fi

[ "$fail" = "0" ] && echo "OK: nenhuma falha de segurança encontrada." || exit 1