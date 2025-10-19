# How to View and Update Vercel Production Database

## Method 1: Using Vercel Postgres Dashboard (Easiest)

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project: **msa-smart-attendance**
3. Click on **Storage** tab

### Step 2: Open Your Database
1. Click on your Postgres database
2. You'll see the database overview

### Step 3: Query Data
Click on **Data** or **Query** tab to:
- View all tables (User, Event, Attendance)
- Run SQL queries
- Edit data directly

### Example SQL Queries:

**View all users:**
```sql
SELECT id, name, email, "mesId", role 
FROM "User" 
ORDER BY role DESC;
```

**View admin users:**
```sql
SELECT id, name, email, "mesId", role 
FROM "User" 
WHERE role = 'ADMIN';
```

**Update admin MES ID:**
```sql
UPDATE "User" 
SET "mesId" = 'misadmin2025@msa.com' 
WHERE role = 'ADMIN';
```

**View all events:**
```sql
SELECT id, name, date, status, venue 
FROM "Event" 
ORDER BY date DESC;
```

**Count attendance:**
```sql
SELECT COUNT(*) as total_attendance 
FROM "Attendance";
```

---

## Method 2: Using Local Script with Production Database URL

### Step 1: Get Production Database URL
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Find and copy the `DATABASE_URL` value
   - It should start with `postgresql://` or `postgres://`

### Step 2: Temporarily Set Database URL
Open PowerShell/Command Prompt and run:

```powershell
# Set the production database URL
$env:DATABASE_URL="your-production-database-url-here"

# View the database
node view-vercel-database.js
```

**Example:**
```powershell
$env:DATABASE_URL="postgresql://user:password@host.vercel-storage.com:5432/database"
node view-vercel-database.js
```

### Step 3: Update Admin MES ID (if needed)
```powershell
# After setting DATABASE_URL above
node scripts/update-admin-production.js
```

---

## Method 3: Using Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login and Link
```bash
vercel login
cd c:\Users\devan\FINALYRPROJ
vercel link
```

### Step 3: Pull Environment Variables
```bash
vercel env pull .env.production
```

This creates a `.env.production` file with your production DATABASE_URL.

### Step 4: Use Production Database
```bash
# Load production env and view database
node -r dotenv/config view-vercel-database.js dotenv_config_path=.env.production
```

---

## Method 4: Using Prisma Studio with Production Database

### Step 1: Create Production Environment File
Create a file `.env.production.local`:
```
DATABASE_URL="your-production-database-url"
```

### Step 2: Update Prisma Schema Temporarily
Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Run Prisma Studio with Production
```bash
# Set environment
$env:DATABASE_URL="your-production-url"

# Run Prisma Studio
npx prisma studio
```

**⚠️ WARNING:** Be very careful when using Prisma Studio with production data!

---

## Method 5: Using Serverless Function (Safest)

### Already Created for You!

1. **Deploy to Vercel** (already done when you pushed)
2. **Set Secret Key** in Vercel:
   - Go to Settings → Environment Variables
   - Add: `ADMIN_UPDATE_SECRET` = `your-secret-key`
3. **View Admin Data:**
   ```
   https://your-app.vercel.app/api/update-admin-mesid?secret=your-secret-key
   ```

---

## Quick Reference: Common Tasks

### View Admin MES ID
```sql
SELECT name, email, "mesId" 
FROM "User" 
WHERE role = 'ADMIN';
```

### Update Admin MES ID
```sql
UPDATE "User" 
SET "mesId" = 'misadmin2025@msa.com' 
WHERE role = 'ADMIN';
```

### View All Users with MES ID
```sql
SELECT name, email, "mesId", role 
FROM "User" 
WHERE "mesId" IS NOT NULL;
```

### Add MES ID to Existing User
```sql
UPDATE "User" 
SET "mesId" = 'new-mes-id' 
WHERE email = 'user@example.com';
```

---

## Security Best Practices

1. ✅ **Never commit** `.env.production` or database URLs to Git
2. ✅ **Use read-only access** when just viewing data
3. ✅ **Backup before updates** - Vercel Postgres has automatic backups
4. ✅ **Test queries** on local database first
5. ✅ **Use transactions** for critical updates
6. ✅ **Limit access** to production database credentials

---

## Troubleshooting

### Error: "Connection refused"
- Check if DATABASE_URL is correct
- Verify database is running on Vercel
- Check firewall/network settings

### Error: "SSL required"
- Add `?sslmode=require` to your DATABASE_URL
- Example: `postgresql://user:pass@host:5432/db?sslmode=require`

### Error: "Table does not exist"
- Run migrations: `npx prisma migrate deploy`
- Check if schema matches production

### Can't find DATABASE_URL
- Go to Vercel Dashboard → Settings → Environment Variables
- It should be listed there

---

## Recommended Workflow

**For Viewing Data:**
→ Use **Method 1** (Vercel Postgres Dashboard)

**For Quick Updates:**
→ Use **Method 1** (SQL queries in Vercel Dashboard)

**For Automated Updates:**
→ Use **Method 5** (Serverless Function)

**For Development:**
→ Use local SQLite database (already configured)
