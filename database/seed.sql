-- ============================================
-- G-Events Initial Database Seed
-- ============================================
-- Run this in your Supabase SQL Editor to create:
-- 1. Default organization
-- 2. Initial roles (Admin, Core Member, Volunteer)
-- 3. Sample permissions
-- 4. First admin user
-- ============================================

-- Step 1: Create the default organization
INSERT INTO "Organization" (name, description)
VALUES ('My Organization', 'Default organization for G-Events')
ON CONFLICT DO NOTHING;

-- Step 2: Create initial roles
INSERT INTO "OrganizationRole" (organization_id, name, description)
VALUES 
    (1, 'Admin', 'Full system access with all permissions'),
    (1, 'Core Member', 'Full access to team features'),
    (1, 'Volunteer', 'Limited access for volunteers')
ON CONFLICT DO NOTHING;

-- Step 3: Create sample permissions
INSERT INTO "OrganizationPermission" (name, category)
VALUES 
    -- Event Creation
    ('Create Event', 'eventCreation'),
    ('Edit Event Details', 'eventCreation'),
    ('Manage Event Status', 'eventCreation'),
    ('Manage Tickets', 'eventCreation'),
    ('Manage Event Agenda', 'eventCreation'),
    
    -- Order Registration
    ('Add Attendee', 'orderRegistration'),
    ('Edit Attendee Details', 'orderRegistration'),
    ('Cancel Attendee Registration', 'orderRegistration'),
    ('View List of Attendees', 'orderRegistration'),
    ('Check In Attendees', 'orderRegistration'),
    ('Apply Discounts and Promo Codes', 'orderRegistration'),
    ('Manage Ticket Add-Ons', 'orderRegistration'),
    ('Send Emails', 'orderRegistration'),
    
    -- Breakout Session
    ('Create Breakout Sessions', 'breakoutSession'),
    ('Edit Breakout Sessions', 'breakoutSession'),
    ('Manage Breakout Session Attendance', 'breakoutSession'),
    
    -- Waitlist Management
    ('Manage Waitlist', 'waitlistManagement'),
    ('View Waitlist Queue', 'waitlistManagement'),
    
    -- E-Certificate
    ('Manage Certificate Issuance', 'eCertificate'),
    ('View E-Certificates', 'eCertificate'),
    
    -- Reporting
    ('View Reports', 'reporting'),
    ('Export Order Report', 'reporting'),
    
    -- Emails User Can Receive
    ('New Registrant Email', 'emailsUserCanReceive'),
    ('Waitlist Email', 'emailsUserCanReceive'),
    ('New Message or Inquiry From Attendee', 'emailsUserCanReceive')
ON CONFLICT DO NOTHING;

-- Step 4: Assign ALL permissions to Admin role
INSERT INTO "OrganizationRolePermission" (organization_role_id, organization_permission_id)
SELECT 
    (SELECT id FROM "OrganizationRole" WHERE name = 'Admin' AND organization_id = 1),
    id
FROM "OrganizationPermission"
ON CONFLICT DO NOTHING;

-- Step 5: Assign limited permissions to Core Member
INSERT INTO "OrganizationRolePermission" (organization_role_id, organization_permission_id)
SELECT 
    (SELECT id FROM "OrganizationRole" WHERE name = 'Core Member' AND organization_id = 1),
    id
FROM "OrganizationPermission"
WHERE name IN (
    'Create Event',
    'Edit Event Details',
    'Manage Tickets',
    'Add Attendee',
    'Edit Attendee Details',
    'View List of Attendees',
    'Check In Attendees',
    'View Reports'
)
ON CONFLICT DO NOTHING;

-- Step 6: Assign minimal permissions to Volunteer
INSERT INTO "OrganizationRolePermission" (organization_role_id, organization_permission_id)
SELECT 
    (SELECT id FROM "OrganizationRole" WHERE name = 'Volunteer' AND organization_id = 1),
    id
FROM "OrganizationPermission"
WHERE name IN (
    'View List of Attendees',
    'Check In Attendees'
)
ON CONFLICT DO NOTHING;

-- Step 7: Create your first admin user
-- IMPORTANT: Replace the email and name with your actual details
INSERT INTO "User" (name, email)
VALUES ('Admin User', 'emanuelray23@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Step 8: Assign admin user to organization with Admin role
INSERT INTO "OrganizationUserRole" (organization_id, user_id, organization_role_id)
VALUES (
    1, -- organization_id
    (SELECT id FROM "User" WHERE email = 'emanuelray23@gmail.com'),
    (SELECT id FROM "OrganizationRole" WHERE name = 'Admin' AND organization_id = 1)
)
ON CONFLICT DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the data was inserted correctly:

-- Check organization
-- SELECT * FROM "Organization";

-- Check roles
-- SELECT * FROM "OrganizationRole";

-- Check permissions
-- SELECT * FROM "OrganizationPermission";

-- Check admin user
-- SELECT u.*, our.*, orole.name as role_name
-- FROM "User" u
-- JOIN "OrganizationUserRole" our ON u.id = our.user_id
-- JOIN "OrganizationRole" orole ON our.organization_role_id = orole.id
-- WHERE u.email = 'admin@example.com';

-- Check role permissions count
-- SELECT 
--     orole.name as role_name,
--     COUNT(orp.id) as permission_count
-- FROM "OrganizationRole" orole
-- LEFT JOIN "OrganizationRolePermission" orp ON orole.id = orp.organization_role_id
-- WHERE orole.organization_id = 1
-- GROUP BY orole.id, orole.name;
