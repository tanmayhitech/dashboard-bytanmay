-- ==============================================================================
-- LOOZARS® — RESET / PROVISION ADMIN ACCOUNT: tanmayyadavbca@gmail.com
-- Sets password to 'admin1234' with verified superadmin privileges
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'tanmayyadavbca@gmail.com';
  v_password TEXT := 'admin1234';
  v_encrypted_pw TEXT;
BEGIN
  -- Generate bcrypt password hash
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  -- Look for existing user in auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE lower(email) = lower(trim(v_email));

  IF v_user_id IS NOT NULL THEN
    -- Update existing user password and admin role
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, timezone('utc'::text, now())),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"superadmin","is_admin":true,"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name":"Tanmay Yadav"}'::jsonb,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_user_id;

    RAISE NOTICE 'Successfully reset password for % to %', v_email, v_password;
  ELSE
    -- Create new user in auth.users
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted_pw,
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"],"role":"superadmin","is_admin":true}'::jsonb,
      '{"name":"Tanmay Yadav"}'::jsonb,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );

    -- Create matching identity record for Supabase Auth
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      timezone('utc'::text, now()),
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );

    RAISE NOTICE 'Successfully created new admin user % with password %', v_email, v_password;
  END IF;

  -- Ensure record in public.admin_users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) THEN
    INSERT INTO public.admin_users (user_id, role, notes)
    VALUES (v_user_id, 'superadmin', 'Primary Administrator Account')
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'superadmin',
        updated_at = timezone('utc'::text, now());
  END IF;

END $$;
