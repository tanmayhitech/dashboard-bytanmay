# System Workflows & Data Lifecycles
### E-Commerce Operating System & Creator Affiliate Engine
**Author / Creator**: Tanmay (`ecommerce-admin-engine-by-tanmay`)

---

## 1. 🛒 Customer Order & Inventory Lifecycle

This diagram illustrates what occurs from the moment a shopper clicks "Place Order" through database verification, deterministic inventory locking, and order fulfillment.

```mermaid
flowchart TD
    A[Customer Adds Items to Cart] --> B[Enter Shipping Details & Optional Coupon Code]
    B --> C{Payment Method Chosen}
    
    C -->|COD (Cash on Delivery)| D[Call create_order_transaction RPC]
    C -->|Online (UPI / Cards / NetBanking)| E[Initialize Gateway Session / Razorpay]
    
    E --> F[Customer Completes Payment]
    F --> G[Verify HMAC Signature on Server]
    G --> D
    
    D --> H[PostgreSQL FOR UPDATE Lock on Variants]
    H --> I{Stock Quantity >= Requested?}
    
    I -->|No| J[Rollback Transaction & Alert User 'Sold Out']
    I -->|Yes| K[Atomic Stock Decrement: stock - qty]
    
    K --> L[Generate Immutable Order Snapshot]
    L --> M[Record in orders Table]
    M --> N[Log Delta in inventory_logs Audit Table]
    
    N --> O{Was Coupon / Creator Code Applied?}
    O -->|Yes| P[Insert Row in influencer_commissions Table]
    O -->|No| Q[Emit Order Confirmed Event]
    P --> Q
    
    Q --> R[Admin Real-Time Sync & Thermal Bill Ready]
```

---

## 2. 🤝 Creator / Affiliate Attribution & Settlement Loop

