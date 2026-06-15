#!/usr/bin/env bash
# Install SSL watchdog cron on the VPS (run once as root).
set -euo pipefail

SCRIPT_SRC="${1:-$(cd "$(dirname "$0")" && pwd)/ssl-watchdog.sh}"
INSTALL_PATH="/usr/local/bin/lae-ssl-watchdog.sh"
CRON_LINE="*/15 * * * * ${INSTALL_PATH} # lae-ssl-watchdog"

install -m 755 "$SCRIPT_SRC" "$INSTALL_PATH"
touch /var/log/lae-ssl-watchdog.log

if crontab -l 2>/dev/null | grep -q "lae-ssl-watchdog"; then
  echo "Cron already installed."
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Cron installed: every 15 minutes."
fi

echo "Watchdog script: $INSTALL_PATH"
echo "Log: /var/log/lae-ssl-watchdog.log"
echo "Run now: $INSTALL_PATH"
