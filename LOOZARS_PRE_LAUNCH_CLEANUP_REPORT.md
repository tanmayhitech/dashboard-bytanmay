# LOOZARS® — PRE-LAUNCH GOLDEN DATA CLEANUP & PRODUCTION BASELINE REPORT

**Target Environment:** Supabase Cloud PostgreSQL (`dfxmudxuqwsxdtimtqqa.supabase.co`)  
**Execution Timestamp:** 2026-09-30T13:51:55+05:30  
**Audit Scope:** Dependency-Safe Synthetic Golden Dataset Purge & Production Baseline Generation  
**Execution Status:** `🟢 100% COMPLETE & VERIFIED` (Zero schema mutations, Zero application code modifications)  

---

## A. Records Before Cleanup (Pre-Cleanup Audit)

Prior to deletion, all database records were quantified and verified as belonging to synthetic Golden Dataset test runs:

| Table / Entity | Pre-Cleanup Count | Record Classification |
| :--- | :---: | :--- |
| **`orders`** | **220** | Synthetic Golden Dataset test orders (`*@loozars-test.internal`) |
| **`influencer_commissions`** | **17** | Test commission attributions linked to synthetic promo orders |
| **`inventory_logs`** | **123** | Test order decrement and test restock movement logs |
| **`admin_audit_logs`** | **46** | Admin portal mutation test logs |
| **`products`** | **4** | Master silhouettes (Permanent catalog) |
| **`product_variants`** | **21** | Active SKUs & sizes (Permanent catalog) |
| **`coupons`** | **9** | Master promotional & creator policies (Permanent catalog) |
| **`influencers`** | **5** | Master creator profiles (Permanent catalog) |
| **`admin_users`** | **1** | Master Superadmin authorization role |
| **Total Inventory Units** | **237 Units** | Pre-cleanup inventory (467 starting units minus 230 test-consumed units) |

---

## B. Records Deleted (Dependency-Safe Sequence)

Deletions were executed in strict accordance with foreign-key dependency constraints to prevent cascade anomalies:

| Step # | Target Table | Deleted Count | Referential Rationale |
| :---: | :--- | :---: | :--- |
| **1** | `influencer_commissions` | **17 rows** | Breaks foreign-key dependency on `orders(id)` and `influencers(id)`. |
| **2** | `inventory_logs` | **123 rows** | Breaks foreign-key reference to synthetic `orders(id)`. |
| **3** | `admin_audit_logs` | **46 rows** | Purges test mutation history from admin activity. |
| **4** | `orders` | **220 rows** | Synthetic orders purged cleanly with 0 inbound foreign-key references. |
| **TOTAL** | **Synthetic Records Purged** | **406 rows** | **100% of synthetic test data removed.** |

---

## C. Records Preserved (Permanent Production Catalog & Configuration)

All legitimate catalog, creator, promotion, and administration records remain completely intact:

| Preserved Entity | Count | Status | Description |
| :--- | :---: | :---: | :--- |
| **Products** | **4** | `PRESERVED` | `LZR VELO 07`, `LZR RACING DIVISION`, `LZR APEX CLUB`, `LZR OCEAN SPEEDWAY` |
| **Product Variants / SKUs** | **21** | `PRESERVED` | All 21 sizes (`XS`, `S`, `M`, `L`, `XL`, `XXL`) mapped to the 4 master products |
| **Coupons** | **9** | `PRESERVED` | All 9 promo & creator codes intact (`times_used` reset to `0`) |
| **Influencers** | **5** | `PRESERVED` | `Yuuf Khan`, `Aaryan Sharma`, `Zara Mehra`, `Rohan Varma`, `Rhea Kapoor` |
| **Admin Users** | **1** | `PRESERVED` | Master Superadmin user RBAC role |
| **Database Schema** | **17 Migrations** | `PRESERVED` | Schema, table definitions, triggers, and functions unchanged |
| **Row-Level Security (RLS)** | **Active** | `PRESERVED` | All security policies and service-role barriers intact |

---

## D. Inventory Before and After Cleanup

Inventory consumed during the 220 Golden Dataset test orders (**230 units**) has been restored to the exact pre-test authoritative baseline:

| Product Silhouette | SKU | Size | Pre-Cleanup Stock | Restored Baseline Stock | Net Stock Adjustment |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **LZR VELO 07** | `LZR-D01-01-XS` | XS | 50 | **76** | +26 |
| **LZR VELO 07** | `LZR-D01-01-S` | S | 13 | **15** | +2 |
| **LZR VELO 07** | `LZR-D01-01-M` | M | 2 | **13** | +11 |
| **LZR VELO 07** | `LZR-D01-01-L` | L | 8 | **34** | +26 |
| **LZR VELO 07** | `LZR-D01-01-XL` | XL | 11 | **15** | +4 |
| **LZR VELO 07** | `LZR-D01-01-XXL` | XXL | 57 | **101** | +44 |
| **LZR RACING DIVISION** | `LZR-D01-02-S` | S | 0 | **15** | +15 |
| **LZR RACING DIVISION** | `LZR-D01-02-M` | M | 11 | **15** | +4 |
| **LZR RACING DIVISION** | `LZR-D01-02-L` | L | 3 | **11** | +8 |
| **LZR RACING DIVISION** | `LZR-D01-02-XL` | XL | 7 | **9** | +2 |
| **LZR RACING DIVISION** | `LZR-D01-02-XXL` | XXL | 2 | **15** | +13 |
| **LZR APEX CLUB** | `LZR-D01-03-XS` | XS | 2 | **15** | +13 |
| **LZR APEX CLUB** | `LZR-D01-03-S` | S | 12 | **15** | +3 |
| **LZR APEX CLUB** | `LZR-D01-03-M` | M | 11 | **15** | +4 |
| **LZR APEX CLUB** | `LZR-D01-03-L` | L | 7 | **12** | +5 |
| **LZR APEX CLUB** | `LZR-D01-03-XL` | XL | 0 | **15** | +15 |
| **LZR OCEAN SPEEDWAY** | `LZR-D01-04-S` | S | 1 | **15** | +14 |
| **LZR OCEAN SPEEDWAY** | `LZR-D01-04-M` | M | 11 | **15** | +4 |
| **LZR OCEAN SPEEDWAY** | `LZR-D01-04-L` | L | 14 | **16** | +2 |
| **LZR OCEAN SPEEDWAY** | `LZR-D01-04-XL` | XL | 13 | **15** | +2 |
| **LZR OCEAN SPEEDWAY** | `LZR-D01-04-XXL` | XXL | 2 | **15** | +13 |
| **TOTAL INVENTORY** | **21 SKUs** | — | **237 Units** | **467 Units** | **+230 Units Restored** |

