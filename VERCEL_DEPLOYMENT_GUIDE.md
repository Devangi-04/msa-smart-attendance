# Vercel Deployment Guide - MSA Smart Attendance System

## 📋 Prerequisites Checklist

Before deploying, make sure you have:
- ✅ Vercel account (free tier is fine)
- ✅ GitHub account
- ✅ PostgreSQL database (we'll set this up)
- ✅ Your project code ready

---

## 🚀 Step-by-Step Deployment Guide

### **Step 1: Prepare Your Database (PostgreSQL)**

Since Vercel is serverless, SQLite won't work. You need PostgreSQL.

#### **Option A: Vercel Postgres (Recommended)**
1. Go to https://vercel.com/dashboard
2. Click on "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name (e.g., `msa-attendance-db`)
6. Click "Create"
7. **Copy the connection string** - you'll need this!

#### **Option B: Neon.tech (Free PostgreSQL)**
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:password@host/database`)

#### **Option C: Supabase (Free PostgreSQL)**
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy the connection string

---

### **Step 2: Update Prisma Schema for PostgreSQL**

Your `prisma/schema.prisma` file needs to use PostgreSQL instead of SQLite.

**Current (SQLite):**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Change to (PostgreSQL):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### **Step 3: Push Your Code to GitHub**

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MSA Smart Attendance System"
   ```

2. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it: `msa-smart-attendance`
   - Don't initialize with README (you already have code)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/msa-smart-attendance.git
   git branch -M main
   git push -u origin main
   ```

---

### **Step 4: Deploy to Vercel**

#### **Method 1: Using Vercel Dashboard (Easiest)**

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" or "Login"
   - Login with your GitHub account

2. **Import Your Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `msa-smart-attendance`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** Leave empty or use `npm install`
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```
   DATABASE_URL = your_postgresql_connection_string
   JWT_SECRET = your_super_secret_key_here_min_32_chars
   NODE_ENV = production
   ```

   **Important:** 
   - Replace `your_postgresql_connection_string` with your actual PostgreSQL URL
   - Replace `your_super_secret_key_here_min_32_chars` with a random 32+ character string

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - You'll get a URL like: `https://msa-smart-attendance.vercel.app`

---

#### **Method 2: Using Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `msa-smart-attendance`
   - In which directory is your code located? `./`
   - Want to override settings? **N**

5. **Add Environment Variables:**
   ```bash
   vercel env add DATABASE_URL
   # Paste your PostgreSQL connection string

   vercel env add JWT_SECRET
   # Paste your secret key

   vercel env add NODE_ENV
   # Type: production
   ```

6. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

### **Step 5: Run Database Migrations**

After deployment, you need to set up your database tables.

#### **Option A: Using Vercel CLI**
```bash
# Set DATABASE_URL locally for migration
$env:DATABASE_URL="your_postgresql_connection_string"

# Run migration
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

#### **Option B: Using Prisma Studio**
```bash
# Connect to production database
$env:DATABASE_URL="your_postgresql_connection_string"

# Open Prisma Studio
npx prisma studio

# Manually add your admin user
```

---

### **Step 6: Create Admin User**

You need to create an admin user in your production database.

#### **Method 1: Using Prisma Studio**
1. Run: `npx prisma studio` (with production DATABASE_URL)
2. Go to "User" table
3. Click "Add record"
4. Fill in:
   - email: `admin@yourdomain.com`
   - password: (hash of your password - see below)
   - name: `Admin User`
   - role: `ADMIN`
5. Click "Save"

#### **Method 2: Using SQL**
Connect to your PostgreSQL database and run:
```sql
-- You'll need to hash the password first using bcrypt
-- Use this Node.js script to generate hash:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('your_password', 10));

INSERT INTO "User" (email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin@yourdomain.com',
  '$2a$10$HASHED_PASSWORD_HERE',
  'Admin User',
  'ADMIN',
  NOW(),
  NOW()
);
```

---

### **Step 7: Test Your Deployment**

1. **Visit your Vercel URL:**
   - Example: `https://msa-smart-attendance.vercel.app`

2. **Test these pages:**
   - ✅ Home page loads
   - ✅ Login page works
   - ✅ Register page works
   - ✅ Can login with admin credentials
   - ✅ Dashboard loads
   - ✅ Can create events
   - ✅ Can view members

3. **Check for errors:**
   - Open browser console (F12)
   - Look for any red errors
   - Check Vercel logs if something doesn't work

---

## 🔧 Common Issues & Solutions

### **Issue 1: Database Connection Error**
**Error:** `Can't reach database server`

**Solution:**
- Check your DATABASE_URL is correct
- Make sure PostgreSQL database is running
- Verify connection string format:
  ```
  postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
  ```

---

### **Issue 2: Prisma Client Not Generated**
**Error:** `@prisma/client did not initialize yet`

**Solution:**
Add this to your `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy"
  }
}
```

Then redeploy:
```bash
git add .
git commit -m "Add postinstall script"
git push
```

---

### **Issue 3: Static Files Not Loading**
**Error:** CSS/JS files not loading

**Solution:**
Check your `vercel.json` file is correct:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    },
    {
      "src": "src/public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/app.js"
    },
    {
      "src": "/",
      "dest": "src/public/index.html"
    },
    {
      "src": "/(.+)",
      "dest": "src/public/$1"
    }
  ]
}
```

---

### **Issue 4: Environment Variables Not Working**
**Error:** JWT_SECRET is undefined

**Solution:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Make sure all variables are added
5. Redeploy the project

---

## 📝 Environment Variables Reference

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Random 32+ character string | `your_super_secret_jwt_key_min_32_chars` |
| `NODE_ENV` | production | `production` |

---

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] Test login functionality
- [ ] Create a test event
- [ ] Test QR code generation
- [ ] Test attendance marking
- [ ] Test member registration
- [ ] Test Excel export
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Monitor error logs

---

## 🌐 Custom Domain (Optional)

1. **Go to Vercel Dashboard**
2. Select your project
3. Go to Settings → Domains
4. Click "Add Domain"
5. Enter your domain (e.g., `attendance.yourdomain.com`)
6. Follow DNS configuration instructions
7. Wait for DNS propagation (5-30 minutes)

---

## 📊 Monitoring Your Deployment

### **View Logs:**
```bash
vercel logs
```

### **View Deployment Status:**
```bash
vercel ls
```

### **View Environment Variables:**
```bash
vercel env ls
```

---

## 🔄 Updating Your Deployment

Whenever you make changes:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Vercel auto-deploys** from GitHub
   - Every push to `main` branch triggers deployment
   - Check deployment status in Vercel Dashboard

---

## 💡 Pro Tips

1. **Use Environment Variables** - Never hardcode secrets
2. **Test Locally First** - Always test before deploying
3. **Check Logs** - Use `vercel logs` to debug issues
4. **Use Preview Deployments** - Test on preview URLs before production
5. **Set up Monitoring** - Use Vercel Analytics (free)
6. **Backup Database** - Regular backups of PostgreSQL
7. **Use Git Branches** - Develop on branches, deploy from main

---

## 🆘 Need Help?

### **Vercel Documentation:**
- https://vercel.com/docs

### **Prisma Documentation:**
- https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

### **Common Commands:**
```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Open project in browser
vercel open
```

---

## ✅ Success!

Once deployed, your MSA Smart Attendance System will be live at:
- **Production URL:** `https://your-project.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (if configured)

**Your application is now accessible worldwide! 🌍🎉**

---

**Last Updated:** October 19, 2025  
**Version:** 2.0.0  
**Deployment Platform:** Vercel
