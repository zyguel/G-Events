-- Add updated_at column to the Event table
ALTER TABLE "Event" 
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a generic trigger function that automatically updates the "updated_at" timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach the trigger to the Event table
DROP TRIGGER IF EXISTS update_event_updated_at ON "Event";
CREATE TRIGGER update_event_updated_at
BEFORE UPDATE ON "Event"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
