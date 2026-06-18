# VPS deploy — kyun fail ho raha hai?

## Do alag cheezein hain (confusion yahi hai)

| Workflow | Kya hota hai | URL |
|----------|--------------|-----|
| **Deploy to GitHub Pages** | Static site GitHub par | `https://amanvaths.github.io/lae/` |
| **Deploy to VPS** | Tumhara asli server (nginx) | Tumhara domain / VPS IP |

**GitHub Pages SUCCESS matlab VPS live nahi.** Backend bhi alag workflow hai: **Deploy Backend to VPS**.

---

## Tumhara VPS deploy 8 second mein fail — reason

Step 1 **"Verify required GitHub Secrets"** par exit code 1.

Matlab ye secrets GitHub repo mein **set nahi hain**:

```
VPS_HOST
VPS_USER
NEXT_PUBLIC_API_URL
VPS_PASSWORD   (ya VPS_SSH_KEY)
```

### Fix (5 minute)

1. GitHub → repo **amanvaths/lae** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** — ye minimum add karo:

| Secret | Example |
|--------|---------|
| `VPS_HOST` | VPS IP, e.g. `203.0.113.10` |
| `VPS_USER` | `root` |
| `VPS_PASSWORD` | SSH password **OR** use `VPS_SSH_KEY` instead |
| `VPS_SSH_KEY` | Private key (optional if password use kar rahe ho) |
| `NEXT_PUBLIC_API_URL` | `http://YOUR_VPS_IP:4000` ya `https://api.laeclub.com` |

3. **Actions** tab → **Deploy to VPS** → **Re-run all jobs**

---

## Backend bhi chahiye (indexer + API)

Frontend ke alawa **Deploy Backend to VPS** workflow chalao — uske liye aur secrets:

```
DATABASE_URL
BSC_RPC_URL
INDEXER_ADMIN_API_KEY
JWT_SECRET
CORS_ORIGIN
BACKEND_PUBLIC_URL
```

Full list: `docs/VPS_PRODUCTION_SECRETS.md`

VPS par pehle: Node 22, PM2, PostgreSQL, nginx.

---

## Abhi kya "live" hai?

- **Haan (partial):** GitHub Pages → https://amanvaths.github.io/lae/
- **Nahi:** VPS frontend (workflow fail)
- **Nahi:** Backend API / indexer (secrets + PM2 setup pending)

Secrets add karo, phir dono workflows re-run karo.
