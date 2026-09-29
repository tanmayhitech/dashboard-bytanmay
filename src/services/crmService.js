import { getStoredOrders, formatOrderNumber } from './orderService.js';
import { fetchAdminOrders } from './adminService.js';
import { getStoredInfluencers } from './influencerService.js';

/**
 * LOOZARS® Customer Relationship Management (CRM) Service
 * Manages customer 360 dossiers, tier segmentation, VIP whitelisting,
 * internal atelier staff notes, 1-click concierge outreach, and analytics.
 */

const CRM_METADATA_STORAGE_KEY = 'loozars_crm_metadata_v1';

// Sample seed customers for initial state and offline resilience
const SEED_CUSTOMERS = [
  {
    id: 'cust_tanmay_01',
    name: 'Tanmay Yadav',
    email: 'tanmayyadavbca@gmail.com',
    phone: '+91 98765 43210',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    pincode: '208001',
    address_line: 'Civil Lines, Atelier Studio Hub',
    is_vip: true,
    tags: ['VIP Whitelist', 'Kanpur Local', 'Founding Member', 'Drop 01 Collector'],
    notes: [
      {
        id: 'note_01',
        text: 'Founding atelier supporter. Prefers XL Box-Fit silhouettes and express courier handoff in Kanpur.',
        author: 'Atelier Lead',
        createdAt: '2026-08-15T10:30:00Z'
      },
      {
        id: 'note_02',
        text: 'Requested early sample preview of upcoming Drop 02 racing outerwear.',
        author: 'Admin',
        createdAt: '2026-09-10T14:15:00Z'
      }
    ],
    sample_orders: [
      {
        order_number: 'LZR-0001',
        created_at: '2026-09-01T18:20:00Z',
        total_amount: 5998,
        order_status: 'delivered',
        payment_status: 'paid',
        items: [
          { name: 'LZR VELO 07 RACING TEE', size: 'XL', quantity: 1, price: 2999 },
          { name: 'LZR RACING DIVISION BURGUNDY', size: 'XL', quantity: 1, price: 2999 }
        ]
      },
      {
        order_number: 'LZR-0002',
        created_at: '2026-09-18T21:05:00Z',
        total_amount: 8997,
        order_status: 'delivered',
        payment_status: 'paid',
        items: [
          { name: 'LZR APEX CLUB OFF-WHITE', size: 'XL', quantity: 2, price: 5998 },
          { name: 'LZR OCEAN SPEEDWAY NAVY', size: 'XL', quantity: 1, price: 2999 }
        ]
      }
    ]
  },
  {
    id: 'cust_kabir_02',
    name: 'Kabir Verma',
    email: 'kabir.verma@speedway.in',
    phone: '+91 91234 56789',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    address_line: 'Bandra West, Hill Road',
    is_vip: true,
    tags: ['VIP Whitelist', 'High Spender', 'Motorsport Enthusiast'],
    notes: [
      {
        id: 'note_03',
        text: 'Collector of motorsport jerseys. Attends track sessions regularly.',
        author: 'Admin',
        createdAt: '2026-09-05T12:00:00Z'
      }
    ],
    sample_orders: [
      {
        order_number: '#LZR-20260828-4412',
        created_at: '2026-08-28T16:40:00Z',
        total_amount: 5998,
        order_status: 'delivered',
        payment_status: 'paid',
        items: [
          { name: 'LZR VELO 07 RACING TEE', size: 'L', quantity: 2, price: 5998 }
        ]
      },
      {
        order_number: '#LZR-20260920-7719',
        created_at: '2026-09-20T19:15:00Z',
        total_amount: 2999,
        order_status: 'shipped',
        payment_status: 'paid',
        items: [
          { name: 'LZR APEX CLUB OFF-WHITE', size: 'L', quantity: 1, price: 2999 }
        ]
      }
    ]
  },
  {
    id: 'cust_aisha_03',
    name: 'Aisha Malhotra',
    email: 'aisha.m@atelierclub.co',
    phone: '+91 98111 22334',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    address_line: 'Connaught Place, Inner Circle',
    is_vip: false,
    tags: ['Repeat Collector', 'Editorial Stylist'],
    notes: [
      {
        id: 'note_04',
        text: 'Stylist for music videos. Loves oversized drape of 320 GSM cotton.',
        author: 'Admin',
        createdAt: '2026-09-12T11:20:00Z'
      }
    ],
    sample_orders: [
      {
        order_number: '#LZR-20260912-3391',
        created_at: '2026-09-12T14:30:00Z',
        total_amount: 5998,
        order_status: 'delivered',
        payment_status: 'paid',
        items: [
          { name: 'LZR RACING DIVISION BURGUNDY', size: 'M', quantity: 1, price: 2999 },
          { name: 'LZR OCEAN SPEEDWAY NAVY', size: 'M', quantity: 1, price: 2999 }
        ]
      }
    ]
  },
  {
    id: 'cust_aryan_04',
    name: 'Aryan Sengupta',
    email: 'aryan.sengupta@garage.io',
    phone: '+91 97444 88990',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    address_line: 'Indiranagar 100ft Road',
    is_vip: false,
    tags: ['First-Time Buyer'],
    notes: [],
    sample_orders: [
      {
        order_number: '#LZR-20260925-6110',
        created_at: '2026-09-25T20:10:00Z',
        total_amount: 2999,
        order_status: 'processing',
        payment_status: 'paid',
        items: [
          { name: 'LZR VELO 07 RACING TEE', size: 'L', quantity: 1, price: 2999 }
        ]
      }
    ]
  },
  {
    id: 'cust_rohan_05',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@gmail.com',
    phone: '+91 98222 11445',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411004',
    address_line: 'FC Road, Shivaji Nagar',
    is_vip: false,
    tags: ['At-Risk Buyer'],
    notes: [],
    sample_orders: [
      {
        order_number: '#LZR-20260714-1002',
        created_at: '2026-07-14T11:00:00Z',
        total_amount: 2999,
        order_status: 'delivered',
        payment_status: 'paid',
        items: [
          { name: 'LZR APEX CLUB OFF-WHITE', size: 'M', quantity: 1, price: 2999 }
        ]
      }
    ]
  }
];

