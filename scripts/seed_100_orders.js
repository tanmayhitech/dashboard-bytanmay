import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const clean = line.trim();
  if (clean && !clean.startsWith('#')) {
    const idx = clean.indexOf('=');
    if (idx !== -1) {
      env[clean.substring(0, idx).trim()] = clean.substring(idx + 1).trim();
    }
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connecting to Supabase at:', supabaseUrl);

// Products & Pricing from DROP 01 Catalog
const PRODUCTS_CATALOG = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'lzr-velo-07',
    sku: 'LZR-D01-01',
    name: 'LZR VELO 07',
    subtitle: 'Black Racing Tee',
    price: 899,
    category: 'tees',
    badge: 'DROP 01 / PIECE 01'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'lzr-racing-division',
    sku: 'LZR-D01-02',
    name: 'LZR RACING DIVISION',
    subtitle: 'Burgundy Racing Tee',
    price: 899,
    category: 'tees',
    badge: 'DROP 01 / PIECE 02'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    slug: 'lzr-apex-club',
    sku: 'LZR-D01-03',
    name: 'LZR APEX CLUB',
    subtitle: 'Off-White Racing Tee',
    price: 899,
    category: 'tees',
    badge: 'DROP 01 / PIECE 03'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    slug: 'lzr-ocean-speedway',
    sku: 'LZR-D01-04',
    name: 'LZR OCEAN SPEEDWAY',
    subtitle: 'Navy Racing Tee',
    price: 899,
    category: 'tees',
    badge: 'DROP 01 / PIECE 04'
  }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Influencers (matching constraints)
const SEED_INFLUENCERS = [
  {
    id: 'de2ec333-3a19-464a-8efa-922ec3819eed',
    name: 'Yuuf Khan',
    instagram_handle: 'khan',
    email: 'yushssbhd@gmail.com',
    phone: '+918352545132',
    collaboration_type: 'barter',
    coupon_code: 'KHAN10',
    customer_discount_type: 'percentage',
    customer_discount_value: 10.00,
    commission_type: 'percentage',
    commission_value: 8.00,
    is_active: true,
    notes: 'Creator partner onboarded for Drop 01 streetwear campaigns'
  },
  {
    id: 'a1111111-2222-3333-4444-555555555555',
    name: 'Aaryan Sharma',
    instagram_handle: 'aaryan_street',
    email: 'aaryan@creator.loozars.com',
    phone: '+919876543211',
    collaboration_type: 'paid',
    coupon_code: 'AARYAN10',
    customer_discount_type: 'percentage',
    customer_discount_value: 10.00,
    commission_type: 'percentage',
    commission_value: 8.00,
    is_active: true,
    notes: 'Key fashion creator - Drop 01 seeding partner'
  },
  {
    id: 'b2222222-3333-4444-5555-666666666666',
    name: 'Zara Mehra',
    instagram_handle: 'zaramehra_',
    email: 'zara@creator.loozars.com',
    phone: '+919876543222',
    collaboration_type: 'barter',
    coupon_code: 'ZARA15',
    customer_discount_type: 'percentage',
    customer_discount_value: 15.00,
    commission_type: 'percentage',
    commission_value: 5.00,
    is_active: true,
    notes: 'Barter collaboration: Sent 2 tees for photoshoot'
  },
  {
    id: 'c3333333-4444-5555-6666-777777777777',
    name: 'Rohan Varma',
    instagram_handle: 'rohan_speed',
    email: 'rohan@creator.loozars.com',
    phone: '+919876543233',
    collaboration_type: 'paid',
    coupon_code: 'ROHAN10',
    customer_discount_type: 'percentage',
    customer_discount_value: 10.00,
    commission_type: 'percentage',
    commission_value: 8.00,
    is_active: true,
    notes: 'Motorsport enthusiast and creator'
  },
  {
    id: 'd4444444-5555-6666-7777-888888888888',
    name: 'Rhea Kapoor',
    instagram_handle: 'rhea_fits',
    email: 'rhea@creator.loozars.com',
    phone: '+919876543244',
    collaboration_type: 'paid',
    coupon_code: 'RHEA10',
    customer_discount_type: 'percentage',
    customer_discount_value: 10.00,
    commission_type: 'percentage',
    commission_value: 10.00,
    is_active: true,
    notes: 'Fashion stylist & street curation'
  }
];

