#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────
#  LAE Club — One-Click Production Deploy
# ──────────────────────────────────────────────────────
#  Usage:
#    ./deploy.sh              # Build & start all services
#    ./deploy.sh build        # Build only (no start)
#    ./deploy.sh up           # Start (assumes images built)
#    ./deploy.sh down         # Stop all
#    ./deploy.sh logs         # Tail logs
#    ./deploy.sh db:migrate   # Run Prisma migrations
#    ./deploy.sh status       # Service status
# ──────────────────────────────────────────────────────

COMPOSE="docker compose -f docker-compose.prod.yml"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[LAE]${NC} $1"; }
warn() { echo -e "${YELLOW}[LAE]${NC} $1"; }
err() { echo -e "${RED}[LAE]${NC} $1"; }

check_deps() {
    command -v docker >/dev/null 2>&1 || { err "Docker not found. Install: https://docs.docker.com/get-docker/"; exit 1; }
    docker compose version >/dev/null 2>&1 || { err "Docker Compose v2 not found."; exit 1; }
}

check_env() {
    if [ ! -f backend/.env.production ]; then
        err "backend/.env.production not found!"
        err "Copy backend/.env.production.example and fill in your values."
        exit 1
    fi
    if [ ! -f .env.production ]; then
        err ".env.production not found!"
        err "Copy .env.production.example and set NEXT_PUBLIC_API_URL to your domain."
        exit 1
    fi

    # Warn about default secrets
    if grep -q "CHANGE_ME" backend/.env.production 2>/dev/null; then
        warn "⚠ backend/.env.production contains default secrets — change JWT_SECRET, ADMIN_PASSWORD, INDEXER_ADMIN_API_KEY before going live!"
    fi
}

cmd_build() {
    log "Building all services..."
    $COMPOSE build --parallel
    log "Build complete!"
}

cmd_up() {
    log "Starting LAE Club (postgres → redis → backend → frontend → nginx)..."
    $COMPOSE up -d
    log "Waiting for services to be healthy..."
    sleep 5
    cmd_status

    log ""
    log "Running database migrations..."
    $COMPOSE exec backend npx prisma db push --skip-generate 2>/dev/null || \
        $COMPOSE exec backend npx prisma migrate deploy 2>/dev/null || \
        warn "Migration command not available — DB schema should be pushed manually"

    log ""
    log "╔══════════════════════════════════════════════╗"
    log "║     LAE Club deployed successfully! 🚀       ║"
    log "╠══════════════════════════════════════════════╣"
    log "║  Frontend:  http://YOUR_SERVER_IP            ║"
    log "║  API:       http://YOUR_SERVER_IP/api/       ║"
    log "║  Health:    http://YOUR_SERVER_IP/health      ║"
    log "╚══════════════════════════════════════════════╝"
}

cmd_down() {
    log "Stopping all services..."
    $COMPOSE down
    log "Stopped."
}

cmd_logs() {
    $COMPOSE logs -f --tail=100 "$@"
}

cmd_status() {
    $COMPOSE ps
    echo ""
    # Health check
    sleep 2
    if curl -sf http://localhost/health >/dev/null 2>&1; then
        log "✅ Health check: OK"
    elif curl -sf http://localhost:4000/health >/dev/null 2>&1; then
        log "✅ Backend health: OK (nginx may still be starting)"
    else
        warn "⏳ Services starting up..."
    fi
}

cmd_migrate() {
    log "Running Prisma migrations..."
    $COMPOSE exec backend npx prisma db push --skip-generate
    log "Migrations complete."
}

cmd_reset_indexer() {
    log "Resetting indexer..."
    $COMPOSE exec backend node --input-type=module -e "
import { resetIndexedMatrixData } from './dist/modules/blockchain/reset-indexed-data.js';
import { backfillLaeUserEventsFromChain } from './dist/modules/blockchain/receipt-sync.js';
import { backfillLaeUsersFromChain } from './dist/modules/blockchain/chain-backfill.js';
console.log(await resetIndexedMatrixData());
await backfillLaeUserEventsFromChain();
await backfillLaeUsersFromChain();
console.log('Indexer reset + re-synced.');
"
    log "Done."
}

# ─── Main ───
check_deps
check_env

case "${1:-deploy}" in
    build)      cmd_build ;;
    up|start)   cmd_up ;;
    down|stop)  cmd_down ;;
    logs)       shift; cmd_logs "$@" ;;
    status|ps)  cmd_status ;;
    db:migrate|migrate) cmd_migrate ;;
    reset-indexer) cmd_reset_indexer ;;
    deploy|"")  cmd_build; cmd_up ;;
    *)          err "Unknown command: $1"; echo "Usage: $0 {build|up|down|logs|status|migrate|reset-indexer}"; exit 1 ;;
esac
