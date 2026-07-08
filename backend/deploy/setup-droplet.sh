#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 DigitalOcean droplet — run this ONCE, manually,
# after SSH access is confirmed working. GitHub Actions never runs this file; it only runs
# `git pull` + `npm install` + `pm2 reload` on subsequent deploys (see deploy-backend.yml).
#
# Run as root: bash setup-droplet.sh
set -euo pipefail

REPO_URL="https://github.com/Pritom2357/articulate-ai.git"
APP_DIR="/var/www/articulate-ai"
BRANCH="main"

echo "==> Updating system packages"
apt-get update -y
apt-get upgrade -y

echo "==> Installing Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx ffmpeg

echo "==> Installing PM2 (process manager) globally"
npm install -g pm2

echo "==> Cloning repository"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  echo "Repo already exists at $APP_DIR, skipping clone."
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

echo "==> Installing backend dependencies"
cd "$APP_DIR/backend"
npm install --omit=dev

echo ""
echo "=========================================================================="
echo " MANUAL STEP REQUIRED: create the .env file before starting the app"
echo "   nano $APP_DIR/backend/src/.env"
echo "   (copy every value from your local backend/src/.env — DATABASE_URL,"
echo "    JWT secrets, AZURE_SPEECH_KEY, OPENAI_API_KEY, CLOUDINARY_*, etc.)"
echo "=========================================================================="
echo ""
read -p "Press Enter once backend/src/.env has been created and saved..."

echo "==> Starting the app with PM2"
cd "$APP_DIR/backend"
pm2 start src/index.js --name articulate-ai-backend
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

echo "==> Configuring Nginx reverse proxy (HTTP only — no domain/SSL yet)"
cat > /etc/nginx/sites-available/articulate-ai <<'NGINX_EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/articulate-ai /etc/nginx/sites-enabled/articulate-ai
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "==> Opening firewall for HTTP/HTTPS/SSH (if ufw is active)"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true

echo ""
echo "=========================================================================="
echo " DONE. Backend should now be reachable at: http://$(curl -s ifconfig.me)"
echo " Once you point a domain at this droplet, run:"
echo "   apt-get install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d yourdomain.com"
echo " to add free HTTPS via Let's Encrypt."
echo "=========================================================================="