/**
 * Retrieve all persistent CRM metadata (tags, custom notes, VIP overrides)
 */
export const getStoredCRMMetadata = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CRM_METADATA_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[crmService] Error parsing CRM metadata:', e);
    return {};
  }
};

/**
 * Save updated CRM metadata
 */
export const saveCRMMetadata = (metadata) => {
  if (typeof window === 'undefined' || !metadata) return;
  try {
    localStorage.setItem(CRM_METADATA_STORAGE_KEY, JSON.stringify(metadata));
    window.dispatchEvent(new CustomEvent('loozars_crm_updated'));
  } catch (e) {
    console.warn('[crmService] Error saving CRM metadata:', e);
  }
};

/**
 * Aggregates all orders into unified 360° Customer Profiles
 * Merges Supabase DB orders, local orders, and initial seed dossiers.
 */
export const fetchAllCustomers = async () => {
  try {
    // 1. Fetch all orders from admin service
    const ordersRes = await fetchAdminOrders({ limit: 1000 });
    const liveOrders = ordersRes?.orders || [];
    const metadata = getStoredCRMMetadata();

    // 2. Customer aggregation map (keyed by normalized email or phone)
    const customerMap = new Map();

    // Helper to get or create customer record
    const getCustomerKey = (email, phone, name) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (cleanEmail) return `email:${cleanEmail}`;
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone) return `phone:${cleanPhone}`;
      return `name:${(name || 'customer').trim().toLowerCase()}`;
    };

    // 3. Process Live Store Orders (excluding archived)
    liveOrders.forEach((order) => {
      if (order.is_archived || (order.notes || '').includes('[ARCHIVED]') || order.order_status === 'archived') {
        return;
      }
      const email = order.customer_email || order.shipping_address?.email || '';
      const phone = order.customer_phone || order.shipping_address?.phone || '';
      const name = order.customer_name || 
        `${order.shipping_address?.first_name || order.shipping_address?.firstName || ''} ${order.shipping_address?.last_name || order.shipping_address?.lastName || ''}`.trim() || 
        'Customer';

      const key = getCustomerKey(email, phone, name);
      const custId = `cust_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;

      const addr = order.shipping_address || {};
      const city = addr.city || 'Kanpur';
      const state = addr.state || 'Uttar Pradesh';
      const pincode = addr.pincode || addr.postal_code || addr.postalCode || '208001';
      const addressLine = addr.address1 || addr.address || addr.street || 'Atelier Delivery';

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: custId,
          key,
          name,
          email: email || 'No Email Recorded',
          phone: phone || 'No Phone Recorded',
          city,
          state,
          pincode,
          address_line: addressLine,
          orders: [],
          totalSpend: 0,
          paidSpend: 0,
          sizes: new Set(),
          productsPurchased: new Map(),
          couponsUsed: new Set(),
          attributedInfluencers: new Set(),
          firstOrderDate: order.created_at,
          lastOrderDate: order.created_at,
          is_vip: false,
          tags: [],
          notes: []
        });
      }

      const customer = customerMap.get(key);

      // Add order
      customer.orders.push({
        ...order,
        order_number: formatOrderNumber(order.order_number || order.orderNumber || order.orderId)
      });

      // Financials
      const amt = Number(order.total_amount || 0);
      customer.totalSpend += amt;
      if (order.payment_status === 'paid') {
        customer.paidSpend += amt;
      }

      // Date tracker
      if (new Date(order.created_at) < new Date(customer.firstOrderDate)) {
        customer.firstOrderDate = order.created_at;
      }
      if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.created_at;
        // Keep latest address
        customer.city = city || customer.city;
        customer.state = state || customer.state;
        customer.pincode = pincode || customer.pincode;
        customer.address_line = addressLine || customer.address_line;
        if (name && name !== 'Customer') customer.name = name;
      }

      // Items & Sizes
      const items = order.items || [];
      items.forEach((item) => {
        if (item.size) customer.sizes.add(item.size);
        const prodName = item.name || item.product_name || 'LOOZARS Garment';
        customer.productsPurchased.set(prodName, (customer.productsPurchased.get(prodName) || 0) + (item.quantity || 1));
      });

      // Coupons & Influencers
      if (order.coupon_code) customer.couponsUsed.add(order.coupon_code.toUpperCase());
      if (order.influencer_name) customer.attributedInfluencers.add(order.influencer_name);
    });

    // 4. Merge Seed Customers if needed
    SEED_CUSTOMERS.forEach((seed) => {
      const key = getCustomerKey(seed.email, seed.phone, seed.name);
      if (!customerMap.has(key)) {
        const seedTotalSpend = seed.sample_orders.reduce((sum, o) => sum + o.total_amount, 0);
        const sizes = new Set();
        const productsMap = new Map();

        seed.sample_orders.forEach((o) => {
          o.items.forEach((item) => {
            if (item.size) sizes.add(item.size);
            productsMap.set(item.name, (productsMap.get(item.name) || 0) + (item.quantity || 1));
          });
        });

        customerMap.set(key, {
          id: seed.id,
          key,
          name: seed.name,
          email: seed.email,
          phone: seed.phone,
          city: seed.city,
          state: seed.state,
          pincode: seed.pincode,
          address_line: seed.address_line,
          orders: seed.sample_orders,
          totalSpend: seedTotalSpend,
          paidSpend: seedTotalSpend,
          sizes,
          productsPurchased: productsMap,
          couponsUsed: new Set(),
          attributedInfluencers: new Set(),
          firstOrderDate: seed.sample_orders[0]?.created_at || new Date().toISOString(),
          lastOrderDate: seed.sample_orders[seed.sample_orders.length - 1]?.created_at || new Date().toISOString(),
          is_vip: seed.is_vip,
          tags: seed.tags || [],
          notes: seed.notes || []
        });
      }
    });

    // 5. Finalize Customer Objects with Segmentation & Saved Metadata
    const finalCustomers = Array.from(customerMap.values()).map((c) => {
      const savedMeta = metadata[c.id] || metadata[c.email] || {};

      const isVip = savedMeta.is_vip !== undefined ? savedMeta.is_vip : (c.is_vip || c.totalSpend >= 10000);
      const mergedTags = Array.from(new Set([...(c.tags || []), ...(savedMeta.tags || [])]));
      const mergedNotes = [...(c.notes || []), ...(savedMeta.notes || [])];

      // Determine Segment Tier
      let tier = 'first_time';
      const orderCount = c.orders.length;
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));

      if (isVip || c.totalSpend >= 10000) {
        tier = 'vip';
      } else if (orderCount >= 2) {
        tier = 'repeat';
      } else if (daysSinceLastOrder > 60) {
        tier = 'at_risk';
      }

      // Generate Initials
      const nameParts = (c.name || 'CU').trim().split(/\s+/);
      const initials = nameParts.length >= 2 
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : (nameParts[0].slice(0, 2) || 'LZ').toUpperCase();

      return {
        ...c,
        is_vip: isVip,
        tier,
        initials,
        tags: mergedTags,
        notes: mergedNotes,
        orderCount,
        aov: orderCount > 0 ? Math.round(c.totalSpend / orderCount) : 0,
        sizesList: Array.from(c.sizes),
        couponsList: Array.from(c.couponsUsed),
        influencersList: Array.from(c.attributedInfluencers),
        topProductsList: Array.from(c.productsPurchased.entries()).map(([name, qty]) => ({ name, qty })),
        orders: c.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      };
    });

    // Sort by Total Spend descending
    return finalCustomers.sort((a, b) => b.totalSpend - a.totalSpend);
  } catch (err) {
    console.error('[crmService] fetchAllCustomers error:', err);
    return [];
  }
};

/**
 * Toggle VIP status for a customer
 */
export const toggleCustomerVip = (customerId, isVip) => {
  const meta = getStoredCRMMetadata();
  meta[customerId] = {
    ...(meta[customerId] || {}),
    is_vip: isVip
  };
  saveCRMMetadata(meta);
  return true;
};

/**
 * Update tags for a customer
 */
export const updateCustomerTags = (customerId, tags) => {
  const meta = getStoredCRMMetadata();
  meta[customerId] = {
    ...(meta[customerId] || {}),
    tags: Array.isArray(tags) ? tags : []
  };
  saveCRMMetadata(meta);
  return true;
};

/**
 * Add an internal staff note to a customer dossier
 */
export const addCustomerNote = (customerId, noteText, author = 'Admin') => {
  if (!noteText || !noteText.trim()) return false;
  const meta = getStoredCRMMetadata();
  const existingNotes = meta[customerId]?.notes || [];

  const newNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    text: noteText.trim(),
    author: author || 'Admin',
    createdAt: new Date().toISOString()
  };

  meta[customerId] = {
    ...(meta[customerId] || {}),
    notes: [newNote, ...existingNotes]
  };

  saveCRMMetadata(meta);
  return newNote;
};

/**
 * Delete an internal staff note from a customer dossier
 */
export const deleteCustomerNote = (customerId, noteId) => {
  const meta = getStoredCRMMetadata();
  const existingNotes = meta[customerId]?.notes || [];

  meta[customerId] = {
    ...(meta[customerId] || {}),
    notes: existingNotes.filter(n => n.id !== noteId)
  };

  saveCRMMetadata(meta);
  return true;
};

/**
 * Generate 1-Click WhatsApp Direct Link with pre-formatted luxury streetwear templates
 */
export const generateWhatsAppUrl = (customer, templateType = 'vip_drop_invite', customParams = {}) => {
  const phone = (customer.phone || '').replace(/\D/g, '');
  const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
  const firstName = (customer.name || 'Collector').split(' ')[0];

  let message = '';

  switch (templateType) {
    case 'vip_drop_invite':
      message = `Hello ${firstName},\n\nThis is the LOOZARS® Atelier in Kanpur. As one of our recognized VIP collectors, you have been whitelisted for private early access to our upcoming limited release.\n\nExplore early: https://loozars.com/drops\nPasscode: LZR-VIP-${firstName.toUpperCase()}\n\n— LOOZARS® Atelier // Kanpur`;
      break;

    case 'order_tracking':
      const orderNum = customParams.orderNumber || customer.orders[0]?.order_number || '#LZR-CURRENT';
      const tracking = customParams.trackingNumber || 'Speedway Express';
      message = `Hello ${firstName},\n\nYour LOOZARS® order ${orderNum} has been processed and dispatched from our Kanpur Studio.\n\nTracking / Dispatch: ${tracking}\n\nThank you for wearing what shouldn't exist.\n— LOOZARS® Logistics Team`;
      break;

    case 'exclusive_voucher':
      const code = customParams.couponCode || `VIP-${firstName.toUpperCase()}-15`;
      message = `Greetings ${firstName},\n\nHere is your private, one-time 15% atelier voucher for your next order:\n\nCODE: *${code}*\nValid on all heavyweight silhouettes.\n\nShop the collection: https://loozars.com/shop\n— LOOZARS®`;
      break;

    case 'concierge_sizing':
    default:
      message = `Hello ${firstName},\n\nThis is the LOOZARS® Atelier Concierge. We noticed your interest in our 320 GSM heavyweight collection. If you need any assistance with box-fit sizing or custom styling, we're right here to help.\n\n— LOOZARS® Concierge`;
      break;
  }

  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
};