---

## E. Database Integrity & Post-Cleanup Verification Checklist

| # | Verification Condition | Expected State | Actual Inspected State | Verdict |
| :---: | :--- | :---: | :---: | :---: |
| **01** | Synthetic Orders in Database | `0` | `0` | `🟢 PASS` |
| **02** | Synthetic Customer Records | `0` | `0` | `🟢 PASS` |
| **03** | Synthetic Returns / Refunds | `0` | `0` | `🟢 PASS` |
| **04** | Synthetic Influencer Commissions | `0` | `0` | `🟢 PASS` |
| **05** | Synthetic Abandoned Carts | `0` | `0` | `🟢 PASS` |
| **06** | Synthetic Reviews | `0` | `0` | `🟢 PASS` |
| **07** | Synthetic CRM / Customer Logs | `0` | `0` | `🟢 PASS` |
| **08** | Synthetic Audit Log Records | `0` | `0` | `🟢 PASS` |
| **09** | Orphan Database Records | `0` | `0` | `🟢 PASS` |
| **10** | Foreign-Key Violations | `0` | `0` | `🟢 PASS` |
| **11** | Duplicate SKU / Catalog Records | `0` | `0` | `🟢 PASS` |
| **12** | Negative Stock across any SKU | `0` | `0 (All SKUs >= 9)` | `🟢 PASS` |
| **13** | Master Product Count | `4` | `4` | `🟢 PASS` |
| **14** | Master Variant / SKU Count | `21` | `21` | `🟢 PASS` |
| **15** | Master Coupon Count | `9` | `9 (times_used = 0)` | `🟢 PASS` |
| **16** | Master Influencer Count | `5` | `5` | `🟢 PASS` |
| **17** | Admin RBAC Users Count | `1` | `1` | `🟢 PASS` |
| **18** | Total Starting Physical Inventory | `467 Units` | `467 Units` | `🟢 PASS` |

---

## F. Production Baseline After Cleanup

The live Supabase database is now in a pristine, zero-transaction launch state:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LOOZARS® PRODUCTION DATABASE BASELINE                                       │
├───────────────────────────────────────┬─────────────────────────────────────┤
│ • Products Catalog:                   │ 4 Master Silhouettes                │
│ • Active Product SKUs:                │ 21 SKUs across Sizes XS-XXL         │
│ • Total Physical Stock:               │ 467 Units                           │
│ • Active Promotional Policies:        │ 9 Coupons (All usage reset to 0)    │
│ • Creator Influencer Registry:        │ 5 Creator Affiliates                │
│ • Administrative RBAC Users:          │ 1 Superadmin User                   │
│ • Active Customer Orders:             │ 0 Orders (Pristine Launch State)    │
│ • Pending Returns / Refunds:          │ 0 Records                           │
│ • Attributed Commissions:             │ 0 Records                           │
│ • Unsettled Payments:                 │ 0 Records                           │
└───────────────────────────────────────┴─────────────────────────────────────┘
```

---

## G. Exact Verified Live Price & Checkout Calculation for `LZR-D01-01-S`

```
Product: LZR VELO 07
Database SKU: LZR-D01-01-S (Size S)
------------------------------------------------------------
Authoritative Unit Price:             ₹899.00
Quantity:                             1 Unit
Item Subtotal:                        ₹899.00
Applied Promo / Coupon:               ₹0.00 (None applied)
Net Order Subtotal:                   ₹899.00
Pan-India Standard Shipping (< ₹2k):  ₹99.00
------------------------------------------------------------
FINAL AUTHORITATIVE CHECKOUT TOTAL:   ₹998.00 (99,800 paise)
```

---

## H. Anomalies, Blockers & Final Launch Status

- **Database Anomalies Discovered:** `None`. All 21 SKUs strictly positive, 0 foreign-key errors, 0 orphans.
- **Code Modifications:** `None`. Zero application code was modified during this cleanup.
- **Launch Blockers:** `None`. The database is clean, verified, and structurally ready for public traffic.

> [!TIP]
> **Next Step:**  
> When ready to launch, import repository into Vercel, populate the 13 environment variables (with Live Razorpay credentials and Resend custom domain), and execute the single controlled real-money test order of **₹998.00**.
