-- ==============================================================================
-- LOOZARS® PHASE 10: ADMIN AUDIT LOGS & ACTION PROPAGATION TRACKING
-- ==============================================================================

-- 1. Create table for persistent admin action audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    duration_ms INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast queries by entity, admin, and recency
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action_type);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Ensure is_admin() helper function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
     coalesce(auth.jwt() ->> 'role', '') = 'service_role' OR
     coalesce(auth.role(), '') = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Unauthenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. JWT claims
  IF coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'superadmin', 'manager') THEN
    RETURN TRUE;
  END IF;

  IF coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = TRUE THEN
    RETURN TRUE;
  END IF;

  -- 4. Database admin_users table check (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. RLS Policies
-- Superadmins and Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
    );

-- Superadmins and Admins can insert audit logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
    ON public.admin_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
    );

-- 3. RPC for authoritative admin action logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_duration_ms INTEGER DEFAULT 0,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_is_adm BOOLEAN;
    v_admin_email TEXT;
    v_log_id UUID;
BEGIN
    -- Verify active admin session
    v_is_adm := public.is_admin();

    IF NOT v_is_adm THEN
        RAISE EXCEPTION 'Unauthorized: Only verified admin users can create audit logs.';
    END IF;

    -- Extract admin email from JWT claim or auth.users
    v_admin_email := coalesce(
        auth.jwt() ->> 'email',
        (SELECT email FROM auth.users WHERE id = auth.uid())
    );

    -- Insert log
    INSERT INTO public.admin_audit_logs (
        admin_user_id,
        admin_email,
        action_type,
        entity_type,
        entity_id,
        status,
        duration_ms,
        details,
        error_message
    ) VALUES (
        auth.uid(),
        v_admin_email,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_status,
        p_duration_ms,
        COALESCE(p_details, '{}'::jsonb),
        p_error_message
    ) RETURNING id INTO v_log_id;

    RETURN jsonb_build_object(
        'success', true,
        'log_id', v_log_id,
        'created_at', timezone('utc'::text, now())
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;