This diagram maps how influencer links and discount codes generate trackable commissions with complete privacy preservation.

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Influencer (@creator)
    actor Shopper as Customer
    participant Frontend as Storefront / Cart
    participant Service as Order & Influencer Service
    participant Database as PostgreSQL Database
    actor Admin as Store Administrator

    Admin->>Database: Register Creator (Name, Handle, Rate: 8%, Code: CREATOR10)
    Creator->>Shopper: Shares promo code or affiliate link
    Shopper->>Frontend: Applies code CREATOR10 in Cart
    Frontend->>Service: validate_coupon('CREATOR10', subtotal)
    Service->>Database: Match active influencer record
    Database-->>Frontend: Discount Verified (-10%)
    
    Shopper->>Frontend: Places Order (₹2,000)
    Frontend->>Database: create_order_transaction(...)
    Database->>Database: Create order (#ORD-20260928-001)
    Database->>Database: Insert influencer_commissions (Order: #001, Amount: ₹160, Status: 'pending')
    
    Creator->>Service: Opens /creator Dashboard
    Service->>Database: get_influencer_dashboard_metrics()
    Note over Creator,Service: Customer phone, full address, and payment secrets are strictly masked
    Database-->>Creator: Displays: Total Orders (1), Pending Earnings (₹160)
    
    Admin->>Database: Dispatches Order & Marks Commission 'eligible' or 'paid'
    Database-->>Creator: Real-time update: Available for Payout / Settled
```

---

## 3. 📦 Admin Fulfillment & Commercial Invoicing Lifecycle

The state machine governing order status progression and official A4 invoice printing.

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer Checkout (Prepaid or Unverified)
    [*] --> Confirmed : COD Verified / Payment Captured
    
    Pending --> Confirmed : Payment Captured / Admin Manual Confirm
    Pending --> Cancelled : Customer/Admin Cancel (Stock Restored)
    
    Confirmed --> Processing : Warehouse Pick & Pack Started
    Confirmed --> Cancelled : Out of Stock / Customer Request
    
    Processing --> Shipped : Courier & Tracking ID Assigned
    Processing --> Cancelled : Exception Handling
    
    Shipped --> Delivered : Courier Proof of Delivery
    
    state Shipped {
        [*] --> GeneratePackingSlip
        GeneratePackingSlip --> PrintThermalA4 : Isolated Iframe Print Engine
        PrintThermalA4 --> SavePDF : Commercial Invoice Rendered
    }
    
    Delivered --> [*]
    Cancelled --> [*]
```

---

## 4. ⚡ Dual-Mode Architecture (Live Cloud vs Local Mode)

How the system transparently functions in production with Supabase and in local/demo environments without setup.

```mermaid
flowchart LR
    subgraph Client Application
        UI[Admin / Creator / Storefront UI]
        SVC[Services Layer: adminService, influencerService, orderService]
        CFG[src/config/brandConfig.js]
    end

    subgraph Mode Selector
        Check{Supabase Keys Configured?}
    end

    subgraph Mode A: Production Live
        SB[Supabase Client]
        PG[(PostgreSQL + RLS + RPC)]
        RT[Supabase Realtime Broadcast]
    end

    subgraph Mode B: Zero-Config Offline Fallback
        LS[(Browser LocalStorage Engine)]
        EVT[Window Custom Events: loozars_orders_updated]
    end

    UI --> SVC
    CFG --> UI
    SVC --> Check
    Check -->|Yes| SB --> PG
    PG --> RT --> UI
    Check -->|No| LS
    LS --> EVT --> UI
```

---

## 5. 👤 Customer CRM & Sizing Affinity Derivation Lifecycle

How the CRM calculates customer lifetime spend, sizing preference, and generates 1-click WhatsApp concierge links.

```mermaid
flowchart TD
    A[Order Confirmed] --> B[Aggregate Orders by Customer Email / Phone]
    B --> C[Calculate Total Lifetime Spend LTV & AOV]
    B --> D[Scan Line Items for Garment Sizes: XS, S, M, L, XL, XXL]
    D --> E[Derive Primary Sizing Affinity Profile: e.g. Size L Boxy Standard]
    
    C --> F[Populate Customer Dossier Record]
    E --> F
    
    F --> G{Admin Selects Outreach Action}
    G -->|VIP Drop Invite| H[Encode VIP drop secret URL + Customer Name]
    G -->|Order Tracking| I[Encode Courier Name + AWB Tracking Link]
    G -->|Sizing Consult| J[Encode Derived Sizing Preference]
    G -->|Gift Voucher| K[Encode Personal Voucher Code]
    
    H --> L[Generate 1-Click WhatsApp api.whatsapp.com URL]
    I --> L
    J --> L
    K --> L
    L --> M[Staff Launches WhatsApp Outreach with 1 Tap]
```

---

## 6. 📈 Studio Inventory Delta & Reason Auditing State Machine

How every stock adjustment is audited without silent decrements.

```mermaid
stateDiagram-v2
    [*] --> CurrentStock : Read Physical Inventory
    
    state CurrentStock {
        [*] --> InStock : units > 5
        [*] --> LowStock : 1 <= units <= 5
        [*] --> OutOfStock : units == 0
    }
    
    CurrentStock --> StockAdjustmentModal : Admin Clicks 'Adjust'
    
    state StockAdjustmentModal {
        [*] --> SelectMode : Add (+) / Deduct (-) / Set Exact
        SelectMode --> EnterQuantity : Compute Resulting Delta
        EnterQuantity --> SelectAuditReason : Restock / Damaged / Sample / Count Correction
    }
    
    StockAdjustmentModal --> ExecuteRPC : adjust_variant_stock_rpc()
    ExecuteRPC --> UpdateVariantsTable : Atomic DB Write
    ExecuteRPC --> InsertInventoryLog : Write Immutable Audit Entry
    InsertInventoryLog --> RealtimeBroadcast : Sync UI across open tabs
    RealtimeBroadcast --> [*]
```

---

### Developed with ❤️ by Tanmay (`by-tanmay`)
