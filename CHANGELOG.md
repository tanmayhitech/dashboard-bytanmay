# LOOZARS® — Master Engineering Changelog

All meaningful architectural, structural, and code modifications are deterministically documented here.

## [v2.5: Luxury Atelier Admin Suite & CRM Architecture] — 2026-09-29

### Luxury Atelier Admin Visual Redesign (SSENSE / Linear Standard):
* **High-End Monochrome Design Language**:
  * Replaced all vibrant/garish saturated badge colors and emojis with a 90% matte monochrome studio aesthetic (`#0a0a0a` background, `#121212` surface, `#262626` borders, `#f5f5f5` typography).
  * Implemented sub-1px micro-dot status badges (`● pending`, `● confirmed`, `● shipped`, `● delivered`) with crisp muted color accents.
  * Standardized primary administrative actions to solid white CTA buttons (`bg-white text-black font-semibold hover:bg-neutral-200`) and subtle outline buttons.
  * Added active white bottom indicators and pill selectors across all tab navigation bars.

### Keyboard-Driven Command Palette (`⌘K`):
* Implemented `⌘K` / `Ctrl+K` Global Quick Switcher modal in `AdminPortal.jsx`.
* Allows instant keyboard navigation across all 7 management modules, search filtering, and one-key shortcuts (`1`–`7`).

### Customer Intelligence & CRM Dossier System:
* **`src/pages/admin/AdminCRM.jsx` & `src/pages/admin/AdminCustomerDossierModal.jsx`**:
  * Dedicated Customer Relationship Management suite with automated Sizing Affinity derivation (identifies customer's dominant clothing size based on order frequency).
  * Metrics calculation: Customer Lifetime Value (LTV), Average Order Value (AOV), Total Orders count, and Last Order timestamp.
  * Customer segmentation: `VIP / High-Value` (LTV > ₹10,000 or >3 orders), `Returning`, `First-Time Buyer`.
  * Administrative customer note timeline with author timestamps, VIP whitelisting toggle, and order history drilldown.
* **`src/services/crmService.js`**:
  * Added CRM data layer with fallback mock derivation when running without live Supabase connection.

### Studio Inventory Delta Auditing:
* **`src/pages/admin/AdminInventory.jsx` & `StockAdjustModal.jsx`**:
  * Standardized stock modification into structured Delta Adjustments (`RESTOCK`, `DAMAGE_WRITE_OFF`, `AUDIT_CORRECTION`, `SAMPLE_GIFT`).
  * Enforces mandatory audit reason entry and atomic non-negative database constraints.

### Thermal Packing Slip Generator:
* **`src/components/admin/ThermalPackingSlipModal.jsx`**:
  * Implemented 1-click printable 4x6" thermal adhesive packing slip generator for warehouse fulfillment.
  * Includes scannable order QR code, courier metadata, itemized SKU/Size checklist, and COD collection callouts.

### Data Privacy & Multi-Tenancy Architecture:
* **Zero PII Leakage Guarantee**:
  * Hardened `.gitignore` and verified zero production customer data, secrets, or API keys in git history.
  * Sanitized database setup script (`supabase/complete_schema_and_seed.sql`) with synthetic seed data (*John Doe, #LZR-1001*).

---

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
