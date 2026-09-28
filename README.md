# E-Commerce Admin & Creator Affiliate Operating System
> **Repository**: `ecommerce-admin-engine-by-tanmay`  
> **Author / Creator**: **Tanmay**  
> **License**: MIT  
> **Version**: 2.0 (Production Headless Architecture)

A modular, brand-agnostic **E-Commerce Admin Operating System, Influencer Affiliate Engine, and Market-Standard Invoicing Suite** built with React, Vite, Tailwind CSS, and Supabase PostgreSQL.

Designed for instant portability: plug this complete administrative and affiliate engine into **any** e-commerce frontend in under 5 minutes with zero database restructuring.

---

## 🌟 Key Capabilities

### 1. 🛡️ Command Center & Store Operations (`/admin`)
- **Real-Time Order Lifecycle Management**: View, filter, search, confirm, process, ship, deliver, or cancel orders.
- **Fulfillment & Logistics Hub**: Assign courier partners (BlueDart, Delhivery, DTDC, India Post) and tracking numbers with live customer updates.
- **Catalog & Inventory Engine**: Manage products, category collections, multi-size variants, and real-time inventory adjustments.
- **Dynamic Promo Codes**: Create percentage and fixed-amount coupon rules with minimum spend constraints and expiration dates.
- **Audit Logging**: Deterministic inventory audit trail logging every stock delta caused by checkouts, cancellations, or manual adjustments.

### 2. 🤝 Creator & Influencer Affiliate Portal (`/creator` & `/login`)
- **Dedicated Creator Dashboard**: Creator login with isolated views of earnings, referred orders, coupon usage, and commission metrics.
- **Privacy-First Customer Masking**: Customer street addresses, phone numbers, and payment transaction IDs are strictly masked to protect buyer privacy.
- **Flexible Collaboration Models**: Supports Paid (`%` or Fixed rate), Barter collaborations, and Hybrid agreements.
- **Commission Settlement Pipeline**: Real-time commission ledger tracking status across `pending` $\rightarrow$ `eligible` $\rightarrow$ `paid` $\rightarrow$ `reversed`.

### 3. 🖨️ Commercial Retail Invoice & Thermal Packing Slip Engine
- **Standard A4 Retail Invoice (210mm $\times$ 297mm)**: Commercial-grade invoice layout with 2-column Billed To / Shipped To addresses, itemized line items, tax breakdown, and terms.
- **Automated Number-to-Words Converter**: Automatically converts total amounts to official currency words (e.g. *"Rupees One Thousand One Hundred Seventy-Eight Only"*).
- **Isolated Iframe Print Engine**: Uses a dedicated, sandboxed hidden iframe (`#loozars_invoice_print_frame`) with complete standalone CSS injection to guarantee flawless, unclipped browser printing and Save-as-PDF rendering.

### 4. ⚡ 1-Click Universal Rebranding
- Change the brand name, legal entity, registered address, support contact, currency symbol, and shipping thresholds from a single file: `src/config/brandConfig.js`.

### 5. 🔄 Dual-Mode Architecture (Production Live + Offline Fallback)
- **Live Cloud Mode**: Direct connection to Supabase PostgreSQL with Row Level Security (RLS) policies and RPC stored procedures.
- **Zero-Config Offline Mode**: If database credentials are not supplied, the system automatically runs in simulated local mode with `localStorage` persistence and inter-tab event synchronization.

---

## 📁 Repository Structure

```
├── ADMIN_SYSTEM_BLUEPRINT.md   # Master architecture guide & 5 Golden Rules
├── PROJECT_WORKFLOWS.md        # Mermaid diagrams of order & commission lifecycles
├── PROJECT_STATUS.md           # Implementation status and milestone log
├── .env.example                # Environment variables template
├── supabase/
│   ├── schema.sql              # Master PostgreSQL schema, RLS, indexes & RPCs
│   ├── seed_demo_data.sql      # Clean starter coupons, creator & products
│   └── migrations/             # Incremental migration history
└── src/
    ├── config/
    │   └── brandConfig.js      # Central 1-click brand identity configuration
    ├── services/
    │   ├── adminService.js     # Admin operations & inventory control
    │   ├── influencerService.js# Creator affiliate tracking & commission math
    │   ├── orderService.js     # Order creation, snapshots & persistence
    │   └── paymentService.js   # Razorpay & payment gateway handlers
    ├── components/
    │   └── admin/
    │       └── ThermalPackingSlipModal.jsx # Commercial A4 invoice & print engine
    ├── pages/
    │   ├── admin/              # Admin dashboard, orders, inventory & creators
    │   ├── influencer/         # Creator portal & payout tracking
    │   └── auth/               # Unified login (Admin / Creator)
    └── context/
        ├── ShopContext.jsx     # Cart, checkout & catalog state
        ├── AdminContext.jsx    # Admin feedback & system state
        └── InfluencerContext.jsx # Creator authentication context
```

---

## 🚀 Quickstart Guide

### 1. Installation
```bash
git clone <your-repo-url>
cd ecommerce-admin-engine-by-tanmay
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 3. Setup Database (Supabase / PostgreSQL)
1. Open your Supabase Dashboard $\rightarrow$ **SQL Editor**.
2. Run `supabase/schema.sql` to initialize all tables, RLS policies, and stored procedures.
3. *(Optional)* Run `supabase/seed_demo_data.sql` to populate starter test data.

### 4. 1-Click Rebrand
Open `src/config/brandConfig.js` and set your brand details:
```javascript
export const BRAND_CONFIG = {
  brandName: 'YOUR_BRAND',
  legalName: 'Your Brand Private Limited',
  websiteUrl: 'https://www.yourbrand.com',
  supportEmail: 'support@yourbrand.com',
  currencySymbol: '₹',
  freeShippingThreshold: 2000,
  standardShippingFee: 99
};
```

### 5. Launch Development Server
```bash
npm run dev
```

---

## 🔑 Default Demo Accounts

| Role | Email | Password | Access Path |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `tanmayyadavbca@gmail.com` | `admin1234` | `/admin` |
| **Creator Partner** | `yushssbhd@gmail.com` | `123456` | `/creator` (Code: `KHAN10`) |

---

## 🧪 Build & Test Verification

```bash
# Verify build compiles with 0 errors
npm run build

# Verify preview
npm run preview
```

---

## 👨‍💻 Author & Attribution

Developed with precision and care by **Tanmay** (`ecommerce-admin-engine-by-tanmay`).  
Contributions and adaptations are welcome!
