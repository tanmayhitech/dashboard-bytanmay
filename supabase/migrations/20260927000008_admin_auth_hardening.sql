-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 08: ADMIN AUTHENTICATION & ROLE HARDENING
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE
-- Tracks explicit administrator assignments linked directly to auth.users(id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'manager')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. HARDENED is_admin() FUNCTION
-- Evaluates admin role server-side through:
-- (A) Service role connection
-- (B) JWT app_metadata claims (set exclusively via service-role / auth API)
-- (C) Membership in the admin_users table
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role (backend functions / cron / scripts)
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
     coalesce(auth.jwt() ->> 'role', '') = 'service_role' OR
     coalesce(auth.role(), '') = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Unauthenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. JWT app_metadata role claims
  IF coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'superadmin', 'manager') THEN
    RETURN TRUE;
  END IF;

  IF coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = TRUE THEN
    RETURN TRUE;
  END IF;

  -- 4. Database admin_users table lookup
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 3. CLIENT RPC: check_is_admin()
-- Safe RPC allowing the frontend to verify whether the authenticated user has admin role
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_role TEXT := 'none';
BEGIN
  v_is_admin := is_admin();

  IF v_is_admin THEN
    SELECT role INTO v_role FROM admin_users WHERE user_id = auth.uid() LIMIT 1;
    IF v_role IS NULL THEN
      v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_authenticated', auth.uid() IS NOT NULL,
    'is_admin', v_is_admin,
    'user_id', auth.uid(),
    'role', v_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin TO anon;

-- ------------------------------------------------------------------------------
-- 4. ADMIN USERS RLS POLICIES
-- Only verified admins & service_role can read/manage admin_users table
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Superadmins and service_role can manage admin_users" ON admin_users;
CREATE POLICY "Superadmins and service_role can manage admin_users"
  ON admin_users FOR ALL
  USING (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'superadmin'
  )
  WITH CHECK (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'superadmin'
  );

-- ------------------------------------------------------------------------------
-- 5. SECURE ADMIN PROVISIONING HELPER (Service Role / SQL Console Only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION provision_admin_user(
  p_email TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Look up user in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please create the user in Supabase Auth first.', p_email;
  END IF;

  -- Upsert into admin_users
  INSERT INTO admin_users (user_id, role, notes)
  VALUES (v_user_id, p_role, 'Provisioned via provision_admin_user')
  ON CONFLICT (user_id) DO UPDATE
  SET role = p_role,
      updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION provision_admin_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION provision_admin_user FROM anon;
REVOKE EXECUTE ON FUNCTION provision_admin_user FROM authenticated;
GRANT EXECUTE ON FUNCTION provision_admin_user TO service_role;
