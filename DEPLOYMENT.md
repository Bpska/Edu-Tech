# 🚀 Nexus Academy — VPS Deployment Guide
> **Method: Direct SSH from Terminal (No Git)**
> **Stack:** React + Vite · Node.js + Express + Prisma · PostgreSQL · Nginx · Docker Compose
> **VPS IP:** `72.61.169.195`

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [VPS Requirements](#vps-requirements)
3. [Step 1 — Fix SSH Access to VPS](#step-1--fix-ssh-access-to-vps)
4. [Step 2 — Initial Server Setup](#step-2--initial-server-setup)
5. [Step 3 — Install Docker & Docker Compose](#step-3--install-docker--docker-compose)
6. [Step 4 — Configure Firewall](#step-4--configure-firewall)
7. [Step 5 — Upload Project from Local Terminal](#step-5--upload-project-from-local-terminal)
8. [Step 6 — Configure Environment Variables on VPS](#step-6--configure-environment-variables-on-vps)
9. [Step 7 — Build & Launch Containers](#step-7--build--launch-containers)
10. [Step 8 — Point Your Domain (DNS)](#step-8--point-your-domain-dns)
11. [Step 9 — Enable HTTPS with Let's Encrypt](#step-9--enable-https-with-lets-encrypt)
12. [Step 10 — Verify Everything](#step-10--verify-everything)
13. [Re-deploying After Code Changes](#re-deploying-after-code-changes)
14. [Database Backups](#database-backups)
15. [Monitoring & Logs](#monitoring--logs)
16. [Troubleshooting](#troubleshooting)
17. [Quick Reference Commands](#quick-reference-commands)

---

## Architecture Overview

```
Your Local Machine (Windows)
        │
        │  scp / rsync (SSH)
        ▼
[ VPS: 72.61.169.195 ]
        │
        ├── Port 80 / 443  →  Nginx Container (Frontend)
        │                         ├── /           → React SPA (static files)
        │                         └── /api/*      → backend:5000 (Express)
        │
        ├── backend container  →  Node.js + Prisma  →  db:5432
        │
        └── db container       →  PostgreSQL 16
                                     └── Volume: postgres_data (persistent)
```

---

## VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2 GB        |
| Disk     | 20 GB   | 40 GB SSD   |
| OS       | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

---

## Step 1 — Fix SSH Access to VPS

Your SSH is currently failing with **"Permission denied"**. Fix this from your VPS provider's control panel.

### 1.1 Reset Root Password (from Provider Dashboard)

1. Log in to your VPS provider (Hostinger / DigitalOcean / Vultr etc.)
2. Go to **VPS → Manage → Reset Password** (or "Root Password")
3. Set a new strong password
4. Wait 1–2 minutes, then try again:

```powershell
# In your local terminal (PowerShell / CMD)
ssh root@72.61.169.195
```

### 1.2 If SSH Still Fails — Use VNC/Console

Most VPS providers offer a **browser-based console** (VNC / Web Terminal):
- Hostinger → **VPS → Console**
- DigitalOcean → **Droplet → Console**
- Use this to log in and fix SSH directly on the server

### 1.3 Test SSH Works

```powershell
ssh root@72.61.169.195
# You should see: root@hostname:~#
```

---

## Step 2 — Initial Server Setup

> Run all of the following commands **on the VPS** (after SSH-ing in)

### 2.1 Update the System

```bash
apt update && apt upgrade -y
```

### 2.2 Create a Deployment Directory

```bash
mkdir -p /var/www/examtest
```

### 2.3 Install Basic Tools

```bash
apt install -y curl wget unzip nano ufw
```

---

## Step 3 — Install Docker & Docker Compose

Run these commands **on the VPS via SSH**:

```bash
# Remove any old Docker installations
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Install prerequisites
apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify
docker --version
docker compose version
```

Expected output:
```
Docker version 26.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

---

## Step 4 — Configure Firewall

Run on **VPS**:

```bash
# Set default rules
ufw default deny incoming
ufw default allow outgoing

# CRITICAL: Allow SSH first (or you'll lock yourself out)
ufw allow 22/tcp

# Allow web traffic
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Confirm
ufw status verbose
```

---

## Step 5 — Upload Project from Local Terminal

> Run these commands from your **local Windows terminal** (PowerShell / Git Bash / CMD)  
> Your project is at: `D:\Logisaar-product\examtest--main`

### 5.1 Upload Using SCP (Simple Copy)

Open a **new terminal** on your local machine (keep SSH session open in another tab):

```powershell
# Upload the entire project folder to the VPS
# Run from PowerShell or Git Bash on your local machine

scp -r "D:\Logisaar-product\examtest--main\backend" root@72.61.169.195:/var/www/examtest/

scp -r "D:\Logisaar-product\examtest--main\frontend" root@72.61.169.195:/var/www/examtest/

scp "D:\Logisaar-product\examtest--main\docker-compose.yml" root@72.61.169.195:/var/www/examtest/

scp "D:\Logisaar-product\examtest--main\.env.example" root@72.61.169.195:/var/www/examtest/
```

> ⚠️ **Do NOT upload `node_modules` folders** — they are huge and not needed (Docker rebuilds them)

### 5.2 Upload Using rsync (Faster, Skips node_modules)

If you have `rsync` available (Git Bash / WSL):

```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='frontend/dist' \
  --exclude='frontend/dev-dist' \
  --exclude='backend/prisma/dev.db' \
  "D:/Logisaar-product/examtest--main/" \
  root@72.61.169.195:/var/www/examtest/
```

### 5.3 Verify Files Arrived on VPS

Back in your **SSH terminal** on the VPS:

```bash
ls -la /var/www/examtest/
# Should show: backend/  frontend/  docker-compose.yml  .env.example
```

---

## Step 6 — Configure Environment Variables on VPS

On the **VPS SSH terminal**:

```bash
cd /var/www/examtest

# Copy the example file
cp .env.example .env

# Edit and fill in your real values
nano .env
```

Set all values in `.env`:

```env
# ─── PostgreSQL ────────────────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourStrongPasswordHere123!
POSTGRES_DB=examtest_db

# ─── JWT Secrets (generate strong random strings) ──────────────
JWT_SECRET=paste_a_long_random_64_char_string_here
JWT_REFRESH_SECRET=paste_another_long_random_64_char_string_here

# ─── Your Domain ───────────────────────────────────────────────
CLIENT_URL=http://72.61.169.195
# Change to https://yourdomain.com after SSL is set up

# ─── Razorpay ──────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_razorpay_secret
```

**Save and exit nano:** Press `Ctrl+X` → `Y` → `Enter`

> 💡 Generate secure JWT secrets on the VPS:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run this twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`

---

## Step 7 — Build & Launch Containers

On the **VPS SSH terminal**:

```bash
cd /var/www/examtest

# Build all Docker images and start containers in background
docker compose up -d --build
```

This will take **3–8 minutes** on first run (downloading base images + building).

### Watch the Build Progress

```bash
docker compose logs -f
```

Press `Ctrl+C` to exit log view (containers keep running).

### What Happens Automatically

| Order | Container | Action |
|-------|-----------|--------|
| 1st   | `db`      | PostgreSQL starts, creates database |
| 2nd   | `backend` | Waits for DB health → runs `prisma migrate deploy` → starts Express on :5000 |
| 3rd   | `frontend`| Waits for backend health → Nginx serves React SPA on :80 |

### Verify All Containers Are Running

```bash
docker compose ps
```

Expected:
```
NAME                 STATUS          PORTS
examtest_db          Up (healthy)    0.0.0.0:5432->5432/tcp
examtest_backend     Up (healthy)    5000/tcp
examtest_frontend    Up              0.0.0.0:80->80/tcp
```

### Quick Test

```bash
# Test backend health
curl http://localhost:5000/health
# Expected: {"status":"ok"}

# Test frontend (Nginx)
curl -I http://localhost
# Expected: HTTP/1.1 200 OK
```

Open your browser and visit: **`http://72.61.169.195`** — you should see the Nexus Academy app! 🎉

---

## Step 8 — Point Your Domain (DNS)

In your domain registrar's DNS panel, add these records:

| Type | Name      | Value            | TTL  |
|------|-----------|------------------|------|
| A    | `@`       | `72.61.169.195`  | 3600 |
| A    | `www`     | `72.61.169.195`  | 3600 |

Wait 5–30 minutes for DNS to propagate. Test:

```bash
# On VPS
ping yourdomain.com
# Should show: 72.61.169.195
```

---

## Step 9 — Enable HTTPS with Let's Encrypt

> Do this **after** your domain is pointing to the VPS and HTTP is working.

### 9.1 Install Certbot on VPS

```bash
apt install -y certbot
```

### 9.2 Stop Frontend Temporarily (Certbot needs port 80)

```bash
docker compose stop frontend
```

### 9.3 Obtain SSL Certificate

```bash
certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email
```

Certificates saved to:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

### 9.4 Update nginx.conf for HTTPS

```bash
nano /var/www/examtest/frontend/nginx.conf
```

Replace the entire file with:

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass         http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
    }

    # React SPA — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.5 Update docker-compose.yml to Expose Port 443

```bash
nano /var/www/examtest/docker-compose.yml
```

Find the `frontend:` section and update `ports` and add `volumes`:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: examtest_frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"           # ← add this line
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro    # ← add this block
    networks:
      - examtest_net
```

### 9.6 Rebuild Frontend Container

```bash
docker compose up -d --build frontend
```

### 9.7 Update CLIENT_URL in .env

```bash
nano /var/www/examtest/.env
# Change: CLIENT_URL=https://yourdomain.com
```

Then restart backend:

```bash
docker compose restart backend
```

### 9.8 Auto-Renew SSL (Cron Job)

```bash
# Test renewal works
certbot renew --dry-run

# Add auto-renew cron (runs at 3 AM daily)
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f /var/www/examtest/docker-compose.yml restart frontend") | crontab -
```

---

## Step 10 — Verify Everything

```bash
# All containers healthy
docker compose -f /var/www/examtest/docker-compose.yml ps

# Backend responds
curl http://localhost/api/health

# HTTPS works (after domain + SSL setup)
curl -I https://yourdomain.com

# Database tables exist
docker compose exec db psql -U postgres -d examtest_db -c "\dt"

# Recent backend logs
docker compose logs backend --tail=30
```

---

## Re-deploying After Code Changes

When you update code on your **local machine**, re-upload and rebuild:

### Step 1 — Upload Changed Files from Local Terminal

```powershell
# Upload only backend changes
scp -r "D:\Logisaar-product\examtest--main\backend\src" root@72.61.169.195:/var/www/examtest/backend/

# Upload only frontend changes
scp -r "D:\Logisaar-product\examtest--main\frontend\src" root@72.61.169.195:/var/www/examtest/frontend/

# Upload everything (excluding node_modules) using rsync
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='frontend/dist' \
  --exclude='backend/prisma/dev.db' \
  "D:/Logisaar-product/examtest--main/" \
  root@72.61.169.195:/var/www/examtest/
```

### Step 2 — Rebuild on VPS

```bash
# On VPS SSH terminal
cd /var/www/examtest

# Rebuild only what changed
docker compose up -d --build backend    # if backend changed
docker compose up -d --build frontend   # if frontend changed
docker compose up -d --build            # if both changed
```

---

## Database Backups

### Manual Backup

```bash
# On VPS — create a backup file
docker compose exec db pg_dump -U postgres examtest_db \
  > /root/backup_$(date +%Y%m%d_%H%M%S).sql

ls -lh /root/backup_*.sql
```

### Download Backup to Local Machine

```powershell
# Run from local terminal
scp root@72.61.169.195:/root/backup_20260613_120000.sql "D:\Logisaar-product\backups\"
```

### Restore from Backup

```bash
# On VPS
cat /root/backup_20260613_120000.sql \
  | docker compose exec -T db psql -U postgres -d examtest_db
```

### Automated Daily Backup Cron

```bash
# On VPS
mkdir -p /root/db-backups

# Add cron: backup at 2 AM daily, keep last 7 days
(crontab -l 2>/dev/null; echo "0 2 * * * docker compose -f /var/www/examtest/docker-compose.yml exec -T db pg_dump -U postgres examtest_db > /root/db-backups/backup_\$(date +\%Y\%m\%d).sql") | crontab -

(crontab -l 2>/dev/null; echo "0 4 * * * find /root/db-backups -name '*.sql' -mtime +7 -delete") | crontab -
```

---

## Monitoring & Logs

```bash
# Live logs from all containers
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Frontend (Nginx) logs only
docker compose logs -f frontend

# Last 50 lines from backend
docker compose logs backend --tail=50

# Real-time CPU/Memory usage of all containers
docker stats

# Container health status
docker inspect examtest_backend | grep -A 5 '"Health"'

# Disk usage
df -h
docker system df
```

---

## Troubleshooting

### ❌ SSH Permission Denied

```
root@72.61.169.195's password: Permission denied
```

**Fix:**
1. Go to your VPS provider dashboard → Reset Root Password
2. Try VNC/Web Console from the dashboard to log in directly
3. Once inside, check: `cat /etc/ssh/sshd_config | grep PasswordAuthentication`
   - It might be set to `no` — change to `yes` and `systemctl restart ssh`

### ❌ SCP Upload Fails

```powershell
# Try with verbose flag to see what's happening
scp -v -r "D:\Logisaar-product\examtest--main\backend" root@72.61.169.195:/var/www/examtest/
```

### ❌ Docker Build Fails

```bash
# View full build output
docker compose build --no-cache backend
docker compose build --no-cache frontend

# Check disk space
df -h
# If low: clean Docker cache
docker system prune -af
```

### ❌ Containers Exit Immediately

```bash
# Check what error caused the exit
docker compose logs backend
docker compose logs db

# Common fix: check .env values are correct
cat /var/www/examtest/.env
```

### ❌ Backend Can't Connect to Database

```bash
# Is DB healthy?
docker compose exec db pg_isready -U postgres

# Check DATABASE_URL inside backend container
docker compose exec backend env | grep DATABASE_URL

# Manually run migrations
docker compose exec backend npx prisma migrate deploy
```

### ❌ Prisma Migration Error on Startup

```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Apply pending migrations manually
docker compose exec backend npx prisma migrate deploy
```

### ❌ Frontend Shows Blank Page

```bash
# Check nginx config is valid
docker compose exec frontend nginx -t

# Check if index.html was built
docker compose exec frontend ls /usr/share/nginx/html

# Rebuild frontend
docker compose up -d --build frontend
```

### ❌ /api/* Requests Return 502

```bash
# Is backend running?
docker compose ps backend

# Test backend from inside frontend container
docker compose exec frontend wget -qO- http://backend:5000/health

# Restart backend
docker compose restart backend
```

### ❌ Out of Memory (Server Freezing)

```bash
# Check memory
free -h

# Add 1GB swap space
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Quick Reference Commands

```bash
# ─── On VPS (SSH) ────────────────────────────────────────────

cd /var/www/examtest                     # project directory

docker compose up -d --build             # build + start all
docker compose up -d --build backend     # rebuild backend only
docker compose up -d --build frontend    # rebuild frontend only
docker compose down                      # stop all containers
docker compose down -v                   # stop + delete volumes (⚠️ deletes DB)
docker compose restart backend           # restart backend
docker compose ps                        # list containers + status
docker compose logs -f                   # live logs all services
docker compose logs backend --tail=50    # last 50 lines backend
docker compose exec backend sh           # shell inside backend
docker compose exec db psql -U postgres -d examtest_db  # DB shell
docker stats                             # CPU/RAM usage

# ─── On Local Machine (PowerShell) ──────────────────────────

# SSH into VPS
ssh root@72.61.169.195

# Upload backend src
scp -r "D:\Logisaar-product\examtest--main\backend\src" root@72.61.169.195:/var/www/examtest/backend/

# Upload frontend src
scp -r "D:\Logisaar-product\examtest--main\frontend\src" root@72.61.169.195:/var/www/examtest/frontend/

# Upload docker-compose.yml
scp "D:\Logisaar-product\examtest--main\docker-compose.yml" root@72.61.169.195:/var/www/examtest/

# Download DB backup to local
scp root@72.61.169.195:/root/db-backups/backup_latest.sql "D:\Logisaar-product\backups\"
```

---

*Nexus Academy · VPS Deployment Guide · June 2026*
