# 🚀 Hisabo — Hostinger VPS Deploy Guide

## Option A — One Command (Recommended)

Upload this folder to your VPS at `/var/www/hisabo`, then run:

```bash
cd /var/www/hisabo
bash setup.sh yourdomain.com your_db_password
```

That's it. Script handles everything: Node, PostgreSQL, DB migration, build, PM2, Nginx, SSL.

---

## Option B — Manual Step by Step

### Prerequisites
- Ubuntu 22.04 VPS
- Node.js 20+
- PostgreSQL 15+
- PM2: `npm install -g pm2`
- Nginx

### 1. PostgreSQL Setup
```bash
sudo -u postgres psql
CREATE USER hisabo_user WITH PASSWORD 'YOUR_PASSWORD';
CREATE DATABASE hisabodb OWNER hisabo_user;
GRANT ALL PRIVILEGES ON DATABASE hisabodb TO hisabo_user;
\q
```

### 2. Configure .env files

**`apps/api/.env`**
```
DATABASE_URL="postgresql://hisabo_user:YOUR_PASSWORD@localhost:5432/hisabodb"
JWT_SECRET="64-char-random-string"
JWT_REFRESH_SECRET="another-64-char-random-string"
PORT=4000
CLIENT_URL="https://yourdomain.com"
```

**`apps/web/.env`**
```
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 3. Build API
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 4. Build Web
```bash
cd apps/web
npm install
npm run build
```

### 5. Start with PM2
```bash
# From root of project
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it outputs
```

### 6. Nginx
```bash
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx.conf
cp nginx.conf /etc/nginx/sites-available/hisabo
ln -sf /etc/nginx/sites-available/hisabo /etc/nginx/sites-enabled/hisabo
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 7. SSL (Free)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Useful Commands

```bash
pm2 status              # Check all processes
pm2 logs hisabo-api     # API logs
pm2 logs hisabo-web     # Web app logs
pm2 restart all         # Restart everything
pm2 stop all            # Stop everything

# DB operations
cd apps/api
npx prisma studio       # Visual DB browser
npx prisma migrate deploy  # Run new migrations
```

---

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/transactions/create` |
| `/auth/login` | Login |
| `/auth/register` | Register new business |
| `/transactions/create` | **Main calculator entry page** |
| `/transactions` | Transaction list |
| `/dashboard` | Overview & stats |
| `/reports` | Income/expense reports |
| `/categories` | Manage categories |
| `/payment-methods` | Manage payment methods |
| `/team` | Team members |
