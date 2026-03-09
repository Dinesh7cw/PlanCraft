# PlanCraft — Server Deploy

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
