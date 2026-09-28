# LOOZARS® — Master Engineering Changelog

All meaningful architectural, structural, and code modifications are deterministically documented here.

## [Final Pre-Launch Audit & Security Hardening] — 2026-09-27

### Security Hardening & Secret Scans:
* **Automated Audit Suite (`scratch/final_production_audit.js`)**:
  * Implemented automated security scanner checking for server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `sb_secret_`), hardcoded passwords, and fake tracking numbers across all source files and the production `dist/` bundle.
  * Verified 0 occurrences of private server secrets in client bundle and React code.
* **Tracking & Manual Shipping Integrity**:
  * Removed all automatic placeholder tracking string generators (`EXP-DELHIVERY-...`) from `src/pages/CheckoutPage.jsx` and `src/pages/OrderConfirmationPage.jsx`.
  * Updated order confirmation to display real tracking and courier metadata only if populated in the database by an administrator, displaying "Preparing for dispatch" when pending.
* **Business Rule Validation**:
  * Verified unified shipping rule: Orders >= ₹2,000 → FREE; Orders < ₹2,000 → ₹99 flat fee across `ShopContext.jsx`, `orderService.js`, `create-order/index.ts`, and database schema.
* **SEO & Crawler Fundamentals**:
  * Created `public/robots.txt` disallowing private admin and checkout routes while allowing storefront pages.
  * Created `public/sitemap.xml` with canonical routes for search indexing.
* **Live System & Database Invariant Verification (`scratch/test_live_system.js`)**:
  * Verified catalog retrieval (4 products, 21 variants).
  * Verified non-negative stock invariant (`stock_quantity >= 0`).
  * Verified unauthorized mutation rejection on administrative RPCs (`adjust_variant_stock`).
* **Production Build**:
  * Clean `npm run build` compilation with **0 errors**.

---

## [Phase 10: Resend Transactional Email System] — 2026-09-27

### Added:
* **`supabase/migrations/20260927000010_transactional_email_events.sql`**:
  * Created `email_events` audit table with UUID primary keys, order reference, idempotency key unique constraint (`order_id_event_type`), recipient email, event type, status (`sent`, `failed`, `skipped`), provider message ID, error message, and metadata JSONB.
  * Configured RLS policies: read access for administrators only (`is_admin()`), write access restricted to service-role and server Edge Functions.
  * Implemented `record_email_event(...)` and `get_order_email_events(...)` RPCs.
* **`supabase/functions/_shared/email.ts`**:
  * Implemented editorial dark HTML email templates adhering to the Loozars visual identity (`#080808` obsidian background, `#EDE7DC` ivory typography, `#8E1717` crimson accents, clean monospace typography, zero fake marketing fluff).
  * Implemented pure plaintext fallbacks for all email templates to guarantee cross-client deliverability.
  * Implemented 4 transactional email templates:
    * `order_confirmation`: Dispatched upon server-side order creation with line items, size, quantity, shipping address, and pending status.
    * `payment_confirmation`: Dispatched upon verified Razorpay payment with payment ID, amount paid, and confirmed status.
    * `order_status` (`processing`, `shipped`, `delivered`): Dispatched on admin fulfillment updates with courier and AWB tracking details if available in database.
    * `order_cancellation`: Dispatched on order cancellation explaining stock release.
  * Implemented idempotent `sendTransactionalEmail(...)` dispatcher with non-blocking error handling and automatic `email_events` logging.
* **`supabase/functions/send-email/index.ts`**:
  * Dedicated Supabase Edge Function endpoint for dispatching transactional emails with authorization checks and CORS headers.
* **Integrated Non-Blocking Email Dispatchers**:
  * `supabase/functions/create-order/index.ts`: Automatically triggers `order_confirmation` email upon successful transaction commit.
  * `supabase/functions/verify-payment/index.ts`: Automatically triggers `payment_confirmation` email upon verified HMAC signature and order status transition.
  * `supabase/functions/razorpay-webhook/index.ts`: Triggers idempotent `payment_confirmation` email on `payment.captured` and `order.paid` webhooks.
  * `src/services/adminService.js`: Automatically triggers `sendOrderStatusEmail` upon admin status changes (`shipped`, `delivered`, `cancelled`).
* **`src/pages/admin/AdminOrderDetailModal.jsx`**:
  * Added real-time Transactional Email Audit Log section displaying sent/failed/skipped events, timestamps, and Resend provider IDs.
* **`scratch/test_resend_emails.js`**:
  * Verification test suite validating template builders, plaintext generators, idempotency keys, and live Resend API dispatch.

---

## [Phase 8: Admin Dashboard & Inventory Operations] — 2026-09-27

### Added:
* **`supabase/migrations/20260927000009_admin_operations.sql`**:
  * Implemented `adjust_variant_stock(p_variant_id, p_quantity_delta, p_reason)` atomic RPC.
  * Implemented `update_order_status(p_order_id, p_new_status, p_notes, p_tracking_number, p_courier_name)` RPC.
  * Implemented `get_admin_dashboard_metrics()` RPC aggregating revenue, order statuses, and low/out-of-stock SKU counts.
  * Implemented `update_product_admin()` RPC for transactional base price, sale price, active, and featured updates.
  * Implemented `manage_coupon()` RPC for validating and upserting promotion codes.
* **`src/services/adminService.js`**:
  * Implemented data-access methods: `fetchAdminDashboardMetrics()`, `fetchAdminOrders()`, `fetchAdminOrderDetail()`, `updateOrderStatus()`, `fetchAdminProducts()`, `createAdminProduct()`, `deleteAdminProduct()`, `updateAdminProduct()`, `fetchAdminInventory()`, `adjustVariantStock()`, `fetchInventoryLogs()`, `fetchAdminCoupons()`, `upsertCoupon()`.
* **`src/pages/admin/AdminPortal.jsx`**:
  * Created master tabbed dashboard with 6 specialized administrative sub-views (`Overview`, `Orders`, `Inventory`, `Products`, `Coupons`, `Audit Logs`).
