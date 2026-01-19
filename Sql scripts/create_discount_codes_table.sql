-- Create discount_codes table for student/NHS discount management
-- This table tracks unique discount codes sent to verified users

CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "STUABC123" or "NHSXYZ789"
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('student', 'nhs')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who actually used it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL, -- Admin email who created it
    admin_notes TEXT, -- Verification method, student ID, etc.
    stripe_session_id VARCHAR(255), -- Link to Stripe session for tracking
    payment_completed BOOLEAN DEFAULT FALSE,
    payment_completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_user_id ON discount_codes(user_id);
CREATE INDEX idx_discount_codes_used_by ON discount_codes(used_by);
CREATE INDEX idx_discount_codes_type_used ON discount_codes(discount_type, used);
CREATE INDEX idx_discount_codes_created_at ON discount_codes(created_at DESC);

-- Add RLS policies
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all discount codes
CREATE POLICY "Admins can view all discount codes" ON discount_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_preferences.user_id = auth.uid() 
            AND user_preferences.is_admin = true
        )
    );

-- Policy: Users can only see their own discount codes
CREATE POLICY "Users can view their own discount codes" ON discount_codes
    FOR SELECT USING (
        user_id = auth.uid() OR used_by = auth.uid()
    );

-- Policy: Only admins can insert discount codes
CREATE POLICY "Admins can create discount codes" ON discount_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_preferences.user_id = auth.uid() 
            AND user_preferences.is_admin = true
        )
    );

-- Policy: System can update discount codes (for payment completion)
CREATE POLICY "System can update discount codes" ON discount_codes
    FOR UPDATE USING (
        auth.uid() IS NULL -- Service role updates
    );

-- Policy: No one can delete discount codes (keep for audit trail)
CREATE POLICY "No one can delete discount codes" ON discount_codes
    FOR DELETE USING (false);

-- Function to generate unique discount codes
CREATE OR REPLACE FUNCTION generate_discount_code(discount_type_param TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    random_part TEXT;
    new_code TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    -- Set prefix based on discount type
    IF discount_type_param = 'student' THEN
        prefix := 'STU';
    ELSIF discount_type_param = 'nhs' THEN
        prefix := 'NHS';
    ELSE
        RAISE EXCEPTION 'Invalid discount type: %', discount_type_param;
    END IF;
    
    -- Try to generate unique code
    LOOP
        attempt := attempt + 1;
        random_part := upper(substring(md5(random()::text), 1, 6));
        new_code := prefix || random_part;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM discount_codes WHERE code = new_code) THEN
            EXIT;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique discount code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired codes (optional cleanup job)
CREATE OR REPLACE FUNCTION cleanup_expired_discount_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete codes that expired more than 30 days ago and were never used
    DELETE FROM discount_codes 
    WHERE used = FALSE 
    AND expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE discount_codes IS 'Tracks unique discount codes for student and NHS staff verification';
