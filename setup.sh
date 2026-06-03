#!/bin/bash
# ============================================================
# Hisabo — One-command VPS Setup Script
# Run as root or with sudo on Ubuntu 22.04
# Usage: bash setup.sh yourdomain.com your_db_password
# ============================================================

set -e

DOMAIN=${1:-"localhost"}
DB_PASS=${2:-"hisabo_secure_pass_$(openssl rand -hex 8)"}
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "==========================================="
echo "  Hisabo Setup Starting"
echo "  Domain : $DOMAIN"
echo "  AppDir : $APP_DIR"
echo "==========================================="
echo ""

# ---- 1. System packages ----
echo ">> Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# ---- 2. Node.js 20 ----
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]]; then
  echo ">> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "   Node: $(node -v) | npm: $(npm -v)"

# ---- 3. PM2 ----
if ! command -v pm2 &>/dev/null; then
  echo ">> Installing PM2..."
  npm install -g pm2 --silent
fi

# ---- 4. PostgreSQL ----
echo ">> Setting up PostgreSQL..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'hisabo_user'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER hisabo_user WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'hisabodb'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE hisabodb OWNER hisabo_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hisabodb TO hisabo_user;"
echo "   PostgreSQL ready. DB password: $DB_PASS"

# ---- 5. Write .env files ----
echo ">> Writing .env files..."

JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

cat > "$APP_DIR/apps/api/.env" << ENV
DATABASE_URL="postgresql://hisabo_user:${DB_PASS}@localhost:5432/hisabodb"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH}"
PORT=4000
CLIENT_URL="https://${DOMAIN}"
ENV

cat > "$APP_DIR/apps/web/.env" << ENV
NEXT_PUBLIC_API_URL=https://${DOMAIN}
ENV

echo "   .env files written with secure random secrets"

# ---- 6. Install & Build API ----
echo ">> Building API..."
cd "$APP_DIR/apps/api"
npm install --silent
npx prisma generate
npx prisma migrate deploy
npm run build
echo "   API build done"

# ---- 7. Install & Build Web ----
echo ">> Building Web app..."
cd "$APP_DIR/apps/web"
npm install --silent
npm run build
echo "   Web build done"

# ---- 8. Start with PM2 ----
echo ">> Starting with PM2..."
cd "$APP_DIR"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true
echo "   PM2 processes started"

# ---- 9. Nginx ----
echo ">> Configuring Nginx..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" "$APP_DIR/nginx.conf" > /etc/nginx/sites-available/hisabo
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/hisabo /etc/nginx/sites-enabled/hisabo
nginx -t && systemctl reload nginx
echo "   Nginx configured"

# ---- 10. SSL ----
if [[ "$DOMAIN" != "localhost" ]]; then
  echo ">> Setting up SSL (Let's Encrypt)..."
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || \
    echo "   SSL setup failed - run manually: certbot --nginx -d $DOMAIN"
fi

echo ""
echo "==========================================="
echo "  ✅ Hisabo is LIVE!"
echo "  URL     : https://$DOMAIN"
echo "  DB Pass : $DB_PASS"
echo ""
echo "  Useful commands:"
echo "    pm2 status"
echo "    pm2 logs hisabo-api"
echo "    pm2 logs hisabo-web"
echo "    pm2 restart all"
echo "==========================================="
