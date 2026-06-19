#!/usr/bin/env bash
# Runs on VPS after CI uploads backend tarball. PM2 + Prisma migrate deploy.
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/lae-backend}"
BACKEND_DIR="${DEPLOY_ROOT}/backend"
APP_NAME="lae-analytics-api"
PORT="${PORT:-4000}"

echo "==> LAE Analytics API deploy (PM2)"
echo "    Directory: ${BACKEND_DIR}"

if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
  echo "ERROR: ${BACKEND_DIR}/.env missing — CI must write it before deploy."
  exit 1
fi

cd "${BACKEND_DIR}"

chmod +x scripts/check-production-env.sh
bash scripts/check-production-env.sh .env

echo "==> Installing dependencies..."
npm ci

echo "==> Prisma generate..."
npx prisma generate

echo "==> TypeScript build..."
npm run build

echo "==> Running migrations..."
npx prisma migrate deploy

echo "==> PM2 restart..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 not installed. Run: npm install -g pm2"
  exit 1
fi

if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --only "${APP_NAME}" --update-env
else
  pm2 start ecosystem.config.cjs --only "${APP_NAME}"
fi

pm2 save

echo "==> Waiting for API..."
for i in 1 2 3 4 5; do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
    break
  fi
  echo "    health not ready yet (${i}/5)…"
  sleep 3
done

echo "==> Health checks (local)..."
curl -sf "http://127.0.0.1:${PORT}/health" | head -c 500
echo ""
curl -sf "http://127.0.0.1:${PORT}/api/indexer/status" | head -c 500
echo ""

echo "==> PM2 status"
pm2 status "${APP_NAME}"

echo "==> Deploy complete"
