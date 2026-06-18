#!/usr/bin/env bash
# Post-deploy smoke checks — run on VPS or from CI against BACKEND_PUBLIC_URL.
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:4000}"
BASE_URL="${BASE_URL%/}"

echo "==> Verifying ${BASE_URL}"

health="$(curl -sf "${BASE_URL}/health")"
echo "GET /health OK"
echo "${health}" | grep -q '"status":"ok"' || {
  echo "ERROR: /health body missing status ok"
  exit 1
}

status="$(curl -sf "${BASE_URL}/api/indexer/status")"
echo "GET /api/indexer/status OK"
echo "${status}" | grep -q '"mode":"indexer-only"' || {
  echo "ERROR: indexer status unexpected"
  exit 1
}

echo "==> All deployment checks passed"
