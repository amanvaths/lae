#!/usr/bin/env bash
# Fail fast when required production env vars are missing.
set -euo pipefail

ENV_FILE="${1:-.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

REQUIRED=(
  NODE_ENV
  PORT
  HOST
  DATABASE_URL
  BSC_RPC_URL
  CHAIN_ID
  SENSO_CONTRACT_ADDRESS
  SLT_CONTRACT_ADDRESS
  SPIN_CONTRACT_ADDRESS
  STAKING_CONTRACT_ADDRESS
  DAI_CONTRACT_ADDRESS
  INDEXER_ADMIN_API_KEY
  JWT_SECRET
  CORS_ORIGIN
)

missing=()
for key in "${REQUIRED[@]}"; do
  val="${!key:-}"
  if [[ -z "${val}" ]]; then
    missing+=("${key}")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "Production env check passed (${#REQUIRED[@]} required vars present)"
