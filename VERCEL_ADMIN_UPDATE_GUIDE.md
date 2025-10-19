# How to Update Admin MES ID in Vercel (Production)

## Method 1: Using Vercel Serverless Function (Recommended - Easiest)

### Step 1: Push the update function to GitHub
The file `src/api/update-admin-mesid.js` has been created.

```bash
git add .
git commit -m "Add admin MES ID update endpoint"
git push
```

### Step 2: Set Environment Variable in Vercel
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `ADMIN_UPDATE_SECRET`
   - **Value:** `your-secret-key-here` (choose a strong random string)
   - Click **Save**

### Step 3: Redeploy
Vercel will auto-deploy when you push to GitHub, or manually redeploy from Vercel dashboard.

### Step 4: Call the Endpoint
Visit this URL in your browser (replace with your values):
```
https://your-app-name.vercel.app/api/update-admin-mesid?secret=your-secret-key-here
```

You should see:
```json
{
  "success": true,
  "message": "Admin MES ID updated successfully",
  "data": {
    "name": "System Administrator",
    "email": "admin@attendance.com",
    "mesId": "misadmin2025@msa.com",
    "role": "ADMIN"
  }
}
```

### Step 5: Delete the Endpoint (Security)
After successfully updating, delete the file for security:
```bash
git rm src/api/update-admin-mesid.js
git commit -m "Remove admin update endpoint"
git push
```

---

## Method 2: Using Vercel Postgres Dashboard (If using Vercel Postgres)

### Step 1: Access Vercel Postgres
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Storage** tab
4. Click on your Postgres database

### Step 2: Run SQL Query
In the **Query** tab, run:
```sql
UPDATE "User" 
SET "mesId" = 'misadmin2025@msa.com' 
WHERE role = 'ADMIN';
```

### Step 3: Verify
Run this query to verify:
```sql
SELECT id, name, email, "mesId", role 
FROM "User" 
WHERE role = 'ADMIN';
```

---

## Method 3: Using Local Script with Production Database URL

### Step 1: Get Production Database URL
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Copy the `DATABASE_URL` value

### Step 2: Run Script Locally
```bash
# Set the production database URL temporarily
set DATABASE_URL=your-production-database-url

# Run the update script
node scripts/update-admin-production.js
```

**⚠️ WARNING:** Be very careful with this method as you're directly accessing production data!

---

## Method 4: Using Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login and Link Project
```bash
vercel login
vercel link
```

### Step 3: Run Command in Production Environment
```bash
vercel env pull .env.production
node scripts/update-admin-production.js
```

---

## Recommended Approach

**For first-time setup:** Use **Method 1** (Serverless Function)
- ✅ Safe and controlled
- ✅ No need to expose database credentials
- ✅ Can be easily removed after use
- ✅ Works with any database (Postgres, MySQL, etc.)

**For quick updates:** Use **Method 2** (Postgres Dashboard)
- ✅ Direct and fast
- ✅ Only works if using Vercel Postgres

---

## Security Notes

1. **Never commit database URLs** to git
2. **Delete the update endpoint** after use
3. **Use strong secret keys** for the serverless function
4. **Limit access** to production database
5. **Test locally first** before running in production

---

## Troubleshooting

### Error: "Admin user not found"
- Check if admin exists in production database
- Verify the database connection

### Error: "Unauthorized: Invalid secret key"
- Make sure `ADMIN_UPDATE_SECRET` is set in Vercel
- Check that you're using the correct secret in the URL

### Error: "Database connection failed"
- Verify `DATABASE_URL` is set correctly in Vercel
- Check database is accessible from Vercel

---

## After Update

Test the login with:
- **MES ID:** `misadmin2025@msa.com`
- **Password:** (your existing admin password)
