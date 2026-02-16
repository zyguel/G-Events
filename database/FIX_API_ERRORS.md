# 🚨 CRITICAL: Fix API 500 Errors

## Root Cause
**ALL issues stem from API returning 500 errors:**
- ❌ Permissions not loading → API 500 error
- ❌ Can't remove users (NaN error) → API 500 error
- ❌ Nothing works → API 500 error

## The Solution: Fix Supabase Connection

### Step 1: Verify .env.local is Correct

Open `d:\g-events\.env.local` and make sure it contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jommrqubyihfyznalkfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbW1ycXVieWloZnl6bmFsa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDk1NTMsImV4cCI6MjA4NjUyNTU1M30.h42CJ0GIhO5Q9GU5LGEXs-zYxdLtab-a9Uw5o5vunTQ
NEXT_PUBLIC_DEFAULT_ORG_ID=1
```

### Step 2: **CRITICAL** - Restart Dev Server Properly

The dev server MUST be restarted to load `.env.local`. Here's how:

#### In PowerShell Terminal:
```powershell
# 1. Stop all Node processes
taskkill /F /IM node.exe

# 2. Wait 2 seconds
timeout /t 2

# 3. Delete the Next.js lock file
Remove-Item -Path "D:\g-events\.next\dev\lock" -ErrorAction SilentlyContinue

# 4. Start dev server fresh
cd D:\g-events
npm run dev
```

### Step 3: Test the API

Once the server restarts, open your browser and go to:

```
http://localhost:3000/api/management/users
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "emanuelray23@gmail.com",
      "role": "Admin",
      "roleId": 1,
      "avatar": "/icons/man.png"
    }
  ]
}
```

**If you see an error:**
1. Check browser DevTools Console (F12)
2. Check terminal logs for error messages
3. Verify you ran the seed.sql script in Supabase

### Step 4: Verify Database Has Data

Go to your Supabase Dashboard → SQL Editor and run:

```sql
SELECT 
    u.id,
    u.name,
    u.email,
    r.name as role_name
FROM "User" u
JOIN "OrganizationUserRole" our ON u.id = our.user_id
JOIN "OrganizationRole" r ON our.organization_role_id = r.id
WHERE our.organization_id = 1;
```

**Expected:** At least 1 user (you)

### Step 5: Check Supabase Credentials

Make sure the Anon Key hasn't expired or been rotated:
1. Go to Supabase Dashboard → Settings → API
2. Copy the "anon" public key
3. Compare with the key in `.env.local`
4. If different, update `.env.local` and restart server

## Why This Fixes Everything

### Problem: NaN User ID
- **Root Cause:** API returns 500 → Users don't load → `editingMember.id` is undefined → `parseInt(undefined)` = NaN
- **Fix:** Once API works, users load correctly with proper IDs

### Problem: Permissions Don't Show
- **Root Cause:** API returns 500 error → Can't fetch permission IDs → Checkboxes stay unchecked
- **Fix:** Once API works, permission IDs are fetched and checkboxes populate

## Quick Diagnostic Command

Run this in your browser console (F12):

```javascript
// Test all endpoints
const tests = async () => {
  const tests = [
    '/backend/management/users',
    '/backend/management/roles',
    '/backend/management/permissions',
    '/backend/management/roles/1'
  ];
  
  for (const url of tests) {
    try {
      const r = await fetch(url);
      const data = await r.json();
      console.log(`✅ ${url}:`, data);
    } catch (e) {
      console.error(`❌ ${url}:`, e);
    }
  }
};

tests();
```

If ANY show errors, the Supabase connection is broken.

## Common Errors & Solutions

### Error: "Failed to fetch"
- **Cause:** Dev server not running
- **Fix:** Run `npm run dev`

### Error: "Invalid API key"
- **Cause:** Wrong anon key in `.env.local`
- **Fix:** Get key from Supabase Dashboard → Settings → API

### Error: "relation X does not exist"
- **Cause:** Database schema not created
- **Fix:** Run the schema migrations in Supabase

### Error: "permission denied"
- **Cause:** Row Level Security blocking reads
- **Fix:** Temporarily disable RLS:
  ```sql
  ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "OrganizationRole" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "OrganizationUserRole" DISABLE ROW LEVEL SECURITY;
  ```

## Once API is Fixed

After the API returns proper data:
1. Refresh the management page
2. Users will load with correct IDs
3. You'll be able to remove users without NaN error
4. Permissions will show as checked when editing roles

**Everything will work!**