/**
 * Export Customer Data as downloadable CSV spreadsheet
 */
export const exportCustomersCSV = (customers = []) => {
  if (!customers || customers.length === 0) return;

  const headers = [
    'Customer ID',
    'Name',
    'Email',
    'Phone',
    'City',
    'State',
    'Pincode',
    'Total Spend (INR)',
    'Paid Spend (INR)',
    'Order Count',
    'AOV (INR)',
    'Tier',
    'VIP Whitelisted',
    'First Order Date',
    'Last Order Date',
    'Preferred Sizes',
    'Top Items',
    'Tags'
  ];

  const rows = customers.map((c) => [
    `"${c.id}"`,
    `"${c.name}"`,
    `"${c.email}"`,
    `"${c.phone}"`,
    `"${c.city}"`,
    `"${c.state}"`,
    `"${c.pincode}"`,
    c.totalSpend,
    c.paidSpend,
    c.orderCount,
    c.aov,
    `"${c.tier.toUpperCase()}"`,
    c.is_vip ? 'YES' : 'NO',
    `"${new Date(c.firstOrderDate).toLocaleDateString()}"`,
    `"${new Date(c.lastOrderDate).toLocaleDateString()}"`,
    `"${(c.sizesList || []).join(', ')}"`,
    `"${(c.topProductsList || []).map(p => `${p.name} (x${p.qty})`).join(' | ')}"`,
    `"${(c.tags || []).join(', ')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `LOOZARS_CRM_CUSTOMERS_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
