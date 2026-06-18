# VPS First-Time Setup (one-time)

Run these steps **once** on your VPS before the first CI deploy.

## 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# re-login
```

## 2. Create production `.env`

```bash
sudo mkdir -p /opt/senso-limitless/backend
sudo cp /opt/senso-limitless/backend/.env.production.template /opt/senso-limitless/backend/.env
sudo nano /opt/senso-limitless/backend/.env
```

Required changes:
- `JWT_SECRET` — long random string
- `CORS_ORIGIN` — your frontend URL (e.g. `https://yourdomain.com`)
- `ADMIN_WALLET_ADDRESSES` — admin wallet(s)

## 3. GitHub Secrets

In repo → Settings → Secrets → Actions:

| Secret | Example | Used by |
|--------|---------|---------|
| `VPS_HOST` | `123.45.67.89` | Frontend + Backend |
| `VPS_USER` | `root` | Frontend + Backend |
| `VPS_PASSWORD` | SSH password | Frontend + Backend |
| `NEXT_PUBLIC_API_URL` | `http://IP:4000` | Frontend build |
| `BACKEND_JWT_SECRET` | long random string | Backend `.env` |
| `FRONTEND_URL` | `https://yourdomain.com` | Backend CORS |

## 4. Push to `main`

```bash
git push origin main
```

This triggers:
- **Deploy to VPS** — frontend static site → `/var/www/lae`
- **Deploy Backend to VPS** — Docker api + worker + postgres + redis

## 5. Verify

```bash
curl http://YOUR_VPS:4000/health
# {"status":"ok",...}
```

## Manual redeploy

Actions → **Deploy Backend to VPS** → Run workflow