// Coupons
const SEED_COUPONS = [
  {
    code: 'WELCOME10',
    description: '10% off on your first LOOZARS drop order',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'FLASH20',
    description: 'Flat ₹200 off on orders above ₹1798',
    discount_type: 'fixed',
    discount_value: 200.00,
    min_order_amount: 1798,
    is_active: true
  },
  {
    code: 'RARE15',
    description: '15% exclusive drop discount',
    discount_type: 'percentage',
    discount_value: 15.00,
    min_order_amount: 1500,
    is_active: true
  },
  {
    code: 'KHAN10',
    description: '10% creator discount with Yuuf Khan',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'AARYAN10',
    description: '10% creator discount with Aaryan Sharma',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'ZARA15',
    description: '15% creator discount with Zara Mehra',
    discount_type: 'percentage',
    discount_value: 15.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'ROHAN10',
    description: '10% creator discount with Rohan Varma',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'RHEA10',
    description: '10% creator discount with Rhea Kapoor',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_amount: 800,
    is_active: true
  },
  {
    code: 'VIP20',
    description: '20% VIP collector appreciation discount',
    discount_type: 'percentage',
    discount_value: 20.00,
    min_order_amount: 2500,
    is_active: true
  }
];

// Customer base for repeat retention & geographic reach
const CUSTOMER_POOL = [
  {
    name: 'Tanmay Yadav',
    email: 'tanmayyadavbca@gmail.com',
    phone: '+919876543210',
    address_line1: 'Civil Lines, LOOZARS HQ 402',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    postal_code: '208001',
    is_vip: true
  },
  {
    name: 'Kabir Verma',
    email: 'kabir.verma@speedway.in',
    phone: '+919123456789',
    address_line1: 'Flat 12B, Sea Green Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
    is_vip: true
  },
  {
    name: 'Aisha Malhotra',
    email: 'aisha.m@loozarsclub.co',
    phone: '+919811122334',
    address_line1: 'A-45, Inner Circle, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    postal_code: '110001',
    is_vip: false
  },
  {
    name: 'Devansh Singhal',
    email: 'devansh.s@techpulse.io',
    phone: '+919988776655',
    address_line1: 'Villa 8, Prestige Palm Meadows, Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560066',
    is_vip: true
  },
  {
    name: 'Rohan Roy',
    email: 'rohan.roy@gmail.com',
    phone: '+919833445566',
    address_line1: '32/1, Ballygunge Circular Road',
    city: 'Kolkata',
    state: 'West Bengal',
    postal_code: '700019',
    is_vip: false
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@cochinstudio.com',
    phone: '+919744556677',
    address_line1: '4A, Skyline Imperial, Panampilly Nagar',
    city: 'Kochi',
    state: 'Kerala',
    postal_code: '682036',
    is_vip: true
  },
  {
    name: 'Aditya Joshi',
    email: 'aditya.joshi@punespeed.in',
    phone: '+919822331144',
    address_line1: 'Row House 14, Clover Park, Kalyani Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    postal_code: '411006',
    is_vip: true
  },
  {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@pinkcity.in',
    phone: '+919829012345',
    address_line1: 'B-28, C-Scheme, Ashok Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    postal_code: '302001',
    is_vip: false
  },
  {
    name: 'Vikramaditya Rathore',
    email: 'vikram.rathore@heritage.org',
    phone: '+919414055667',
    address_line1: 'Fateh Sagar View Apartments, Lake City',
    city: 'Udaipur',
    state: 'Rajasthan',
    postal_code: '313001',
    is_vip: true
  },
  {
    name: 'Neha Sengupta',
    email: 'neha.sengupta@saltlake.co',
    phone: '+919830112233',
    address_line1: 'Sector 5, Salt Lake City',
    city: 'Kolkata',
    state: 'West Bengal',
    postal_code: '700091',
    is_vip: false
  },
  {
    name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh@nagpur.in',
    phone: '+919890123456',
    address_line1: 'Ramdaspeth, Central Avenue',
    city: 'Nagpur',
    state: 'Maharashtra',
    postal_code: '440010',
    is_vip: false
  },
  {
    name: 'Siddharth Khurana',
    email: 'sid.khurana@chd.in',
    phone: '+919872012345',
    address_line1: 'House 512, Sector 8-B',
    city: 'Chandigarh',
    state: 'Punjab',
    postal_code: '160009',
    is_vip: true
  },
  {
    name: 'Riya Patel',
    email: 'riya.patel@ahmedabad.com',
    phone: '+919825012345',
    address_line1: '102, Bodakdev Towers, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postal_code: '380054',
    is_vip: false
  },
  {
    name: 'Harshavardhan Reddy',
    email: 'harsha.reddy@jubileehills.in',
    phone: '+919849012345',
    address_line1: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    postal_code: '500033',
    is_vip: true
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@adyar.in',
    phone: '+919840012345',
    address_line1: '7, Crescent Road, Gandhi Nagar, Adyar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postal_code: '600020',
    is_vip: false
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@surattextile.in',
    phone: '+919824012345',
    address_line1: 'Dumas Road, Vesu',
    city: 'Surat',
    state: 'Gujarat',
    postal_code: '395007',
    is_vip: false
  },
  {
    name: 'Sanjana Roy',
    email: 'sanjana.roy@hazratganj.in',
    phone: '+919415012345',
    address_line1: '15, Park Road, Hazratganj',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postal_code: '226001',
    is_vip: false
  },
  {
    name: 'Karan Johar',
    email: 'karan.johar@cybercity.in',
    phone: '+919810012345',
    address_line1: 'DLF Phase 5, Golf Course Road',
    city: 'Gurgaon',
    state: 'Haryana',
    postal_code: '122002',
    is_vip: true
  },
  {
    name: 'Divya Pillai',
    email: 'divya.pillai@kerala.org',
    phone: '+919447012345',
    address_line1: 'Kowdiar Avenue',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    postal_code: '695003',
    is_vip: false
  },
  {
    name: 'Aman Gupta',
    email: 'aman.gupta@sector62.in',
    phone: '+919818012345',
    address_line1: 'Tower 4, Express View Apartments, Sector 93',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postal_code: '201304',
    is_vip: false
  },
  {
    name: 'Ishaan Bhatt',
    email: 'ishaan.bhatt@rajpur.in',
    phone: '+919412012345',
    address_line1: 'Rajpur Road, Near Jakhan',
    city: 'Dehradun',
    state: 'Uttarakhand',
    postal_code: '248001',
    is_vip: false
  },
  {
    name: 'Pooja Banerjee',
    email: 'pooja.b@bengal.co',
    phone: '+919831012345',
    address_line1: 'Alipore Heights, Burdwan Road',
    city: 'Kolkata',
    state: 'West Bengal',
    postal_code: '700027',
    is_vip: false
  },
  {
    name: 'Varun Chopra',
    email: 'varun.chopra@ludhiana.in',
    phone: '+919814012345',
    address_line1: 'Model Town Ext., Mall Road',
    city: 'Ludhiana',
    state: 'Punjab',
    postal_code: '141002',
    is_vip: false
  },
  {
    name: 'Shreya Kulkarni',
    email: 'shreya.k@kothrud.in',
    phone: '+919850012345',
    address_line1: 'Mayur Colony, Kothrud',
    city: 'Pune',
    state: 'Maharashtra',
    postal_code: '411038',
    is_vip: false
  },
  {
    name: 'Yashwardhan Goenka',
    email: 'yash.goenka@indore.co',
    phone: '+919826012345',
    address_line1: 'Old Palasia, AB Road',
    city: 'Indore',
    state: 'Madhya Pradesh',
    postal_code: '452001',
    is_vip: true
  },
  {
    name: 'Natasha Sen',
    email: 'natasha.sen@assam.in',
    phone: '+919435012345',
    address_line1: 'GS Road, Christian Basti',
    city: 'Guwahati',
    state: 'Assam',
    postal_code: '781005',
    is_vip: false
  },
  {
    name: 'Gautam Singhania',
    email: 'gautam.s@worli.in',
    phone: '+919820012345',
    address_line1: 'Worli Sea Face, Tower 1',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400030',
    is_vip: true
  },
  {
    name: 'Tanya Kapoor',
    email: 'tanya.kapoor@arera.in',
    phone: '+919425012345',
    address_line1: 'E-3, Arera Colony',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    postal_code: '462016',
    is_vip: false
  },
  {
    name: 'Kartik Aaryan',
    email: 'kartik.aaryan@mp.in',
    phone: '+919406012345',
    address_line1: 'City Centre, Lashkar',
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    postal_code: '474002',
    is_vip: false
  },
  {
    name: 'Shruti Hegde',
    email: 'shruti.h@mangalore.in',
    phone: '+919448012345',
    address_line1: 'Kadri Hills, Circuit House Road',
    city: 'Mangalore',
    state: 'Karnataka',
    postal_code: '575004',
    is_vip: false
  }
];

