#!/usr/bin/env bash
# Checks DNS every 15 min (via cron). When laeclub.com points here, issues SSL
# with certbot, then removes its own cron entry.
set -euo pipefail

DOMAIN="laeclub.com"
EXPECTED_IP="168.144.23.172"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
CRON_MARKER="lae-ssl-watchdog"
LOG="/var/log/lae-ssl-watchdog.log"
LOCK="/var/run/lae-ssl-watchdog.lock"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-support@lae.finance}"

log() {
  echo "$(date -Is) $*" >>"$LOG"
}

remove_cron() {
  if crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab - 2>/dev/null || true
    log "Cron removed — SSL watchdog finished."
  fi
}

resolve_ipv4() {
  local host=$1
  local ip cname

  ip=$(dig +short "$host" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)
  if [ -n "$ip" ]; then
    echo "$ip"
    return 0
  fi

  cname=$(dig +short "$host" CNAME 2>/dev/null | sed 's/\.$//' | head -1 || true)
  if [ -n "$cname" ]; then
    ip=$(dig +short "$cname" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)
    if [ -n "$ip" ]; then
      echo "$ip"
      return 0
    fi
  fi

  return 1
}

dns_points_here() {
  local host=$1
  local ip

  ip=$(resolve_ipv4 "$host" || true)
  [ "$ip" = "$EXPECTED_IP" ]
}

ensure_nginx_domain() {
  if grep -q "server_name ${DOMAIN}" /etc/nginx/sites-available/lae 2>/dev/null; then
    return 0
  fi

  cat > /etc/nginx/sites-available/lae <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} _;

    root /var/www/lae;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ \$uri/index.html /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX

  nginx -t
  systemctl reload nginx
  log "Updated nginx server_name for ${DOMAIN}."
}

issue_ssl() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx dnsutils

  ensure_nginx_domain

  certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    --redirect \
    --no-eff-email

  nginx -t
  systemctl reload nginx
}

main() {
  exec 9>"$LOCK"
  if ! flock -n 9; then
    exit 0
  fi

  if [ -f "$CERT_PATH" ]; then
    log "SSL certificate already present."
    remove_cron
    exit 0
  fi

  if ! dns_points_here "$DOMAIN"; then
    ip=$(resolve_ipv4 "$DOMAIN" 2>/dev/null || echo "none")
    log "DNS not ready: ${DOMAIN} -> ${ip} (expected ${EXPECTED_IP})"
    exit 0
  fi

  log "DNS OK for ${DOMAIN}. Requesting SSL certificate..."
  if issue_ssl; then
    log "SSL issued successfully for ${DOMAIN}."
    remove_cron
  else
    log "certbot failed — will retry on next cron run."
    exit 1
  fi
}

main "$@"
