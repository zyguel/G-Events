# Debugging Checklist - Permission Loading Issue

## Problem
User doesn't see any checked permissions when editing roles.

## Root Cause Analysis

### Issue 1: API Returning 500 Error
The `/backend/management/permissions` endpoint was returning `NaN` in the JSON response because one of the permission IDs in the database was `NaN`.

### Checklist to Fix

#### Step 1: ✅ Verify Database Has Been Seeded
Run this query in your Supabase SQL Editor to check if you have role permissions:

```sql
-- Check if roles exist
SELECT * FROM "OrganizationRole" WHERE organization_id = 1;

-- Check if permissions exist  
SELECT COUNT(*) as permission_count FROM "OrganizationPermission";

-- Check if Admin role has permissions assigned
SELECT 
    r.name as role_name,
    COUNT(rp.id) as assigned_permissions
FROM "OrganizationRole" r
LEFT JOIN "OrganizationRolePermission" rp ON r.id = rp.organization_role_id
WHERE r.organization_id = 1
GROUP BY r.id, r.name;
```

**Expected Results:**
- At least 3 roles (Admin, Core Member, Volunteer)
- At least 20+ permissions
- Admin should have the most permissions assigned

**If you see NO results:**
- You haven't run the `seed.sql` script yet!
- Go to Supabase → SQL Editor → Paste the contents of `database/seed.sql`
- Make sure to update the email on line 108 to your email
- Run the script

#### Step 2: 🔄 **Restart Dev Server**
The dev server must be restarted to load the `.env.local` file:

```powershell
# In your terminal, press Ctrl+C to stop the server
# Then run:
npm run dev
```

**Why?** Next.js only reads `.env.local` at startup. The file was empty earlier, so the server started without Supabase credentials.

#### Step 3: 🧪 Test API Directly
Once the server restarts, open this in your browser:
```
http://localhost:3000/backend/management/roles
```

**Expected:** JSON response with list of roles
**If you still get error:** Check browser console (F12) for specific error message

#### Step 4: 🎯 Test Permission Loading
1. Go to http://localhost:3000/management
2. Switch to "Roles" tab
3. Click three-dots menu on "Admin" role
4. Click "Edit Permissions"
5. **Check:** Should see many checkboxes already checked for Admin

## Common Issues

### Issue: "Cannot read properties of null"
**Cause:** Database tables don't exist
**Fix:** Run the schema migrations in Supabase first

### Issue: "Permission denied"
**Cause:** Row Level Security (RLS) is blocking access
**Fix:** Temporarily disable RLS for testing:
```sql
ALTER TABLE "OrganizationRole" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationPermission" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationRolePermission" DISABLE ROW LEVEL SECURITY;
```

### Issue: Empty response `{success:true, data:[]}`
**Cause:** No data in database
**Fix:** Run the seed.sql script

## Quick Test Commands

### Test Supabase Connection
Open browser console (F12) and run:
```javascript
fetch('/backend/management/permissions')
  .then(r => r.json())
  .then(d => console.log('Permissions:', d));
```

Should show list of all available permissions.

### Test Role Permissions
```javascript
fetch('/api/management/roles/1')
  .then(r => r.json())
  .then(d => console.log('Role 1 Permissions:', d));
```

Should show `{success: true, data: {permissionIds: [1,2,3...]}}`

---

## Next Steps for User

1. **First:** Check if you ran the seed.sql script in Supabase
2. **Second:** Restart the dev server (Ctrl+C, then npm run dev)
3. **Third:** Try editing a role again
4. If still not working, open browser DevTools (F12) and check the Console tab for error messages
