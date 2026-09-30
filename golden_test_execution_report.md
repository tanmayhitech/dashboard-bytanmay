# LOOZARS® — GOLDEN DATASET EXECUTION REPORT (PHASE 2)
**Execution Phase:** `PHASE 2 — CONTROLLED EXECUTION`  
**Execution Timestamp:** `2026-09-30T07:45:48.321Z`  
**Target Catalog Baseline:** 4 Master Silhouettes @ ₹899 base price (Intact & Unchanged)  
**Machine-Readable Raw Evidence:** [`golden_test_actual_results.json`](file:///c:/Users/Acer/OneDrive/Desktop/loozarss/golden_test_actual_results.json)  

---

## 1. Execution Overview & Counters

| Metric Dimension | Raw Actual System Count |
| :--- | :---: |
| **1. Number of Customers Processed** | **100** (`CUSTOMER-001` to `CUSTOMER-100`) |
| **2. Number of Scenarios Executed** | **35** (All 35 discrete behavioral scenarios) |
| **3. Number of Orders Created in Database** | **220** (`LZR-2001` to `LZR-2220`) |
| **4. Number of Mutations Performed** | **267** (Orders, inventory decrements, commissions, coupons) |
| **5. Number of Unexpected Failed Operations** | **0** |
| **6. Number of Intentionally Rejected Operations** | **2** (Captured in Rejection Log) |
| **7. Total Execution Duration** | **33.89 seconds** |

---

## 2. Database Record Counts Post-Execution

| Database Table / Entity | Live Row Count in Supabase | Status |
| :--- | :---: | :---: |
| `orders` | **220** | Active dataset populated |
| `product_variants` | **21** | Live SKU stock decrements recorded |
| `coupons` | **9** | Live redemption counters incremented |
| `influencer_commissions` | **17** | Attribution ledger populated |
| `products` | **4** | Preserved & untouched |

---

## 3. Live SKU Inventory Movements & Final Balances

| SKU Code | Starting Stock | Net Deducted Units | Final Live Stock in Database | Balance Verdict |
| :--- | :---: | :---: | :---: | :---: |
| `LZR-D01-01-XS` | 76 | 26 | **50** | `🟢 Positive` |
| `LZR-D01-01-S` | 15 | 2 | **13** | `🟢 Positive` |
| `LZR-D01-01-M` | 13 | 11 | **2** | `🟢 Positive` |
| `LZR-D01-01-L` | 34 | 26 | **8** | `🟢 Positive` |
| `LZR-D01-01-XL` | 15 | 4 | **11** | `🟢 Positive` |
| `LZR-D01-01-XXL` | 101 | 44 | **57** | `🟢 Positive` |
| `LZR-D01-02-S` | 15 | 14 | **1** | `🟢 Positive` |
| `LZR-D01-02-M` | 15 | 1 | **14** | `🟢 Positive` |
| `LZR-D01-02-L` | 11 | 8 | **3** | `🟢 Positive` |
| `LZR-D01-02-XL` | 9 | 2 | **7** | `🟢 Positive` |
| `LZR-D01-02-XXL` | 15 | 13 | **2** | `🟢 Positive` |
| `LZR-D01-03-XS` | 15 | 13 | **2** | `🟢 Positive` |
| `LZR-D01-03-S` | 15 | 3 | **12** | `🟢 Positive` |
| `LZR-D01-03-M` | 15 | 4 | **11** | `🟢 Positive` |
| `LZR-D01-03-L` | 12 | 5 | **7** | `🟢 Positive` |
| `LZR-D01-03-XL` | 15 | 14 | **1** | `🟢 Positive` |
| `LZR-D01-04-S` | 15 | 14 | **1** | `🟢 Positive` |
| `LZR-D01-04-M` | 15 | 4 | **11** | `🟢 Positive` |
| `LZR-D01-04-L` | 16 | 2 | **14** | `🟢 Positive` |
| `LZR-D01-04-XL` | 15 | 14 | **1** | `🟢 Positive` |
| `LZR-D01-04-XXL` | 15 | 14 | **1** | `🟢 Positive` |
| **TOTAL INVENTORY** | **467** | **238** | **229** | `🟢 Zero Negative Stock` |

---

## 4. Coupon Usage & Discount Actuals

| Coupon Code | Discount Type | Stored Rule | Times Used in DB | Rejected Invalid Attempts |
| :--- | :--- | :--- | :---: | :---: |
| `WELCOME10` | Percentage | 10% off (min ₹800) | **33** | 0 |
| `FLASH20` | Fixed | Flat ₹200 (min ₹1,798) | **1** | 0 |
| `RARE15` | Percentage | 15% off (min ₹1,500) | **2** | **1** (Min order threshold rejection) |
| `VIP20` | Percentage | 20% off (min ₹2,500) | **3** | 0 |
| `AARYAN10` | Percentage | 10% off (min ₹800) | **1** | 0 |
| `KHAN10` | Percentage | 10% off (min ₹800) | **1** | 0 |
| `ZARA15` | Percentage | 15% off (min ₹800) | **2** | 0 |
| `ROHAN10` | Percentage | 10% off (min ₹800) | **2** | 0 |
| `RHEA10` | Percentage | 10% off (min ₹800) | **11** | 0 |
| `EXPIRED50` | Percentage | Attempted Non-Existent | 0 | **1** (Expired/Invalid rejection) |

---

## 5. Payment & Order Lifecycle Outcomes

### A. Order Status Breakdown
- **Delivered:** `168 Orders`
- **Shipped:** `26 Orders`
- **Processing:** `4 Orders`
- **Pending:** `8 Orders`
- **Confirmed:** `0 Orders`
- **Cancelled:** `14 Orders` (All with inventory restoration)
- **Returns / Refunds Tagged:** `7 Orders`

### B. Payment Status Breakdown
- **Paid:** `177 Orders`
- **Pending Payments (COD & Unsettled):** `31 Orders`
- **Failed Payments:** `6 Orders`
- **Refunded Payments:** `6 Orders`

---

## 6. Influencer Commissions & Affiliate Ledger

| Affiliate Metric | Raw System Value |
| :--- | :---: |
| **Total Attributed Commission Records** | **17** |
| **Total Accrued Commission Value** | **₹1,262.00** |
| **Eligible / Settled Commissions (Delivered)** | **14** |
| **Pending Commissions (In-Transit)** | **2** |
| **Reversed Commissions (Cancelled / Returned)** | **1** |

---

## 7. Product Reviews & Abandoned Carts Log

### A. Abandoned Carts
- **Total Carts Initiated:** `4`
- **Permanently Abandoned (Unrecovered):** `2` (`CUSTOMER-032`, `CUSTOMER-033`)
- **Concierge Contacted & Recovered:** `2` (`CUSTOMER-034`, `CUSTOMER-035` $\rightarrow$ `LZR-2037`, `LZR-2038`)

### B. Product Reviews
- **Verified Buyer Reviews Submitted:** `2` (5★ on `LZR-D01-01-XXL`)
- **Unverified / Pre-Delivery Review Attempts Blocked:** `2` (`CUSTOMER-042`, `CUSTOMER-043`)

---

## 8. Admin Analytics Live Metrics

*These numbers reflect the live output calculated by the Admin Portal service layer over the 220 executed records:*

| Admin Portal Metric | Raw Live Value | Raw Display Format |
| :--- | :---: | :---: |
| **Total Non-Archived Orders** | `220` | `220` |
| **Paid Settled Orders** | `177` | `177` |
| **Paid Revenue** | `180371` | **₹1,80,371** |
| **Gross Revenue** | `207747` | **₹2,07,747** |
| **Average Order Value (AOV)** | `1019` | **₹1,019** |
| **Prepaid Payment Orders** | `177` | `80%` |
| **Cash on Delivery (COD) Orders** | `43` | `20%` |

---

## 9. Intentionally Rejected Operations Log

| # | Operation Attempted | Target Code / Entity | Customer ID | Actual System Rejection Message |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `COUPON_APPLY` | `EXPIRED50` | `CUSTOMER-024` | `Coupon does not exist or has expired` |
| 2 | `COUPON_APPLY` | `RARE15` | `CUSTOMER-025` | `Subtotal ₹899 does not meet minimum order requirement of ₹1500` |

---

## 10. Application Errors & Unexpected Behavior

- **Application Exceptions During Execution:** `0`
- **Database Connection Errors:** `0`
- **Negative Stock Anomalies:** `0` (Lowest ending SKU stock is 1 unit, highest is 57 units)
- **Data Serialization:** Verified complete and saved to `golden_test_actual_results.json`.

---

**Phase 2 Execution Status:** `COMPLETE & FROZEN`  
*Phase 2 ends here. Awaiting external oracle verification.*
