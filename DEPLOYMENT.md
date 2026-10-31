# 🚀 Brightloop Deployment Guide: Neon + Render + Vercel

Is guide mein hum aapke **Brightloop Subscription Management System** ko live public production par deploy karne ka step-by-step tareeqa dekhenge.

---

## 🏗️ Target Production Architecture

```
┌─────────────────────────────────┐
│     CLIENT BROWSER / USERS      │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     FRONTEND: VERCEL (Vite)     │
│   https://brightloop.vercel.app │
└────────────────┬────────────────┘
                 │ (REST API with CORS)
                 ▼
┌─────────────────────────────────┐
│     BACKEND: RENDER (Node.js)   │
│   https://brightloop.onrender...│
└────────────────┬────────────────┘
                 │ (SSL Connection)
                 ▼
┌─────────────────────────────────┐
│   DATABASE: NEON (PostgreSQL)   │
│  ep-xyz.neon.tech/neondb?ssl=1  │
└─────────────────────────────────┘
```

---

## 📋 Accounts Required (All 100% Free Tier Available)

1. **GitHub Account**: [github.com](https://github.com) (Code hosting)
2. **Neon Account**: [neon.tech](https://neon.tech) (Cloud Serverless PostgreSQL database)
3. **Render Account**: [render.com](https://render.com) (Backend Node.js Web Service hosting)
4. **Vercel Account**: [vercel.com](https://vercel.com) (Frontend React/Vite SPA hosting)
5. **Razorpay Account** (Optional for Live payments, Test mode works by default): [dashboard.razorpay.com](https://dashboard.razorpay.com)

---

## 🔑 Exact Credentials & Settings You Need

| Service | Setting / Variable Name | Where To Get It | Description |
| :--- | :--- | :--- | :--- |
| **Neon** | `DATABASE_URL` | Neon Dashboard -> "Connection Details" | `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require` |
| **Render** | `PORT` | Auto-set by Render | Render sets this automatically (Backend binds to `0.0.0.0`) |
| **Render** | `NODE_ENV` | Enter: `production` | Tells Express and Prisma to run in production mode |
| **Render** | `JWT_SECRET` | You create any random string | e.g. `brightloop_jwt_secret_secure_prod_2026_xyz` |
| **Render** | `JWT_EXPIRES_IN` | Enter: `7d` | Token expiry duration |
| **Render** | `FRONTEND_URL` | From Vercel after Step 3 | e.g. `https://brightloop-software.vercel.app` |
| **Render** | `RAZORPAY_KEY_ID` | Razorpay Dashboard -> API Keys | e.g. `rzp_test_...` (or test placeholder) |
| **Render** | `RAZORPAY_KEY_SECRET` | Razorpay Dashboard -> API Keys | Secret key for webhook/order verification |
| **Vercel** | `VITE_API_URL` | From Render after Step 2 | e.g. `https://brightloop-backend.onrender.com/api` |

---

## 🛠️ Step-by-Step Deployment Instructions

---

### Step 1: Create PostgreSQL Database on Neon (2 Minutes)

1. [neon.tech](https://neon.tech) par sign up / login karein.
2. Click **"New Project"**.
3. Name rakhein: `brightloop-db`
4. Region choose karein (e.g. `AWS Asia Pacific (Singapore)` or `US East`).
5. Click **"Create Project"**.
6. Dashboard par aapko **Connection Details** box dikhega.
   - Dropdown mein select karein: **"Prisma"** ya **"Node.js"**.
   - Pooori connection string copy karein. Yeh kuch aisi dikhegi:
     ```text
     postgresql://neondb_owner:npg_AbCdEf123@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
7. Is connection string ko save kar lein — yeh Render backend mein use hogi.

---

### Step 2: Push Your Codebase to GitHub

1. [github.com/new](https://github.com/new) par jayein aur ek new repository banayein: `brightloop-subscription-management`.
2. Repository ko **Public** rakhein aur "Initialize with README" ko UNCHECK rakhein.
3. Local terminal se code push karein:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/brightloop-subscription-management.git
   git push -u origin main
   ```

---

### Step 3: Deploy Backend on Render (3 Minutes)

1. [dashboard.render.com](https://dashboard.render.com) par login karein.
2. Click **"New +"** -> **"Web Service"**.
3. Apni GitHub repository `brightloop-subscription-management` connect karein.
4. Fill in the exact settings:
   - **Name**: `brightloop-backend`
   - **Region**: Choose closest to Neon (e.g. `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `backend`  *(⚠️ VERY IMPORTANT)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **"Advanced"** -> **"Add Environment Variable"** aur yeh variables add karein:
   - `DATABASE_URL`: *(Neon ki connection string jo Step 1 mein copy ki thi)*
   - `JWT_SECRET`: `brightloop_jwt_secret_secure_prod_2026_xyz`
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `*` *(Temporary wildcard, Vercel deploy hone ke baad Vercel domain daal denge)*
   - `RAZORPAY_KEY_ID`: `rzp_test_placeholder123`
   - `RAZORPAY_KEY_SECRET`: `rzp_secret_placeholder456`
6. Click **"Create Web Service"**.
7. Render build complete hone ke baad aapko aapka live backend URL mil jayega:
   - e.g., `https://brightloop-backend.onrender.com`
8. Check test: Browser mein `https://brightloop-backend.onrender.com/api/health` kholein.  
   Output aayega: `{"status":"OK", "service":"Brightloop..."}`.

---

### Step 4: Run Database Migrations & Seed Initial Data on Neon

Neon database mein tables create karne aur demo users (Admin, Staff, Customer) load karne ke 2 aasan tareeqe hain:

#### Option A: Local machine se Neon par seed karein (Recommended & Fastest):
Apne local terminal par temporarily Neon URL ke sath seed run kar dein:
```bash
cd backend
# 1. Switch Prisma schema to PostgreSQL
npm run use:postgres

# 2. Push schema to Neon
DATABASE_URL="<YOUR_NEON_POSTGRES_URL>" npx prisma db push

# 3. Seed users & catalog to Neon
DATABASE_URL="<YOUR_NEON_POSTGRES_URL>" npm run seed
```

#### Option B: Render Shell se:
Render dashboard par apne service ke andar **"Shell"** tab kholein aur run karein:
```bash
npx prisma db push
npm run seed
```

---

### Step 5: Deploy Frontend on Vercel (2 Minutes)

1. [vercel.com](https://vercel.com) par login karein.
2. Click **"Add New..."** -> **"Project"**.
3. Apni GitHub repository `brightloop-subscription-management` select karein.
4. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend` *(⚠️ VERY IMPORTANT)*
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
5. **Environment Variables**:
   - Add variable name: `VITE_API_URL`
   - Value: `https://brightloop-backend.onrender.com/api` *(Step 3 wala Render URL + `/api`)*
6. Click **"Deploy"**.
7. Vercel build complete karega aur aapko live link mil jayegi:
   - e.g., `https://brightloop-subscription.vercel.app`

---

### Step 6: Final Security & Production Linking

1. Render dashboard par jayein -> `brightloop-backend` service.
2. **Environment Variables** mein `FRONTEND_URL` ko update karein:
   - `FRONTEND_URL`: `https://brightloop-subscription.vercel.app`
3. Click **"Save Changes"** (Render auto redeploy kar dega).

---

## 🎯 Verification & Testing Checklist

Ab aap apne Vercel public URL par jayein aur test karein:

1. **Admin Persona**:
   - Login: `admin@brightloop.io` / `Admin@Brightloop123`
   - Check MRR Dashboard, Product additions, Tax & Discount settings, and Staff creation.
2. **Staff Persona**:
   - Login: `staff@brightloop.io` / `Staff@Brightloop123`
   - Verify quotes, subscriptions, and invoices.
3. **Customer Persona**:
   - Login: `apex@enterprise.com` / `Customer@Brightloop123`
   - Verify Client Portal, subscription viewing, and Razorpay modal test payment.

Everything is production-ready, secure, and isolated! 🚀