const COURIERS = ['BlueDart', 'Delhivery', 'Shadowfax', 'DTDC', 'Xpressbees'];

function getPastDate(daysAgo, hourOffset = 0, minuteOffset = 0) {
  const refTime = new Date('2026-09-30T11:30:00+05:30').getTime();
  const targetTime = refTime - (daysAgo * 86400000) + (hourOffset * 3600000) + (minuteOffset * 60000);
  return new Date(targetTime).toISOString();
}

export function generate100HistoricalOrders() {
  const orders = [];
  let orderSeq = 1001;

  // Distribution across 105 days:
  // 1. Last 2 days: 12 orders
  // 2. Days 3-7: 18 orders
  // 3. Days 8-15: 20 orders
  // 4. Days 16-30: 20 orders
  // 5. Days 31-60: 18 orders
  // 6. Days 61-105: 12 orders
  // Total = 100 orders

  const distribution = [
    [0.1, 2, 12],
    [3, 7, 18],
    [8, 15, 20],
    [16, 30, 20],
    [31, 60, 18],
    [61, 105, 12]
  ];

  let currentOrderIdx = 0;

  distribution.forEach(([minDays, maxDays, count]) => {
    const step = (maxDays - minDays) / (count || 1);
    for (let i = 0; i < count; i++) {
      currentOrderIdx++;
      const daysAgo = Number((minDays + (i * step) + (Math.random() * step * 0.5)).toFixed(2));
      const hourOffset = (i * 3 + Math.floor(Math.random() * 5)) % 24 - 12;
      const minuteOffset = Math.floor(Math.random() * 59);
      const createdAt = getPastDate(daysAgo, hourOffset, minuteOffset);
      const createdDateObj = new Date(createdAt);

      const orderNumber = `LZR-${String(currentOrderIdx).padStart(4, '0')}`;

      const custIdx = currentOrderIdx % CUSTOMER_POOL.length;
      const cust = CUSTOMER_POOL[custIdx];

      // 1, 2, or 3 items in order
      const itemCount = (currentOrderIdx % 5 === 0) ? 3 : ((currentOrderIdx % 3 === 0) ? 2 : 1);
      const items = [];
      let subtotal = 0;

      for (let it = 0; it < itemCount; it++) {
        const prodIdx = (currentOrderIdx + it) % PRODUCTS_CATALOG.length;
        const prod = PRODUCTS_CATALOG[prodIdx];
        const size = SIZES[(currentOrderIdx + it) % SIZES.length];
        const qty = (it === 0 && currentOrderIdx % 9 === 0) ? 2 : 1;
        const itemPrice = prod.price;
        const lineTotal = itemPrice * qty;
        subtotal += lineTotal;

        items.push({
          product_id: prod.id,
          name: prod.name,
          product_name: prod.name,
          sku: `${prod.sku}-${size}`,
          size: size,
          quantity: qty,
          unit_price: itemPrice,
          price: itemPrice,
          total_price: lineTotal
        });
      }

      // Coupon & Influencer Assignment
      let couponCode = null;
      let discountAmount = 0;
      let influencerId = null;
      let influencerCommissionAmount = 0;
      let influencerRateSnapshot = 0;
      let influencerTypeSnapshot = 'percentage';
      let customerDiscountSnapshot = 0;
      let couponSnapshot = null;

      if (currentOrderIdx % 3 === 0) {
        const infOption = SEED_INFLUENCERS[currentOrderIdx % SEED_INFLUENCERS.length];
        if (currentOrderIdx % 6 === 0) {
          couponCode = infOption.coupon_code;
          influencerId = infOption.id;
          discountAmount = Math.round(subtotal * (infOption.customer_discount_value / 100));
          influencerCommissionAmount = Math.round(subtotal * (infOption.commission_value / 100));
          influencerRateSnapshot = infOption.commission_value;
          influencerTypeSnapshot = infOption.commission_type;
          customerDiscountSnapshot = infOption.customer_discount_value;
          couponSnapshot = infOption.coupon_code;
        } else if (currentOrderIdx % 4 === 0) {
          couponCode = 'WELCOME10';
          discountAmount = Math.round(subtotal * 0.10);
          couponSnapshot = 'WELCOME10';
          customerDiscountSnapshot = 10;
        } else {
          couponCode = 'FLASH20';
          discountAmount = subtotal >= 1798 ? 200 : 0;
          couponSnapshot = 'FLASH20';
          customerDiscountSnapshot = 200;
        }
      }

      const shippingFee = subtotal >= 1798 ? 0 : 99;
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

      // Order status & payment status
      let orderStatus = 'delivered';
      let paymentStatus = 'paid';
      let paymentMethod = (currentOrderIdx % 4 === 0) ? 'cod' : ((currentOrderIdx % 7 === 0) ? 'card' : 'upi');

      if (daysAgo < 0.5) {
        if (currentOrderIdx % 3 === 0) {
          orderStatus = 'confirmed';
          paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';
        } else if (currentOrderIdx % 3 === 1) {
          orderStatus = 'processing';
          paymentStatus = 'paid';
        } else {
          orderStatus = 'pending';
          paymentStatus = 'pending';
        }
      } else if (daysAgo < 2) {
        orderStatus = (currentOrderIdx % 2 === 0) ? 'processing' : 'shipped';
        paymentStatus = (paymentMethod === 'cod' && orderStatus !== 'delivered') ? 'pending' : 'paid';
      } else if (daysAgo < 6) {
        orderStatus = (currentOrderIdx % 5 === 0) ? 'shipped' : 'delivered';
        paymentStatus = 'paid';
      } else {
        if (currentOrderIdx === 45 || currentOrderIdx === 82) {
          orderStatus = 'cancelled';
          paymentStatus = 'refunded';
        } else if (currentOrderIdx === 52 || currentOrderIdx === 91) {
          orderStatus = 'delivered';
          paymentStatus = 'refunded';
        } else {
          orderStatus = 'delivered';
          paymentStatus = 'paid';
        }
      }

      const courier = COURIERS[currentOrderIdx % COURIERS.length];
      const trackingNumber = (orderStatus === 'shipped' || orderStatus === 'delivered')
        ? `${courier.slice(0, 2).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`
        : null;

      const paidAt = paymentStatus === 'paid' ? createdAt : null;
      const razorpayPaymentId = (paymentMethod !== 'cod' && (paymentStatus === 'paid' || paymentStatus === 'refunded'))
        ? `pay_live_${Math.random().toString(36).substring(2, 12)}`
        : null;

      let notes = `LOOZARS Drop 01 Order [Standard Dispatch]`;
      if (orderStatus === 'cancelled') {
        notes = `Customer requested cancellation before dispatch. [CANCELLED]`;
      } else if (paymentStatus === 'refunded') {
        notes = `Customer requested return & refund. Processed via Razorpay API. [RETURNED]`;
      } else if (cust.is_vip) {
        notes = `VIP Whitelist Patron order. Priority luxury packaging included.`;
      }

      orders.push({
        id: `c0000000-0000-0000-0000-${String(currentOrderIdx).padStart(12, '0')}`,
        order_number: orderNumber,
        customer_name: cust.name,
        customer_email: cust.email,
        customer_phone: cust.phone,
        shipping_address: {
          name: cust.name,
          address_line1: cust.address_line1,
          city: cust.city,
          state: cust.state,
          postal_code: cust.postal_code,
          phone: cust.phone
        },
        items: items,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        coupon_code: couponCode,
        influencer_id: influencerId,
        influencer_commission_amount: influencerCommissionAmount,
        influencer_commission_rate_snapshot: influencerRateSnapshot,
        influencer_commission_type_snapshot: influencerTypeSnapshot,
        customer_discount_snapshot: customerDiscountSnapshot,
        coupon_code_snapshot: couponSnapshot,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: orderStatus,
        razorpay_payment_id: razorpayPaymentId,
        paid_at: paidAt,
        courier_name: courier,
        tracking_number: trackingNumber,
        notes: notes,
        created_at: createdAt,
        updated_at: createdAt
      });
    }
  });

  orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return orders;
}

