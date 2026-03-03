#!/bin/bash
# Run this ONCE on the server to set up Node.js + PM2
# ssh cwprdgen-user@72.60.220.232 then run: bash server-setup.sh

set -e

echo "🔧 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "🔧 Installing PM2..."
sudo npm install -g pm2

echo "🔧 Setting PM2 to auto-start on reboot..."
pm2 startup | tail -1 | bash

echo "✅ Server setup complete!"
echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"
echo "PM2:  $(pm2 -v)"
