# VPS Production — GitHub Secrets Checklist

Set every secret in **GitHub → Repository → Settings → Secrets and variables → Actions**.

---

## VPS SSH

**VPS_HOST**  
VPS public IP or hostname  
Example Value: `203.0.113.10`

**VPS_USER**  
SSH login user on the VPS  
Example Value: `root`

**VPS_PASSWORD**  
SSH password (use if not using key-based auth)  
Example Value: `your-secure-password`

**VPS_SSH_KEY**  
Private SSH key (PEM). Use instead of password when key auth is enabled  
Example Value: `-----BEGIN OPENSSH PRIVATE KEY-----…`

---

## Frontend (Deploy to VPS workflow)

**NEXT_PUBLIC_API_URL**  
Public URL of the backend API (must be reachable from browsers)  
Example Value: `https://api.laeclub.com`

**NEXT_PUBLIC_WC_PROJECT_ID**  
WalletConnect Cloud project ID — **required for WalletConnect on mobile browsers**. MetaMask/Trust deep links work without it; get a free id at [cloud.walletconnect.com](https://cloud.walletconnect.com).  
Example Value: `a1b2c3d4e5f6789012345678901234ab`

**NEXT_PUBLIC_CHAIN_ID**  
BSC Testnet chain ID  
Example Value: `97`

**NEXT_PUBLIC_SENSO_CONTRACT**  
LAELimitless (core matrix) contract address  
Example Value: `0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5`

**NEXT_PUBLIC_DAI_CONTRACT**  
MockDAI contract address  
Example Value: `0xf8E556996042b34cc706F040c59955abB678995e`

**NEXT_PUBLIC_SLT_CONTRACT**  
LAEToken contract address (env key kept for compatibility)  
Example Value: `0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146`

**NEXT_PUBLIC_SPIN_CONTRACT**  
LAESpin contract address  
Example Value: `0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D`

**NEXT_PUBLIC_STAKING_CONTRACT**  
LAEStaking contract address  
Example Value: `0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8`

---

## Backend (Deploy Backend to VPS workflow)

**BACKEND_PUBLIC_URL**  
Public URL used for post-deploy health checks from GitHub Actions  
Example Value: `https://api.laeclub.com`

**DATABASE_URL**  
PostgreSQL connection string on VPS  
Example Value: `postgresql://lae:STRONG_PASSWORD@127.0.0.1:5432/lae_analytics?schema=public`

**BSC_RPC_URL**  
BSC Testnet JSON-RPC endpoint  
Example Value: `https://data-seed-prebsc-1-s1.binance.org:8545`

**CHAIN_ID**  
Blockchain chain ID  
Example Value: `97`

**INDEXER_START_BLOCK**  
Block number to start indexing from (0 = from deployment)  
Example Value: `0`

**INDEXER_ADMIN_API_KEY**  
Secret for `POST /api/indexer/replay` (header `X-API-Key`)  
Example Value: `64-char-random-hex-string`

**JWT_SECRET**  
JWT signing secret (admin JWT auth on replay endpoint)  
Example Value: `64-char-random-hex-string`

**CORS_ORIGIN**  
Allowed frontend origin for API CORS  
Example Value: `https://laeclub.com`

**SENSO_CONTRACT_ADDRESS**  
LAELimitless contract (env key kept for compatibility)  
Example Value: `0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5`

**SLT_CONTRACT_ADDRESS**  
LAEToken contract (env key kept for compatibility)  
Example Value: `0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146`

**SPIN_CONTRACT_ADDRESS**  
LAESpin contract  
Example Value: `0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D`

**STAKING_CONTRACT_ADDRESS**  
LAEStaking contract  
Example Value: `0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8`

**DAI_CONTRACT_ADDRESS**  
MockDAI contract  
Example Value: `0xf8E556996042b34cc706F040c59955abB678995e`

**ADMIN_WALLET_ADDRESSES**  
Comma-separated admin wallets (optional; for wallet-signature replay auth)  
Example Value: `0xYourAdminWallet1,0xYourAdminWallet2`

---

## One-time VPS setup

```bash
# Node 22 + PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx
sudo npm install -g pm2
sudo pm2 startup systemd -u $USER --hp $HOME

# PostgreSQL
sudo -u postgres createuser -P lae
sudo -u postgres createdb -O lae lae_analytics

# Nginx: serve /var/www/lae (frontend) + reverse proxy /api → :4000
pm2 save
```

Backend deploy path: `/opt/lae-backend/backend`  
Frontend deploy path: `/var/www/lae`
