-- Migration: Update BreakoutSession table with dedicated date/time columns and status
-- 1. Add session_date column (date type)
-- 2. Add status column with check constraint
-- 3. Ensure start_time and end_time are time without time zone type
-- 4. Migrate existing data from description JSON to new columns

-- Add new columns
ALTER TABLE public."BreakoutSession" 
ADD COLUMN IF NOT EXISTS session_date date,
ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'Not Started' NOT NULL CHECK (status IN ('Not Started', 'Ongoing', 'Completed', 'Cancelled'));

-- Migrate existing data from description JSON to new columns
UPDATE public."BreakoutSession"
SET 
    session_date = CASE 
        WHEN description IS NOT NULL AND description != '' THEN
            (CASE 
                WHEN description::jsonb->>'date' IS NOT NULL AND description::jsonb->>'date' != '' THEN
                    (description::jsonb->>'date')::date
                ELSE NULL
            END)
        ELSE NULL
    END,
    status = CASE 
        WHEN description IS NOT NULL AND description != '' THEN
            COALESCE(description::jsonb->>'status', 'Not Started')
        ELSE 'Not Started'
    END
WHERE session_date IS NULL;

-- Create function to auto-update status based on time
CREATE OR REPLACE FUNCTION public.calculate_breakout_session_status(
    p_session_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_current_status character varying
)
RETURNS character varying
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_now timestamp with time zone;
    v_session_start timestamp with time zone;
    v_session_end timestamp with time zone;
BEGIN
    -- If manually cancelled, keep it cancelled
    IF p_current_status = 'Cancelled' THEN
        RETURN 'Cancelled';
    END IF;
    
    -- If missing date, keep as Not Started
    IF p_session_date IS NULL THEN
        RETURN 'Not Started';
    END IF;
    
    -- Use current timestamp
    v_now := NOW();
    
    -- Build session timestamps
    v_session_start := (p_session_date || ' ' || COALESCE(p_start_time::text, '00:00:00'))::timestamp with time zone;
    v_session_end := (p_session_date || ' ' || COALESCE(p_end_time::text, '23:59:59'))::timestamp with time zone;
    
    -- If end time is before start time (crosses midnight), add a day to end
    IF p_end_time IS NOT NULL AND p_start_time IS NOT NULL AND p_end_time < p_start_time THEN
        v_session_end := v_session_end + INTERVAL '1 day';
    END IF;
    
    -- Determine status based on current time
    IF v_now < v_session_start THEN
        RETURN 'Not Started';
    ELSIF v_now >= v_session_start AND v_now <= v_session_end THEN
        RETURN 'Ongoing';
    ELSE
        RETURN 'Completed';
    END IF;
END;
$$;

-- Create view that returns calculated status
CREATE OR REPLACE VIEW public."BreakoutSessionWithStatus" AS
SELECT 
    bs.*,
    public.calculate_breakout_session_status(
        bs.session_date,
        bs.start_time::time without time zone,
        bs.end_time::time without time zone,
        bs.status
    ) as computed_status
FROM public."BreakoutSession" bs;

COMMENT ON COLUMN public."BreakoutSession".session_date IS 'The date of the breakout session';
COMMENT ON COLUMN public."BreakoutSession".status IS 'Session status: Not Started, Ongoing, Completed, or Cancelled (Cancelled is manual-only)';
