# PlanCraft — Server Deploy

## ⚠️ Nginx / Apache — Proxy to Node

If static files (fonts, CSS, JS) return **500**, your web server may be serving them directly instead of proxying to Node. **Proxy ALL requests** to Node on port 3000.

See `nginx.conf.example` for the correct Nginx config. Key: `location /` must proxy to `http://127.0.0.1:3000` — do NOT serve `/_next/static/*` from disk.

**Quick test on server:** `curl -I http://localhost:3000/_next/static/chunks/` — if this returns 200, Node is fine; the issue is the reverse proxy.

---

## After `git push` — Run on VPS

```bash
# 1. SSH to your server
ssh user@your-server-ip

# 2. Go to project folder
cd /path/to/PlanCraft

# 3. Pull latest
git pull origin master

# 4. Install & build
npm ci
npm run build

# 5. Restart PM2
pm2 restart plancraft --update-env
# OR if first time:
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # follow instructions to enable on reboot
```

## One-liner (if deploy.sh exists)

```bash
chmod +x deploy.sh
./deploy.sh
```

## Env vars on server

Ensure `.env.local` has:
- `OPENAI_API_KEY=sk-...`
