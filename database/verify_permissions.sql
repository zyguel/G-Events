-- ============================================
-- Test Script: Verify Permission Updates
-- ============================================
-- Run this BEFORE and AFTER updating permissions via the UI

-- 1. Check current permissions for "Core Member" role
SELECT 
    r.id as role_id,
    r.name as role_name,
    COUNT(rp.id) as permission_count,
    STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM "OrganizationRole" r
LEFT JOIN "OrganizationRolePermission" rp ON r.id = rp.organization_role_id
LEFT JOIN "OrganizationPermission" p ON rp.organization_permission_id = p.id
WHERE r.name = 'Core Member'
GROUP BY r.id, r.name;

-- 2. Detailed view of permissions by category
SELECT 
    r.name as role_name,
    p.category,
    p.name as permission_name,
    rp.id as assignment_id
FROM "OrganizationRole" r
JOIN "OrganizationRolePermission" rp ON r.id = rp.organization_role_id
JOIN "OrganizationPermission" p ON rp.organization_permission_id = p.id
WHERE r.name = 'Core Member'
ORDER BY p.category, p.name;

-- 3. Compare all roles and their permission counts
SELECT 
    r.name as role_name,
    COUNT(rp.id) as total_permissions
FROM "OrganizationRole" r
LEFT JOIN "OrganizationRolePermission" rp ON r.id = rp.organization_role_id
WHERE r.organization_id = 1
GROUP BY r.id, r.name
ORDER BY total_permissions DESC;

-- ============================================
-- Test Procedure:
-- ============================================
-- 1. Run these queries NOW to see current state
-- 2. Update permissions via the Management UI
-- 3. Run these queries AGAIN to verify changes
-- 4. The permission_count should change!
-- ============================================
