-- Session tracking table for secure "Remember Me" implementation
-- Tracks user sessions with persistence flag and expiry

CREATE TABLE IF NOT EXISTS "UserSession" (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supabase_session_id TEXT, -- Optional: track Supabase session if needed
    is_persistent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    UNIQUE(user_id, created_at) -- Prevent duplicate sessions at exact same time
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON "UserSession"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_expires ON "UserSession"(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_session_active ON "UserSession"(user_id, is_revoked, expires_at);

-- RLS policies for security
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" 
    ON "UserSession" 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Only service role can insert/update (via API)
CREATE POLICY "Service role can manage sessions" 
    ON "UserSession" 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Function to clean up expired sessions (run via cron or periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "UserSession" 
    WHERE expires_at < NOW() 
       OR (is_revoked = true AND revoked_at < NOW() - INTERVAL '24 hours');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate if a session is active
CREATE OR REPLACE FUNCTION is_session_active(p_user_id UUID, p_session_id INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_active BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM "UserSession"
        WHERE user_id = p_user_id
          AND is_revoked = false
          AND expires_at > NOW()
          AND (p_session_id IS NULL OR id = p_session_id)
        ORDER BY created_at DESC
        LIMIT 1
    ) INTO v_is_active;
    
    RETURN v_is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
