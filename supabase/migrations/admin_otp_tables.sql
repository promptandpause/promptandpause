-- Admin OTP Codes table for storing temporary OTP codes
CREATE TABLE IF NOT EXISTS public.admin_otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_otp_codes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_codes_email ON public.admin_otp_codes USING btree (email);

-- Admin Sessions table for storing active admin sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  admin_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sessions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions USING btree (session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON public.admin_sessions USING btree (email);

-- Enable RLS
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
CREATE POLICY "Service role full access on admin_otp_codes" ON public.admin_otp_codes
  FOR ALL USING (true);

CREATE POLICY "Service role full access on admin_sessions" ON public.admin_sessions
  FOR ALL USING (true);
