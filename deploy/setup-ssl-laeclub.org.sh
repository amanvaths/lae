#!/usr/bin/env bash
# Run on VPS as root once DNS for laeclub.org + api.laeclub.org points here.
set -euo pipefail

DOMAIN=laeclub.org
API_DOMAIN=api.laeclub.org

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "${API_DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  --redirect

nginx -t
systemctl reload nginx

echo "SSL enabled for ${DOMAIN}, www.${DOMAIN}, ${API_DOMAIN}"
