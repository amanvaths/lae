#!/usr/bin/env bash
# One-time VPS bootstrap for LAE static site (run as root).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx rsync

mkdir -p /var/www/lae
chown -R www-data:www-data /var/www/lae

cat > /etc/nginx/sites-available/lae <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/lae;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ $uri/index.html /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/lae /etc/nginx/sites-enabled/lae

nginx -t
systemctl enable nginx
systemctl restart nginx

echo "Bootstrap complete. Site root: /var/www/lae"