async function run() {
  console.log('=== SEEDING 100 HISTORICAL ORDERS ACROSS PAST DATES ===');

  // 1. Seed Influencers
  console.log('Step 1: Upserting Influencers...');
  for (const inf of SEED_INFLUENCERS) {
    const { error } = await supabase.from('influencers').upsert(inf, { onConflict: 'id' });
    if (error) {
      console.warn(`Influencer ${inf.name} upsert warning:`, error.message);
    } else {
      console.log(`Influencer: ${inf.name} (${inf.coupon_code})`);
    }
  }

  // 2. Seed Coupons
  console.log('Step 2: Upserting Coupons...');
  for (const c of SEED_COUPONS) {
    const { error } = await supabase.from('coupons').upsert(c, { onConflict: 'code' });
    if (error) {
      console.warn(`Coupon ${c.code} upsert warning:`, error.message);
    } else {
      console.log(`Coupon: ${c.code} (${c.discount_type})`);
    }
  }

  // 3. Generate 100 Orders
  console.log('Step 3: Generating 100 orders with past dates...');
  const orders = generate100HistoricalOrders();
  console.log(`Generated ${orders.length} orders spanning from ${orders[orders.length - 1].created_at} to ${orders[0].created_at}`);

  // 4. Batch Insert Orders into Supabase
  console.log('Step 4: Inserting 100 orders into Supabase...');
  const batchSize = 25;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    const { error } = await supabase.from('orders').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} orders)`);
    }
  }

  // 5. Seed Influencer Commissions Ledger
  console.log('Step 5: Seeding Influencer Commissions Ledger...');
  const commissions = [];
  orders.forEach(o => {
    if (o.influencer_id && o.influencer_commission_amount > 0) {
      commissions.push({
        influencer_id: o.influencer_id,
        order_id: o.id,
        commission_type_snapshot: 'percentage',
        commission_value_snapshot: 8.00,
        commission_base_amount: o.subtotal_amount,
        commission_amount: o.influencer_commission_amount,
        status: o.payment_status === 'paid' ? (o.order_status === 'delivered' ? 'paid' : 'eligible') : 'pending',
        created_at: o.created_at,
        updated_at: o.updated_at
      });
    }
  });

  for (const comm of commissions) {
    const { error } = await supabase.from('influencer_commissions').upsert(comm, { onConflict: 'order_id,influencer_id' });
    if (error) console.warn('Commission error:', error.message);
  }
  console.log(`Seeded ${commissions.length} influencer commissions.`);

  // 6. Export client-side seed file src/data/seedOrders.js
  console.log('Step 6: Writing src/data/seedOrders.js...');
  const seedFileContent = `// LOOZARS Historical Orders Dataset (100 Orders spanning past 90+ days)
// Generated at ${new Date().toISOString()}

export const SEED_HISTORICAL_ORDERS = ${JSON.stringify(orders, null, 2)};
`;
  fs.writeFileSync(path.resolve('src/data/seedOrders.js'), seedFileContent, 'utf8');
  console.log('src/data/seedOrders.js created successfully.');

  // 7. Verification
  const { count: finalCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  console.log(`\n========================================`);
  console.log(`VERIFICATION COMPLETE:`);
  console.log(`Total Orders in Supabase Database: ${finalCount}`);
  console.log(`Total Influencers in Supabase: ${SEED_INFLUENCERS.length}`);
  console.log(`Total Coupons in Supabase: ${SEED_COUPONS.length}`);
  console.log(`========================================\n`);
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
