# E-Commerce Admin & Creator Operating System (Atelier Edition)
> **Repository**: `dashboard-bytanmay`  
> **Author / Creator**: **Tanmay** (`by-tanmay`)  
> **Design Philosophy**: Matte Luxury Atelier (SSENSE / Linear Studio Aesthetic)  
> **Architecture**: Headless React + Vite + Tailwind CSS + Supabase PostgreSQL  
> **License**: MIT • Version: 2.5 (Production Hardened)

A modular, brand-agnostic **E-Commerce Studio Command Center, Customer CRM Dossier System, Creator Affiliate Engine, and Invoicing Suite**.

Designed for instant portability: connect this complete administrative and affiliate engine into **any** modern e-commerce storefront in under 5 minutes with zero database restructuring and 100% data privacy.

---

## 🌟 Master Feature Suite

```
                                  LOOZARS® ATELIER ENGINE
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
┌──────────────┐  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│ Studio Admin │  │ Customer CRM │    │  Influencer  │    │  Inventory   │   │ Commercial   │
│ Operations   │  │   Dossiers   │    │   Affiliate  │    │    Matrix    │   │  Invoicing   │
└──────────────┘  └──────────────┘    └──────────────┘    └──────────────┘   └──────────────┘
```

### 1. 🛡️ Studio Command Center & Operations (`/admin`)
- **Atmospheric Overview Dashboard**: 4 matte KPI metric cards (Paid Revenue, Total Orders, Stock Status, Active Catalog) with monospace numerals and native emerald/sky Prepaid vs. COD split progress bar.
- **Order Pipeline Management**: Real-time lifecycle state machine (`Pending` $\rightarrow$ `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered` $\rightarrow$ `Cancelled`).
- **Global `⌘K` / `Ctrl+K` Search**: Instant keyboard shortcut search across customer names, emails, phone numbers, and formatted order IDs (`#LZR-1001`).
- **1-Click Copy Data**: Instant copy-to-clipboard for Order IDs, Customer phone numbers, emails, and Razorpay payment IDs with toast feedback.
- **COD Settlement Switch**: 1-click "Mark COD as Collected" button to convert cash-on-delivery shipments into confirmed revenue.

### 2. 👤 Customer CRM & VIP Dossier System (`/crm`)
- **Customer Financial LTV**: Tracks lifetime spend, completed order counts, and Average Order Value (AOV).
- **Automated Sizing Affinity Profile**: Calculates preferred garment size (e.g. *Size L Boxy Oversized*) across confirmed drop orders.
- **1-Click WhatsApp Concierge**: 4 pre-built tailored outreach templates:
  1. *VIP Secret Drop Whitelist Invite*
  2. *Order Handoff & Live Courier Tracking*
  3. *Atelier Member Exclusive Gift Voucher*
  4. *Custom Sizing & Boxy Fit Consult*
- **VIP Whitelist Badge**: 1-click toggle to promote top spenders to VIP status with studio silver badging.
- **Private Staff Notes & Custom Tags**: Timestamped staff notes (with author signatures) and custom tag chips (`#VIP`, `#Stylist`, `#HeavySpender`).
- **Verified Destination Records**: Displays recorded delivery addresses, cities, states, and PIN codes.

### 3. 🧥 Catalog & Size Variant Matrix (`/products`)
- **Garment Matrix**: Manage title, subtitle, base price, sale price, category, and drop collection.
- **Variant Stock Breakdown**: Size variant stock matrix (`XS`, `S`, `M`, `L`, `XL`, `XXL`) with instant live inventory counts.
- **Cloud Storage & Fast Upload**: Direct upload to Supabase Storage or direct image URLs.
- **Status Toggles**: 1-click switches for Storefront Visibility and Homepage Hero Featured slots.

### 4. 📈 Inventory Matrix & Audit Controls (`/inventory`)
- **Server-Authoritative SKU Tracking**: Real-time SKU tracking with available stock vs. reserved cart allocations.
- **Quick Stock Adjustment Modal**: Fast Add, Deduct, or Set Exact stock levels.
- **Mandatory Audit Reason Tagging**: Log reasons for every delta (*Restock, Damaged/Defective, Physical Count Correction, Sample Allocation, Return Inward*).
- **Automated Low-Stock Thresholds**: Instant visual alerts for variants with $\le 5$ units remaining.

### 5. 🤝 Creator & Influencer Affiliate Portal (`/influencer` & `/login`)
- **Dedicated Creator Dashboard**: Independent login for brand ambassadors with live metrics (Referred Revenue, Paid Orders, Earned Commission, Paid vs. Eligible balance).
- **1-Click Link & Code Sharing**: Creators can copy their custom coupon code (e.g. `ALEX10`) and affiliate shop link with one tap.
- **Privacy-First Customer Masking**: Buyer addresses, phone numbers, and payment secrets are strictly hidden from creator accounts.
- **Commission Settlement Ledger**: Admin can select multiple commissions and mark them as settled with UPI / UTR transaction reference IDs.
- **Barter Deliverables Tracker**: Log gifted clothes with internal cost and required deliverables (*e.g. 1 Reel + 1 Story*).

### 6. 🎟️ Promo Codes & Voucher Engine (`/coupons`)
- **Flexible Discount Rules**: Percentage off (`10% OFF`) or flat rupee discount (`₹200 OFF`).
- **Cart Constraints**: Minimum order spend, maximum discount cap, and total usage limit caps.
- **Expiry Datetime Scheduling**: Set exact launch and expiry dates for limited drops.

