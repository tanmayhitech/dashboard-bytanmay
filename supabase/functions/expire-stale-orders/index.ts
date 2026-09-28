// LOOZARS® Edge Function: expire-stale-orders
// Scheduled Worker for Expiring Abandoned Unpaid Orders & Restoring Stock

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database credentials missing.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security Verification: Require Service Role Authorization for Privileged RPC
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token !== supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Service role key required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let expiryMinutes = 60;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.expiryMinutes && typeof body.expiryMinutes === 'number' && body.expiryMinutes > 0) {
          expiryMinutes = Math.floor(body.expiryMinutes);
        }
      } catch {
        // Use default 60 minutes
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // Invoke Atomic Stale Order Expiry RPC
    const { data, error } = await supabaseAdmin.rpc('expire_stale_pending_orders', {
      p_expiry_minutes: expiryMinutes
    });

    if (error) {
      console.error('[expire-stale-orders] RPC execution error:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.info(`[expire-stale-orders] Completed successfully. Expired: ${data.expired_orders_count}, Restored units: ${data.restored_items_count}`);

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[expire-stale-orders] Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
