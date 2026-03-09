#!/bin/bash
# PlanCraft — Server deploy script (run on VPS after git pull)
set -e

echo "=== PlanCraft Deploy ==="

# Pull latest
git pull origin master

# Install deps
npm ci

# Build
npm run build

# Restart PM2 (use ecosystem if exists)
if [ -f ecosystem.config.cjs ]; then
  pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
else
  pm2 restart plancraft --update-env || pm2 start npm --name plancraft -- start
fi

echo "=== Done. App running on PM2 ==="
pm2 status