### 7. 🖨️ Retail Invoicing & Thermal Packing Slips
- **Commercial A4 Tax Invoice (210mm $\times$ 297mm)**: 2-Column Billed To / Shipped To layout, itemized table, tax breakdown, terms, and authorized signature.
- **Automated Number-to-Words Converter**: Converts total amounts to Indian Rupee currency words (*e.g. "Rupees Two Thousand Four Hundred Ninety-Nine Only"*).
- **Thermal Packing Slip Generator**: 1-click print-ready slips for fast warehouse order packing.
- **Isolated Iframe Print Engine**: Dedicated hidden iframe (`#loozars_invoice_print_frame`) with complete standalone CSS injection for crisp unclipped PDF saving.

---

## 🎨 Design System: Matte Luxury Atelier

The admin dashboard adheres to a strict **Linear / SSENSE luxury atelier aesthetic**:
* **90% Architectural Monochrome**: Canvas (`#0C0C0F`), Panels (`#141418`), Borders (`#22222C`), and Text (`#EDEDF0`).
* **High-Contrast White CTAs**: All primary submit buttons use high-contrast white (`bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl`).
* **Calm Micro-Dot Indicators**: Status badges rendered as calm static monospace micro-dots (`● Paid` in emerald, `● COD Pending` in sky, `○ Unpaid` in zinc) with **zero pulsing animations**.
* **Micro-Typography**: Monospace uppercase table headers (`text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-normal`).
* **Zero Emojis**: Clean, professional, 100% emoji-free UI across all management screens.

---

## 📁 Repository Structure

```
├── ADMIN_SYSTEM_BLUEPRINT.md    # Master architectural specification & 5 Golden Rules
├── PROJECT_WORKFLOWS.md         # Mermaid diagrams of Order, Commission & CRM Lifecycles
├── PROJECT_STATUS.md            # Production readiness checklist and verification audit
├── .env.example                 # Clean environment variable template (No secrets)
├── supabase/
│   ├── complete_schema_and_seed.sql # 1-Click PostgreSQL Schema, RLS & seed data
│   ├── schema.sql               # Core table definitions, foreign keys & indexes
│   └── migrations/              # Incremental SQL migration history
└── src/
    ├── config/
    │   └── brandConfig.js       # Central 1-click brand identity configuration
    ├── services/
    │   ├── adminService.js      # Orders, products, inventory control & metrics
    │   ├── crmService.js        # Customer LTV, sizing profiles & WhatsApp concierge
    │   ├── influencerService.js # Creator tracking, commission math & settlements
    │   ├── orderService.js      # Order snapshots, number formatting & persistence
    │   └── paymentService.js    # Razorpay & payment gateway handlers
    ├── context/
    │   ├── AdminFeedbackContext.jsx # Global toast notifications & action state
    │   └── ShopContext.jsx      # Storefront cart & navigation state
    ├── components/
    │   └── admin/
    │       └── ThermalPackingSlipModal.jsx # Warehouse thermal packing slip
    └── pages/
        ├── admin/               # Studio Command Center modules
        │   ├── AdminPortal.jsx  # Main navigation, ⌘K search & role authorization
        │   ├── AdminOverview.jsx# KPI metric cards & transaction feed
        │   ├── AdminOrders.jsx  # Orders management & thermal slip trigger
        │   ├── AdminOrderDetailModal.jsx # Order fulfillment & tracking
        │   ├── AdminProducts.jsx# Product catalog & stock matrix
        │   ├── AdminInventory.jsx # Real-time SKU stock matrix
        │   ├── AdminCRM.jsx     # Customer LTV leaderboard & filters
        │   ├── AdminCustomerDossierModal.jsx # Sizing profile & WhatsApp concierge
        │   ├── AdminInfluencers.jsx # Creator directory & payout settlements
        │   └── AdminCoupons.jsx # Promo codes & discount rules
        └── influencer/
            ├── InfluencerLoginPage.jsx # Ambassador authentication
            └── InfluencerPortal.jsx    # Live creator earnings dashboard
```

---

## 🚀 Quick Setup Guide (Any New Project)

### 1. Clone & Install
```bash
git clone https://github.com/tanmayhitech/dashboard-bytanmay.git
cd dashboard-bytanmay
npm install
```

### 2. 1-Click Database Setup (Supabase)
1. Create a free project on [supabase.com](https://supabase.com).
2. Open **SQL Editor** on the left navigation.
3. Paste the contents of `supabase/complete_schema_and_seed.sql` and click **Run**.

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your client keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 4. Launch Studio
```bash
npm run dev
```

---

## 🔒 Data Privacy & Security Architecture

1. **Zero Customer PII in Git**: Customer names, phone numbers, addresses, and transaction IDs live strictly inside your encrypted Supabase PostgreSQL database.
2. **Dual-Mode Offline Fallback**: If run without database credentials, the system automatically runs in safe **Offline Demo Mode** using synthetic sample data (*John Doe, #LZR-1001*).
3. **Row-Level Security (RLS)**: PostgreSQL enforces strict isolation so unauthorized visitors cannot read customer or creator records.

---

## 🔑 Default Demo & Access Paths

| Role | Email | Default Password | Access Path | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `tanmayyadavbca@gmail.com` | `admin1234` | `/admin` | Complete Studio Command Center & CRM |
| **Creator Ambassador** | `yushssbhd@gmail.com` | `123456` | `/influencer` | Creator Portal & Payout Tracker (Code: `KHAN10`) |

---

## 🧪 Build & Verification

```bash
# Verify production bundle compiles with 0 errors
npm run build

# Preview production build locally
npm run preview
```

---

## 👨‍💻 Author & Attribution

Developed with precision and care by **Tanmay** (`by-tanmay`).  
Architecture licensed under the MIT License. Available for modular commercial adaptation.
