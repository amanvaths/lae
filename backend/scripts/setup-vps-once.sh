#!/usr/bin/env bash
# One-time VPS bootstrap — Node 22, PM2 startup, deploy directory.
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/lae-backend}"

echo "==> Creating deploy directory ${DEPLOY_ROOT}"
sudo mkdir -p "${DEPLOY_ROOT}/backend"
sudo chown -R "${USER}:${USER}" "${DEPLOY_ROOT}"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Install PM2: npm install -g pm2"
  exit 1
fi

echo "==> PM2 startup (run printed command as root if first time)"
pm2 startup systemd -u "${USER}" --hp "${HOME}" || true
pm2 save || true

echo "==> Bootstrap complete. Next: set GitHub Secrets and run Deploy Backend to VPS workflow."
