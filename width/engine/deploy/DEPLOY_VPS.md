# Schwarz Diamond — VPS Deployment Guide

> **For: VPS AI / automated deploy agents**
> **Architecture:** Single-file Node.js artifact (no Docker, no build tools on server)
> **Principle:** `z = xy` — everything collapses to one point.

---

## Target Environment

| Property | Value |
|---|---|
| **VPS IP** | `100.70.142.122` |
| **SSH User** | `butterfly` |
| **SSH Port** | `22` |
| **Remote Path** | `/opt/schwarz-diamond/` |
| **Artifact** | `schwarz-diamond.point.js` |
| **Node Port** | `3000` |
| **Domain** | `kensgames.com` (when DNS is configured) |
| **OS** | Ubuntu LTS |

---

## Prerequisites (VPS)

```bash
# Node.js must be installed on the VPS
node --version   # must be v18+ (LTS)
# If missing:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

No other dependencies. No npm install, no Docker, no Python. The artifact is fully self-contained.

---

## Step 1: Build the Artifact (on dev machine)

```bash
cd /path/to/butterfly_platform
node width/engine/deploy/build.js
```

**Output:** `width/engine/deploy/artifacts/schwarz-diamond.point.js` (~8 MB)

The build script:
1. Reads engine modules from `width/engine/`
2. Ingests all games from `games/` (BrickBreaker3D, FastTrack, etc.)
3. Ingests shared libraries from `width/lib/` (Three.js, jQuery, Bootstrap, fonts)
4. Collapses everything into a single IIFE with an embedded HTTP server

**Verify build output:**
```
  POINT COLLAPSE CLEAN -- all dimensions present
```

If you see `SKIP` or errors, a source file is missing.

---

## Step 2: Transfer to VPS

```bash
scp -o StrictHostKeyChecking=no \
  width/engine/deploy/artifacts/schwarz-diamond.point.js \
  butterfly@100.70.142.122:/opt/schwarz-diamond/schwarz-diamond.point.js
```

Or use the PowerShell deploy script (does build + transfer + systemd in one step):
```powershell
.\width\engine\deploy\deploy.ps1
# Options: -DryRun, -SkipBuild, -Target "IP", -User "user"
```

---

## Step 3: Start / Restart the Service

### Option A: systemd (recommended — auto-restarts on crash/reboot)

```bash
# Create the service (one-time setup)
sudo tee /etc/systemd/system/schwarz-diamond.service << 'EOF'
[Unit]
Description=Schwarz Diamond Point (manifold server)
After=network.target

[Service]
Type=simple
User=butterfly
WorkingDirectory=/opt/schwarz-diamond
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/schwarz-diamond/schwarz-diamond.point.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable schwarz-diamond
sudo systemctl restart schwarz-diamond
```

**After each redeploy, just run:**
```bash
sudo systemctl restart schwarz-diamond
```

**Check status:**
```bash
sudo systemctl status schwarz-diamond
journalctl -u schwarz-diamond -f          # live logs
journalctl -u schwarz-diamond --since "5 min ago"  # recent logs
```

```bash
sudo tee /etc/nginx/sites-available/kensgames.com << 'EOF'
server {
    listen 80;
    server_name kensgames.com www.kensgames.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/kensgames.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# SSL (after DNS A records point to 100.70.142.122)
sudo certbot --nginx -d kensgames.com -d www.kensgames.com --non-interactive --agree-tos -m ken.bingham64@gmail.com
```

---

## Quick Reference — Full Redeploy (copy-paste)

**From dev machine:**
```bash
node width/engine/deploy/build.js && \
scp -o StrictHostKeyChecking=no \
  width/engine/deploy/artifacts/schwarz-diamond.point.js \
  butterfly@100.70.142.122:/opt/schwarz-diamond/schwarz-diamond.point.js
```

**Then on VPS:**
```bash
sudo systemctl restart schwarz-diamond
```

---

## Apps on the Manifold

| App | URL Path | Notes |
|---|---|---|
| BrickBreaker3D | `/brickbreaker3d/` | Fully client-side, perpetual motion physics |
| FastTrack | `/fasttrack/` | Lobby → AI Setup → Board. Offline vs Bots works. Multiplayer requires WebSocket server (not in Point). |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE` | Another process on port 3000. Run `sudo lsof -i :3000` and kill it, or `sudo systemctl stop schwarz-diamond` first. |
| Browser shows old version | Hard refresh: **Ctrl+Shift+R**. Browser caches aggressively. |
| `Not on the surface` (404) | The requested file isn't in the artifact. Rebuild with `node width/engine/deploy/build.js`. |
| Service won't start | Check `journalctl -u schwarz-diamond -f` for Node.js errors. |
| CSS/JS not loading | Check browser dev tools Network tab. Lib paths must resolve through the manifold router. |
| `Cannot find module` | Node.js version too old. Must be v18+. |

---

## Architecture Notes

- **One file ships.** `schwarz-diamond.point.js` contains the engine, all games, all libraries, and the HTTP server.
- **No source code on the VPS.** Only the collapsed artifact. No `node_modules`, no `package.json`.
- **No build tools on the VPS.** Building happens on the dev machine. The VPS only needs `node`.
- **Adding a new game:** Put files in `games/<name>/` on the dev machine, rebuild, redeploy. The build script auto-discovers game directories.

### Option B: Manual (quick testing)

```bash
pkill -f schwarz-diamond.point.js
cd /opt/schwarz-diamond && PORT=3000 node schwarz-diamond.point.js
```

---

## Step 4: Verify

```bash
curl -s http://127.0.0.1:3000/ | head -5
# Should return HTML with "Schwarz Diamond Point"

curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/brickbreaker3d/
# Should return 200

curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/fasttrack/
# Should return 200
```

---

## Step 5: Nginx + SSL (for kensgames.com)

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

