#!/bin/bash
# =============================================================================
# kensgames.com — Full VPS Provisioning Script
# Schwarz Diamond Point Collapse Deployment
#
# Usage:  sudo bash provision-kensgames.sh
#
# This script:
#   1. Installs Node.js 20.x (if missing)
#   2. Installs nginx + certbot (if missing)
#   3. Deploys the Schwarz Diamond artifact
#   4. Creates systemd service (auto-restart)
#   5. Configures nginx reverse proxy
#   6. Obtains SSL certificate via Let's Encrypt
#   7. Starts everything
# =============================================================================

set -euo pipefail

DOMAIN="kensgames.com"
APP_DIR="/var/www/kensgames"
ARTIFACT="schwarz-diamond.point.js"
SERVICE_NAME="kensgames"
APP_PORT=3000
APP_USER="www-data"
DEPLOY_TS=$(date +%Y%m%d-%H%M%S)

echo ""
echo "================================================"
echo "  Schwarz Diamond — VPS Provisioning"
echo "  Target: ${DOMAIN}"
echo "  Timestamp: ${DEPLOY_TS}"
echo "================================================"
echo ""

# Must be root
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Run as root:  sudo bash provision-kensgames.sh"
    exit 1
fi

# ─── 1. Node.js ─────────────────────────────────────────────────────────────
echo "[1/7] Checking Node.js..."
if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    echo "  ✅ Node.js ${NODE_VER} already installed"
else
    echo "  Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  ✅ Node.js $(node --version) installed"
fi

# ─── 2. Nginx ───────────────────────────────────────────────────────────────
echo "[2/7] Checking nginx..."
if command -v nginx &>/dev/null; then
    echo "  ✅ nginx already installed"
else
    echo "  Installing nginx..."
    apt-get update -qq
    apt-get install -y nginx
    echo "  ✅ nginx installed"
fi

# ─── 3. Certbot ─────────────────────────────────────────────────────────────
echo "[3/7] Checking certbot..."
if command -v certbot &>/dev/null; then
    echo "  ✅ certbot already installed"
else
    echo "  Installing certbot..."
    apt-get install -y certbot python3-certbot-nginx
    echo "  ✅ certbot installed"
fi

# ─── 4. Deploy artifact ─────────────────────────────────────────────────────
echo "[4/7] Deploying artifact..."
mkdir -p "${APP_DIR}"

# Back up existing artifact if present
if [ -f "${APP_DIR}/${ARTIFACT}" ]; then
    cp "${APP_DIR}/${ARTIFACT}" "${APP_DIR}/${ARTIFACT}.bak-${DEPLOY_TS}"
    echo "  Backed up previous artifact"
fi

# The artifact should be in the same directory as this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/${ARTIFACT}" ]; then
    cp "${SCRIPT_DIR}/${ARTIFACT}" "${APP_DIR}/${ARTIFACT}"
    echo "  ✅ Artifact deployed: $(stat -c%s "${APP_DIR}/${ARTIFACT}") bytes"
else
    echo "  ERROR: ${ARTIFACT} not found next to this script at ${SCRIPT_DIR}"
    echo "  Place schwarz-diamond.point.js in the same directory and re-run."
    exit 1
fi

chown -R ${APP_USER}:${APP_USER} "${APP_DIR}"

# ─── 5. Systemd service ─────────────────────────────────────────────────────
echo "[5/7] Creating systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Schwarz Diamond — kensgames.com
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${APP_PORT}
Environment=NODE_ENV=production
ExecStart=$(which node) ${APP_DIR}/${ARTIFACT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}
sleep 2

if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo "  ✅ Service running"
else
    echo "  ❌ Service failed to start. Check: journalctl -u ${SERVICE_NAME} -n 30"
    systemctl status ${SERVICE_NAME} --no-pager || true
    exit 1
fi

# ─── 6. Nginx config ────────────────────────────────────────────────────────
echo "[6/7] Configuring nginx..."

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/${DOMAIN}.conf << 'NGINX_CONF'
# kensgames.com — Schwarz Diamond reverse proxy
# HTTP only initially — certbot will add SSL block

server {
    listen 80;
    listen [::]:80;
    server_name kensgames.com www.kensgames.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|mp3|ogg|wav|glb|gltf)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/${DOMAIN}.conf /etc/nginx/sites-enabled/
mkdir -p /var/www/certbot

# Test and reload
if nginx -t 2>&1; then
    systemctl reload nginx
    echo "  ✅ nginx configured and reloaded"
else
    echo "  ❌ nginx config test failed"
    nginx -t
    exit 1
fi

# ─── 7. SSL via Let's Encrypt ───────────────────────────────────────────────
echo "[7/7] Setting up SSL..."

# Check if cert already exists
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "  ✅ SSL certificate already exists"
    # Just make sure nginx has the SSL config
    certbot install --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --redirect 2>/dev/null || true
else
    echo "  Requesting certificate from Let's Encrypt..."
    echo "  (Domain must point to this server's IP for this to work)"
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
        --non-interactive --agree-tos \
        --email admin@${DOMAIN} \
        --redirect \
        || {
            echo ""
            echo "  ⚠️  certbot failed — this is normal if DNS isn't pointing here yet."
            echo "  The HTTP site is still working. Run this later to add SSL:"
            echo "    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
            echo ""
        }
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  ✅ Deployment Complete"
echo "================================================"
echo ""
echo "  🎮 Game:    http://${DOMAIN}/fasttrack/board_3d.html"
echo "  🏠 Home:    http://${DOMAIN}/"
echo ""
echo "  📋 Service: systemctl status ${SERVICE_NAME}"
echo "  📋 Logs:    journalctl -u ${SERVICE_NAME} -f"
echo "  📋 Nginx:   tail -f /var/log/nginx/access.log"
echo ""
echo "  🔄 Redeploy: Replace ${APP_DIR}/${ARTIFACT}"
echo "               then: systemctl restart ${SERVICE_NAME}"
echo ""
echo "  Timestamp: ${DEPLOY_TS}"
echo "================================================"

