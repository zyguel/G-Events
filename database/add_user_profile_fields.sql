-- ============================================
-- Add User Profile Fields (gender, phone, location, department)
-- ============================================
-- This script adds optional profile fields to the User table
-- that are currently only stored in auth.users.user_metadata

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Add check constraint for valid gender values
ALTER TABLE "User"
ADD CONSTRAINT check_gender CHECK (
  gender IS NULL 
  OR gender IN ('male', 'female')
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_user_gender ON "User"(gender);

-- Add comments for clarity
COMMENT ON COLUMN "User".gender IS 'User gender preference (male or female)';
COMMENT ON COLUMN "User".phone IS 'User phone number';
COMMENT ON COLUMN "User".location IS 'User location (city, country)';
COMMENT ON COLUMN "User".department IS 'User department or team';
