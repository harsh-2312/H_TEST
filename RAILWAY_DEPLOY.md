# 🚂 Hisabo — Railway Free Deploy (Step by Step)

Railway par free mein deploy karo — koi credit card nahi chahiye (500 hours/month free)

---

## Total Time: ~15 minutes

---

## Step 1 — Railway Account Banao

1. https://railway.app par jao
2. **"Start a New Project"** click karo
3. GitHub se login karo (free hai)

---

## Step 2 — GitHub par Code Upload Karo

### Option A: GitHub Desktop (Easy)
1. https://github.com new repository banao — name: `hisabo`
2. Is zip ko extract karo
3. `ledger-hisabo` folder ko GitHub par push karo

### Option B: Terminal se
```bash
cd ledger-hisabo
git init
git add .
git commit -m "Hisabo initial"
gh repo create hisabo --public --push --source=.
```

---

## Step 3 — PostgreSQL Database Add Karo

1. Railway dashboard mein **"New Project"** → **"Database"** → **"PostgreSQL"** select karo
2. Database create hone ke baad **"Connect"** tab mein `DATABASE_URL` copy karo
3. Yeh URL save rakho — API mein use hoga

---

## Step 4 — API Service Deploy Karo

1. Railway project mein **"New Service"** → **"GitHub Repo"** → apna `hisabo` repo select karo
2. **Root Directory** set karo: `apps/api`
3. **Environment Variables** mein yeh daalo:

```
DATABASE_URL    = [Step 3 mein copy kiya URL]
JWT_SECRET      = hisabo-secret-abcdef1234567890abcdef1234567890ab
JWT_REFRESH_SECRET = hisabo-refresh-abcdef1234567890abcdef12345678
PORT            = 4000
CLIENT_URL      = https://YOUR-WEB-URL.up.railway.app  (Step 5 ke baad update karna)
```

4. **Deploy** click karo — build hoga (~3-4 min)
5. **Settings** → **Networking** → **Generate Domain** click karo
6. Milega kuch aisa: `hisabo-api-production.up.railway.app` — **COPY KARO**

---

## Step 5 — Web Service Deploy Karo

1. Railway project mein phir **"New Service"** → **"GitHub Repo"** → same repo
2. **Root Directory** set karo: `apps/web`
3. **Environment Variables** mein daalo:

```
NEXT_PUBLIC_API_URL = https://[Step 4 ka API domain]
```

Example:
```
NEXT_PUBLIC_API_URL = https://hisabo-api-production.up.railway.app
```

4. **Deploy** click karo (~4-5 min)
5. **Settings** → **Networking** → **Generate Domain**
6. Milega: `hisabo-web-production.up.railway.app` — **YEH AAPKA APP URL HAI!**

---

## Step 6 — API mein Web URL Update Karo

1. API service → **Variables** tab
2. `CLIENT_URL` update karo:
```
CLIENT_URL = https://hisabo-web-production.up.railway.app
```
3. API automatically redeploy hogi

---

## Step 7 — Test Karo!

Browser mein open karo:
```
https://hisabo-web-production.up.railway.app
```

- Register karo → Business banao → Transactions add karo ✅

---

## Free Plan Limits

| Feature | Limit |
|---------|-------|
| Hours | 500 hrs/month (~21 days) |
| RAM | 512MB per service |
| Storage | 1GB DB |
| Bandwidth | 100GB |

Testing ke liye bilkul enough hai! Baad mein $5/month plan pe upgrade kar sakte ho.

---

## Common Errors & Fix

| Error | Fix |
|-------|-----|
| `DATABASE_URL not set` | Railway PostgreSQL plugin se URL copy karo |
| `CORS error` | API ki `CLIENT_URL` variable mein web URL sahi daalo |
| `Build failed` | Railway logs dekho — usually missing env variable hoti hai |
| `Prisma error` | Deploy command mein `prisma migrate deploy` already hai |

