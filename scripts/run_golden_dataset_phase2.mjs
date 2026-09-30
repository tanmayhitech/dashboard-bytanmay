import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function runGoldenDatasetPhase2() {
  console.log('====================================================');
  console.log('LOOZARS® — GOLDEN DATASET EXECUTION RUNNER (PHASE 2)');
  console.log('====================================================');

  const executionLog = {
    startTime: new Date().toISOString(),
    customersProcessed: 0,
    ordersAttempted: 0,
    ordersCreated: 0,
    mutationsPerformed: 0,
    failedOperations: 0,
    rejectedOperations: [],
    errors: [],
    inventoryMovements: [],
    couponRedemptions: [],
    commissionLedger: [],
    returnsProcessed: [],
    reviewsProcessed: [],
    abandonedCartsProcessed: []
  };

  // 1. Fetch live catalog baseline
  console.log('1. Loading live catalog and starting inventory...');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  const { data: variants, error: vErr } = await supabase.from('product_variants').select('*');
  const { data: coupons, error: cErr } = await supabase.from('coupons').select('*');
  const { data: influencers, error: iErr } = await supabase.from('influencers').select('*');

  if (pErr || vErr || cErr || iErr) {
    console.error('Fatal initialization error:', { pErr, vErr, cErr, iErr });
    process.exit(1);
  }

  // Clear any existing orders / commissions from test runs to guarantee deterministic fresh execution
  await supabase.from('influencer_commissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Baseline Starting Inventory Table
  const startingInventorySnapshot = [
    { sku: 'LZR-D01-01-XS', stock: 76 },
    { sku: 'LZR-D01-01-S', stock: 15 },
    { sku: 'LZR-D01-01-M', stock: 13 },
    { sku: 'LZR-D01-01-L', stock: 34 },
    { sku: 'LZR-D01-01-XL', stock: 15 },
    { sku: 'LZR-D01-01-XXL', stock: 101 },
    { sku: 'LZR-D01-02-S', stock: 15 },
    { sku: 'LZR-D01-02-M', stock: 15 },
    { sku: 'LZR-D01-02-L', stock: 11 },
    { sku: 'LZR-D01-02-XL', stock: 9 },
    { sku: 'LZR-D01-02-XXL', stock: 15 },
    { sku: 'LZR-D01-03-XS', stock: 15 },
    { sku: 'LZR-D01-03-S', stock: 15 },
    { sku: 'LZR-D01-03-M', stock: 15 },
    { sku: 'LZR-D01-03-L', stock: 12 },
    { sku: 'LZR-D01-03-XL', stock: 15 },
    { sku: 'LZR-D01-04-S', stock: 15 },
    { sku: 'LZR-D01-04-M', stock: 15 },
    { sku: 'LZR-D01-04-L', stock: 16 },
    { sku: 'LZR-D01-04-XL', stock: 15 },
    { sku: 'LZR-D01-04-XXL', stock: 15 }
  ];

  // Reset variant starting stocks to canonical baseline
  for (const item of startingInventorySnapshot) {
    await supabase.from('product_variants').update({ stock_quantity: item.stock }).eq('sku', item.sku);
  }

  // Reset coupon times_used to 0
  await supabase.from('coupons').update({ times_used: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');

  console.log(`Live Baseline: ${products.length} Products, ${variants.length} SKUs, ${coupons.length} Coupons, ${influencers.length} Influencers.`);

  // 2. Define 100 Synthetic Customers
  const customers = [
    { id: 'CUSTOMER-001', name: 'Aarav Kapoor', email: 'aarav.k001@loozars-test.internal', phone: '+919000000001', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
    { id: 'CUSTOMER-002', name: 'Diya Sen', email: 'diya.s002@loozars-test.internal', phone: '+919000000002', city: 'Kolkata', state: 'West Bengal', pincode: '700019' },
    { id: 'CUSTOMER-003', name: 'Siddharth Rao', email: 'sid.r003@loozars-test.internal', phone: '+919000000003', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
    { id: 'CUSTOMER-004', name: 'Ananya Birla', email: 'ananya.b004@loozars-test.internal', phone: '+919000000004', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    { id: 'CUSTOMER-005', name: 'Vikramaditya Singhania', email: 'vikram.s005@loozars-test.internal', phone: '+919000000005', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    { id: 'CUSTOMER-006', name: 'Rhea Pillai', email: 'rhea.p006@loozars-test.internal', phone: '+919000000006', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004' },
    { id: 'CUSTOMER-007', name: 'Kabir Malhotra', email: 'kabir.m007@loozars-test.internal', phone: '+919000000007', city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
    { id: 'CUSTOMER-008', name: 'Tanya Choudhury', email: 'tanya.c008@loozars-test.internal', phone: '+919000000008', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
    { id: 'CUSTOMER-009', name: 'Rohan Joshi', email: 'rohan.j009@loozars-test.internal', phone: '+919000000009', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009' },
    { id: 'CUSTOMER-010', name: 'Shreya Deshpande', email: 'shreya.d010@loozars-test.internal', phone: '+919000000010', city: 'Nagpur', state: 'Maharashtra', pincode: '440010' },
    { id: 'CUSTOMER-011', name: 'Advait Nair', email: 'advait.n011@loozars-test.internal', phone: '+919000000011', city: 'Kochi', state: 'Kerala', pincode: '682016' },
    { id: 'CUSTOMER-012', name: 'Mira Varma', email: 'mira.v012@loozars-test.internal', phone: '+919000000012', city: 'Hyderabad', state: 'Telangana', pincode: '500034' },
    { id: 'CUSTOMER-013', name: 'Yashwardhan Mehta', email: 'yash.m013@loozars-test.internal', phone: '+919000000013', city: 'Surat', state: 'Gujarat', pincode: '395007' },
    { id: 'CUSTOMER-014', name: 'Ishani Dutta', email: 'ishani.d014@loozars-test.internal', phone: '+919000000014', city: 'Guwahati', state: 'Assam', pincode: '781005' },
    { id: 'CUSTOMER-015', name: 'Devendra Rathore', email: 'dev.r015@loozars-test.internal', phone: '+919000000015', city: 'Udaipur', state: 'Rajasthan', pincode: '313001' },
    { id: 'CUSTOMER-016', name: 'Kriti Sanon', email: 'kriti.s016@loozars-test.internal', phone: '+919000000016', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
    { id: 'CUSTOMER-017', name: 'Pranav Saxena', email: 'pranav.s017@loozars-test.internal', phone: '+919000000017', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001' },
    { id: 'CUSTOMER-018', name: 'Natasha Kulkarni', email: 'natasha.k018@loozars-test.internal', phone: '+919000000018', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' },
    { id: 'CUSTOMER-019', name: 'Arjun Talwar', email: 'arjun.t019@loozars-test.internal', phone: '+919000000019', city: 'Ludhiana', state: 'Punjab', pincode: '141001' },
    { id: 'CUSTOMER-020', name: 'Sanjana Menon', email: 'sanjana.m020@loozars-test.internal', phone: '+919000000020', city: 'Thiruvananthapuram', state: 'Kerala', pincode: '695001' },
    { id: 'CUSTOMER-021', name: 'Neil Roy', email: 'neil.r021@loozars-test.internal', phone: '+919000000021', city: 'Bhubaneswar', state: 'Odisha', pincode: '751001' },
    { id: 'CUSTOMER-022', name: 'Zoya Merchant', email: 'zoya.m022@loozars-test.internal', phone: '+919000000022', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
    { id: 'CUSTOMER-023', name: 'Farhan Qureshi', email: 'farhan.q023@loozars-test.internal', phone: '+919000000023', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001' },
    { id: 'CUSTOMER-024', name: 'Trisha Sengupta', email: 'trisha.s024@loozars-test.internal', phone: '+919000000024', city: 'Kolkata', state: 'West Bengal', pincode: '700029' },
    { id: 'CUSTOMER-025', name: 'Varun Grover', email: 'varun.g025@loozars-test.internal', phone: '+919000000025', city: 'Gurgaon', state: 'Haryana', pincode: '122002' },
    { id: 'CUSTOMER-026', name: 'Simran Kaur', email: 'simran.k026@loozars-test.internal', phone: '+919000000026', city: 'Amritsar', state: 'Punjab', pincode: '143001' },
    { id: 'CUSTOMER-027', name: 'Aditya Banerjee', email: 'aditya.b027@loozars-test.internal', phone: '+919000000027', city: 'Patna', state: 'Bihar', pincode: '800001' },
    { id: 'CUSTOMER-028', name: 'Meera Nambiar', email: 'meera.n028@loozars-test.internal', phone: '+919000000028', city: 'Kozhikode', state: 'Kerala', pincode: '673001' },
    { id: 'CUSTOMER-029', name: 'Sameer Alvi', email: 'sameer.a029@loozars-test.internal', phone: '+919000000029', city: 'Agra', state: 'Uttar Pradesh', pincode: '282001' },
    { id: 'CUSTOMER-030', name: 'Tara Sutaria', email: 'tara.s030@loozars-test.internal', phone: '+919000000030', city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' },
    { id: 'CUSTOMER-031', name: 'Nikhil Kamath', email: 'nikhil.k031@loozars-test.internal', phone: '+919000000031', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    { id: 'CUSTOMER-032', name: 'Ananya Seth', email: 'ananya.s032@loozars-test.internal', phone: '+919000000032', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
    { id: 'CUSTOMER-033', name: 'Raghav Bahl', email: 'raghav.b033@loozars-test.internal', phone: '+919000000033', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
    { id: 'CUSTOMER-034', name: 'Bhavna Somani', email: 'bhavna.s034@loozars-test.internal', phone: '+919000000034', city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
    { id: 'CUSTOMER-035', name: 'Chirag Patel', email: 'chirag.p035@loozars-test.internal', phone: '+919000000035', city: 'Rajkot', state: 'Gujarat', pincode: '360001' },
    { id: 'CUSTOMER-036', name: 'Dhruv Sehgal', email: 'dhruv.s036@loozars-test.internal', phone: '+919000000036', city: 'New Delhi', state: 'Delhi', pincode: '110024' },
    { id: 'CUSTOMER-037', name: 'Mallika Dua', email: 'mallika.d037@loozars-test.internal', phone: '+919000000037', city: 'Faridabad', state: 'Haryana', pincode: '121001' },
    { id: 'CUSTOMER-038', name: 'Sahil Khattar', email: 'sahil.k038@loozars-test.internal', phone: '+919000000038', city: 'Mumbai', state: 'Maharashtra', pincode: '400076' },
    { id: 'CUSTOMER-039', name: 'Pooja Dhingra', email: 'pooja.d039@loozars-test.internal', phone: '+919000000039', city: 'Panaji', state: 'Goa', pincode: '403001' },
    { id: 'CUSTOMER-040', name: 'Ranveer Allahabadia', email: 'ranveer.a040@loozars-test.internal', phone: '+919000000040', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400703' },
    { id: 'CUSTOMER-041', name: 'Barkha Singh', email: 'barkha.s041@loozars-test.internal', phone: '+919000000041', city: 'Thane', state: 'Maharashtra', pincode: '400601' },
    { id: 'CUSTOMER-042', name: 'Kusha Kapila', email: 'kusha.k042@loozars-test.internal', phone: '+919000000042', city: 'New Delhi', state: 'Delhi', pincode: '110048' },
    { id: 'CUSTOMER-043', name: 'Dolly Singh', email: 'dolly.s043@loozars-test.internal', phone: '+919000000043', city: 'Nainital', state: 'Uttarakhand', pincode: '263001' },
    { id: 'CUSTOMER-044', name: 'Bhuvan Bam', email: 'bhuvan.b044@loozars-test.internal', phone: '+919000000044', city: 'New Delhi', state: 'Delhi', pincode: '110019' },
    { id: 'CUSTOMER-045', name: 'Prajakta Koli', email: 'prajakta.k045@loozars-test.internal', phone: '+919000000045', city: 'Mumbai', state: 'Maharashtra', pincode: '400080' },
    { id: 'CUSTOMER-046', name: 'Ashish Chanchlani', email: 'ashish.c046@loozars-test.internal', phone: '+919000000046', city: 'Ulhasnagar', state: 'Maharashtra', pincode: '421001' },
    { id: 'CUSTOMER-047', name: 'Carry Minati', email: 'ajey.n047@loozars-test.internal', phone: '+919000000047', city: 'Faridabad', state: 'Haryana', pincode: '121002' },
    { id: 'CUSTOMER-048', name: 'Tanmay Bhat', email: 'tanmay.b048@loozars-test.internal', phone: '+919000000048', city: 'Bengaluru', state: 'Karnataka', pincode: '560078' },
    { id: 'CUSTOMER-049', name: 'Samay Raina', email: 'samay.r049@loozars-test.internal', phone: '+919000000049', city: 'Jammu', state: 'Jammu & Kashmir', pincode: '180001' },
    { id: 'CUSTOMER-050', name: 'Zakir Khan', email: 'zakir.k050@loozars-test.internal', phone: '+919000000050', city: 'Indore', state: 'Madhya Pradesh', pincode: '452002' },
    { id: 'CUSTOMER-051', name: 'Abhishek Upmanyu', email: 'abhishek.u051@loozars-test.internal', phone: '+919000000051', city: 'New Delhi', state: 'Delhi', pincode: '110016' },
    { id: 'CUSTOMER-052', name: 'Anubhav Bassi', email: 'anubhav.b052@loozars-test.internal', phone: '+919000000052', city: 'Meerut', state: 'Uttar Pradesh', pincode: '250001' },
    { id: 'CUSTOMER-053', name: 'Vipul Goyal', email: 'vipul.g053@loozars-test.internal', phone: '+919000000053', city: 'Kota', state: 'Rajasthan', pincode: '324005' },
    { id: 'CUSTOMER-054', name: 'Rahul Subramanian', email: 'rahul.s054@loozars-test.internal', phone: '+919000000054', city: 'Chennai', state: 'Tamil Nadu', pincode: '600028' },
    { id: 'CUSTOMER-055', name: 'Kanan Gill', email: 'kanan.g055@loozars-test.internal', phone: '+919000000055', city: 'Bengaluru', state: 'Karnataka', pincode: '560025' },
    { id: 'CUSTOMER-056', name: 'Kenny Sebastian', email: 'kenny.s056@loozars-test.internal', phone: '+919000000056', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
    { id: 'CUSTOMER-057', name: 'Biswa Kalyan', email: 'biswa.k057@loozars-test.internal', phone: '+919000000057', city: 'Cuttack', state: 'Odisha', pincode: '753001' },
    { id: 'CUSTOMER-058', name: 'Vir Das', email: 'vir.d058@loozars-test.internal', phone: '+919000000058', city: 'Dehradun', state: 'Uttarakhand', pincode: '248003' },
    { id: 'CUSTOMER-059', name: 'Kunal Kamra', email: 'kunal.k059@loozars-test.internal', phone: '+919000000059', city: 'Mumbai', state: 'Maharashtra', pincode: '400016' },
    { id: 'CUSTOMER-060', name: 'Munawar Faruqui', email: 'munawar.f060@loozars-test.internal', phone: '+919000000060', city: 'Dongri', state: 'Maharashtra', pincode: '400009' }
  ];

  // Fill up customers 061-100
  for (let i = 61; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    customers.push({
      id: `CUSTOMER-${pad}`,
      name: `Synthetic Buyer ${pad}`,
      email: `buyer.${pad}@loozars-test.internal`,
      phone: `+919000000${pad}`,
      city: i % 2 === 0 ? 'Delhi' : 'Mumbai',
      state: i % 2 === 0 ? 'Delhi' : 'Maharashtra',
      pincode: i % 2 === 0 ? '110001' : '400001'
    });
  }

  executionLog.customersProcessed = customers.length;
  console.log(`2. Prepared ${customers.length} synthetic customers.`);

  // 3. Execution Helpers
  const skuVariantMap = new Map();
  variants.forEach(v => skuVariantMap.set(v.sku, v));

  const skuProductMap = new Map();
  variants.forEach(v => {
    const p = products.find(prod => prod.id === v.product_id);
    skuProductMap.set(v.sku, p);
  });

  const couponMap = new Map();
  coupons.forEach(c => couponMap.set(c.code, c));

  const influencerCouponMap = new Map();
  influencers.forEach(inf => {
    if (inf.coupon_code) influencerCouponMap.set(inf.coupon_code, inf);
  });

  // 4. Order generator plan (Exact 220 orders across the 100 customers)
  console.log('3. Building 220 deterministic order journeys & 35 scenarios...');
  let orderSeq = 2001;
  const orderPlan = [];

  // Scenarios 1 - 35
  customers.forEach((cust, idx) => {
    const cNum = idx + 1;

    if (cNum === 1 || cNum === 2) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-M'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 10 });
    } else if (cNum === 3 || cNum === 4) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: 'WELCOME10', daysAgo: 25 });
      orderPlan.push({ cust, skus: ['LZR-D01-02-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 5 });
    } else if (cNum === 5 || cNum === 6) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-M'], payMethod: 'cod', payStatus: 'pending', ordStatus: 'processing', coupon: null, daysAgo: 2 });
    } else if (cNum === 7 || cNum === 8) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-S'], payMethod: 'cod', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 30 });
      orderPlan.push({ cust, skus: ['LZR-D01-04-M'], payMethod: 'cod', payStatus: 'pending', ordStatus: 'shipped', coupon: null, daysAgo: 1 });
    } else if (cNum === 9 || cNum === 10) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-M'], payMethod: 'upi', payStatus: 'pending', ordStatus: 'cancelled', coupon: null, daysAgo: 8, cancelRestock: true });
    } else if (cNum === 11 || cNum === 12) {
      orderPlan.push({ cust, skus: ['LZR-D01-04-L'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 15 });
    } else if (cNum === 13 || cNum === 14) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XL'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'processing', coupon: null, daysAgo: 1 });
    } else if (cNum === 15 || cNum === 16) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'shipped', coupon: null, daysAgo: 3 });
    } else if (cNum === 17 || cNum === 18) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-XL'], payMethod: 'card', payStatus: 'failed', ordStatus: 'pending', coupon: null, daysAgo: 4 });
    } else if (cNum === 19 || cNum === 20) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-M'], payMethod: 'card', payStatus: 'failed', ordStatus: 'pending', coupon: null, daysAgo: 7, isRetrySource: true });
      orderPlan.push({ cust, skus: ['LZR-D01-01-M'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 6, isRetrySuccess: true });
    } else if (cNum === 21) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'WELCOME10', daysAgo: 12 });
    } else if (cNum === 22) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L', 'LZR-D01-02-L'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: 'FLASH20', daysAgo: 14 });
    } else if (cNum === 23) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-M', 'LZR-D01-04-M'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'RARE15', daysAgo: 18 });
    } else if (cNum === 24) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'EXPIRED50', daysAgo: 20, testInvalidCoupon: true });
    } else if (cNum === 25) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'RARE15', daysAgo: 15, testMinOrderFailure: true });
    } else if (cNum === 26) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L', 'LZR-D01-02-L', 'LZR-D01-03-L'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: 'VIP20', daysAgo: 16 });
    } else if (cNum === 27) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XS'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 22, isReturnRequest: true });
    } else if (cNum === 28) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-M'], payMethod: 'upi', payStatus: 'refunded', ordStatus: 'delivered', coupon: null, daysAgo: 20, isFullReturnRefund: true });
    } else if (cNum === 29) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-S', 'LZR-D01-04-S'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 19, isPartialReturn: true });
    } else if (cNum === 30) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XXL'], payMethod: 'upi', payStatus: 'refunded', ordStatus: 'delivered', coupon: null, daysAgo: 21, isDirectRefund: true });
    } else if (cNum === 31) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-M'], payMethod: 'upi', payStatus: 'refunded', ordStatus: 'delivered', coupon: null, daysAgo: 40 });
      orderPlan.push({ cust, skus: ['LZR-D01-04-M'], payMethod: 'card', payStatus: 'refunded', ordStatus: 'delivered', coupon: null, daysAgo: 25 });
    } else if (cNum === 32 || cNum === 33) {
      executionLog.abandonedCartsProcessed.push({
        customer: cust.name,
        email: cust.email,
        cart_value: 1798,
        items: ['LZR-D01-01-M', 'LZR-D01-02-M'],
        status: 'abandoned',
        recovered: false
      });
    } else if (cNum === 34 || cNum === 35) {
      executionLog.abandonedCartsProcessed.push({
        customer: cust.name,
        email: cust.email,
        cart_value: 899,
        items: ['LZR-D01-01-L'],
        status: 'recovered',
        recovered: true
      });
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'WELCOME10', daysAgo: 5, isRecoveredCart: true });
    } else if (cNum === 36) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'AARYAN10', daysAgo: 8, influencerId: 'a1111111-2222-3333-4444-555555555555' });
    } else if (cNum === 37) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-M'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: 'KHAN10', daysAgo: 7, influencerId: 'de2ec333-3a19-464a-8efa-922ec3819eed' });
    } else if (cNum === 38 || cNum === 39) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-S'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'ZARA15', daysAgo: 15, influencerId: 'b2222222-3333-4444-5555-666666666666' });
      orderPlan.push({ cust, skus: ['LZR-D01-04-XL'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'ROHAN10', daysAgo: 6, influencerId: 'c3333333-4444-5555-6666-777777777777' });
    } else if (cNum === 40 || cNum === 41) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XXL'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 14, attachReview: { rating: 5, text: 'Exceptional 320 GSM weight and drape.' } });
    } else if (cNum === 42 || cNum === 43) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-M'], payMethod: 'upi', payStatus: 'pending', ordStatus: 'pending', coupon: null, daysAgo: 2, testUnverifiedReview: true });
    } else if (cNum === 44 || cNum === 45) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-L', 'LZR-D01-02-L', 'LZR-D01-03-L'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: 'RARE15', daysAgo: 11 });
    } else if (cNum === 46 || cNum === 47) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XXL', 'LZR-D01-01-XXL'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 16 });
    } else if (cNum === 48 || cNum === 49) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-M', 'LZR-D01-01-XL'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 13 });
    } else if (cNum === 50 || cNum === 51) {
      orderPlan.push({ cust, skus: ['LZR-D01-03-S', 'LZR-D01-03-XL'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 17 });
    } else if (cNum === 52 || cNum === 53) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XS'], payMethod: 'upi', payStatus: 'pending', ordStatus: 'cancelled', coupon: null, daysAgo: 9, cancelRestock: true });
    } else if (cNum === 54 || cNum === 55) {
      orderPlan.push({ cust, skus: ['LZR-D01-04-M'], payMethod: 'upi', payStatus: 'refunded', ordStatus: 'delivered', coupon: null, daysAgo: 24, isReturnRestock: true });
    } else if (cNum === 56) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-XXL'], payMethod: 'card', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 60, verifyPriceSnapshot: true });
    } else if (cNum === 57 || cNum === 58) {
      for (let k = 1; k <= 5; k++) {
        orderPlan.push({ cust, skus: ['LZR-D01-01-XXL'], payMethod: k % 2 === 0 ? 'card' : 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: k === 1 ? 'VIP20' : null, daysAgo: k * 10 });
      }
    } else if (cNum === 59 || cNum === 60) {
      orderPlan.push({ cust, skus: ['LZR-D01-02-L'], payMethod: 'card', payStatus: 'failed', ordStatus: 'pending', coupon: null, daysAgo: 15 });
      orderPlan.push({ cust, skus: ['LZR-D01-03-L'], payMethod: 'upi', payStatus: 'pending', ordStatus: 'cancelled', coupon: null, daysAgo: 5, cancelRestock: true });
    } else if (cNum === 61 || cNum === 62) {
      orderPlan.push({ cust, skus: ['LZR-D01-01-M'], payMethod: 'upi', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 28 });
      orderPlan.push({ cust, skus: ['LZR-D01-02-M'], payMethod: 'cod', payStatus: 'paid', ordStatus: 'delivered', coupon: null, daysAgo: 10 });
    }
  });

  // Distribute additional orders across customers 63 to 100 to achieve exactly 220 total orders
  const currentCount = orderPlan.length;
  const remainingNeeded = 220 - currentCount;
  console.log(`Initial scenario orders: ${currentCount}. Generating ${remainingNeeded} timeline orders for Customers 63-100...`);

  for (let r = 0; r < remainingNeeded; r++) {
    const custIndex = 60 + (r % 40); // index 60 to 99 (Customers 61-100)
    const cust = customers[custIndex];
    const skuGroup = [
      ['LZR-D01-01-XS'], ['LZR-D01-01-XXL'], ['LZR-D01-01-L'], ['LZR-D01-02-S'],
      ['LZR-D01-02-XXL'], ['LZR-D01-03-XS'], ['LZR-D01-03-XL'], ['LZR-D01-04-S'],
      ['LZR-D01-04-XXL'], ['LZR-D01-01-XS', 'LZR-D01-01-XXL']
    ][r % 10];

    const isCod = r % 4 === 0;
    const isDelivered = r % 6 !== 0;
    const isCancelled = r % 19 === 0;
    const couponChoice = r % 7 === 0 ? 'WELCOME10' : (r % 11 === 0 ? 'RHEA10' : null);

    orderPlan.push({
      cust,
      skus: skuGroup,
      payMethod: isCod ? 'cod' : 'upi',
      payStatus: isCancelled ? 'pending' : (isDelivered ? 'paid' : (isCod ? 'pending' : 'paid')),
      ordStatus: isCancelled ? 'cancelled' : (isDelivered ? 'delivered' : (r % 2 === 0 ? 'shipped' : 'processing')),
      coupon: isCancelled ? null : couponChoice,
      daysAgo: (r * 2) % 88 + 1,
      cancelRestock: isCancelled,
      influencerId: couponChoice === 'RHEA10' ? 'd4444444-5555-6666-7777-888888888888' : null
    });
  }

  console.log(`Total deterministic orders planned: ${orderPlan.length}`);

  // 5. Build and Insert Orders
  const insertedOrders = [];
  const inventoryDeltas = new Map();

  for (let i = 0; i < orderPlan.length; i++) {
    const item = orderPlan[i];
    executionLog.ordersAttempted += 1;

    const orderNumber = `LZR-${String(orderSeq++).padStart(4, '0')}`;
    const orderCreatedAt = new Date(Date.now() - (item.daysAgo || 1) * 86400000).toISOString();

    const lineItems = [];
    let subtotal = 0;

    for (const sku of item.skus) {
      const v = skuVariantMap.get(sku);
      const p = skuProductMap.get(sku);

      if (!v || !p) {
        executionLog.errors.push(`SKU not found in catalog: ${sku}`);
        continue;
      }

      const unitPrice = p.base_price || 899;
      subtotal += unitPrice;

      lineItems.push({
        product_id: p.id,
        variant_id: v.id,
        sku: v.sku,
        name: p.name,
        product_name: p.name,
        size: v.size,
        quantity: 1,
        unit_price: unitPrice,
        price: unitPrice,
        total_price: unitPrice
      });
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (item.coupon) {
      if (item.testInvalidCoupon) {
        executionLog.rejectedOperations.push({
          operation: 'COUPON_APPLY',
          code: item.coupon,
          customer: item.cust.id,
          reason: 'Coupon does not exist or has expired'
        });
      } else if (item.testMinOrderFailure) {
        executionLog.rejectedOperations.push({
          operation: 'COUPON_APPLY',
          code: item.coupon,
          customer: item.cust.id,
          subtotal,
          reason: 'Subtotal ₹' + subtotal + ' does not meet minimum order requirement of ₹1500'
        });
      } else {
        const c = couponMap.get(item.coupon);
        if (c && c.is_active && subtotal >= (c.min_order_amount || 0)) {
          appliedCoupon = c.code;
          if (c.discount_type === 'percentage') {
            discountAmount = Math.round((subtotal * c.discount_value) / 100);
            if (c.max_discount_amount) discountAmount = Math.min(discountAmount, c.max_discount_amount);
          } else {
            discountAmount = Math.min(subtotal, Math.round(c.discount_value));
          }
          executionLog.couponRedemptions.push({
            code: c.code,
            order: orderNumber,
            discount: discountAmount,
            customer: item.cust.id
          });
        }
      }
    }

    const shippingFee = (subtotal - discountAmount >= 1500 || item.payMethod !== 'cod') ? 0 : 99;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    let influencerId = item.influencerId || null;
    let commissionAmount = 0;
    if (appliedCoupon && influencerCouponMap.has(appliedCoupon)) {
      const inf = influencerCouponMap.get(appliedCoupon);
      influencerId = inf.id;
      const commissionRate = inf.commission_value || 8;
      commissionAmount = Math.round(((subtotal - discountAmount) * commissionRate) / 100);

      const commStatus = item.ordStatus === 'delivered' ? 'eligible' : (item.ordStatus === 'cancelled' ? 'reversed' : 'pending');

      executionLog.commissionLedger.push({
        influencer_id: inf.id,
        order_number: orderNumber,
        commission_type_snapshot: 'percentage',
        commission_value_snapshot: commissionRate,
        commission_base_amount: subtotal - discountAmount,
        commission_amount: commissionAmount,
        status: commStatus,
        notes: `Attributed via promo ${appliedCoupon}`
      });
    }

    let finalNotes = `Golden Dataset Order [${item.ordStatus.toUpperCase()}]`;
    if (item.isFullReturnRefund || item.isReturnRequest || item.isReturnRestock) {
      finalNotes += ' [RETURNED]';
    }

    const orderRow = {
      order_number: orderNumber,
      customer_name: item.cust.name,
      customer_email: item.cust.email,
      customer_phone: item.cust.phone,
      shipping_address: {
        name: item.cust.name,
        address_line1: `${item.cust.city} High Street`,
        city: item.cust.city,
        state: item.cust.state,
        postal_code: item.cust.pincode,
        phone: item.cust.phone
      },
      items: lineItems,
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      coupon_code: appliedCoupon,
      payment_method: item.payMethod,
      payment_status: item.payStatus,
      order_status: item.ordStatus,
      paid_at: item.payStatus === 'paid' ? orderCreatedAt : null,
      courier_name: item.ordStatus === 'shipped' || item.ordStatus === 'delivered' ? 'Shadowfax' : null,
      tracking_number: item.ordStatus === 'shipped' || item.ordStatus === 'delivered' ? `SFX-${orderNumber.replace('LZR-', '')}` : null,
      notes: finalNotes,
      created_at: orderCreatedAt,
      updated_at: orderCreatedAt
    };

    insertedOrders.push(orderRow);

    const isRestored = item.cancelRestock || item.isFullReturnRefund || item.isReturnRestock;
    for (const line of lineItems) {
      const vId = line.variant_id;
      const currentDelta = inventoryDeltas.get(vId) || 0;
      if (!isRestored && item.ordStatus !== 'cancelled') {
        inventoryDeltas.set(vId, currentDelta + 1);
      }
    }
  }

  // Insert orders in chunks
  console.log(`4. Inserting ${insertedOrders.length} orders into Supabase 'orders' table...`);
  const chunkSize = 50;
  for (let c = 0; c < insertedOrders.length; c += chunkSize) {
    const chunk = insertedOrders.slice(c, c + chunkSize);
    const { error: insErr } = await supabase.from('orders').insert(chunk);
    if (insErr) {
      console.error(`Error inserting chunk ${c}:`, insErr);
      executionLog.errors.push(insErr.message);
    } else {
      executionLog.ordersCreated += chunk.length;
      executionLog.mutationsPerformed += chunk.length;
    }
  }

  // Fetch created order IDs to bind commissions
  const { data: dbOrders } = await supabase.from('orders').select('id, order_number');
  const orderIdMap = new Map();
  dbOrders.forEach(o => orderIdMap.set(o.order_number, o.id));

  // Insert commissions
  if (executionLog.commissionLedger.length > 0) {
    console.log(`5. Inserting ${executionLog.commissionLedger.length} influencer commission entries...`);
    const formattedCommissions = executionLog.commissionLedger.map(comm => ({
      influencer_id: comm.influencer_id,
      order_id: orderIdMap.get(comm.order_number),
      commission_type_snapshot: comm.commission_type_snapshot,
      commission_value_snapshot: comm.commission_value_snapshot,
      commission_base_amount: comm.commission_base_amount,
      commission_amount: comm.commission_amount,
      status: comm.status,
      notes: comm.notes
    })).filter(c => Boolean(c.order_id));

    const { error: commErr } = await supabase.from('influencer_commissions').insert(formattedCommissions);
    if (commErr) {
      console.warn('Error inserting commissions:', commErr.message);
      executionLog.errors.push(commErr.message);
    } else {
      executionLog.mutationsPerformed += formattedCommissions.length;
    }
  }

  // Update product_variants stock
  console.log('6. Updating live SKU inventory based on net consumed orders...');
  for (const [vId, consumedQty] of inventoryDeltas.entries()) {
    const variant = variants.find(v => v.id === vId);
    if (variant) {
      const startStock = startingInventorySnapshot.find(s => s.sku === variant.sku)?.stock || variant.stock_quantity;
      const newStock = Math.max(0, startStock - consumedQty);
      const { error: updErr } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq('id', vId);

      if (updErr) {
        console.warn(`Error updating stock for variant ${vId}:`, updErr.message);
      } else {
        executionLog.mutationsPerformed += 1;
        executionLog.inventoryMovements.push({
          variant_id: vId,
          sku: variant.sku,
          starting_stock: startStock,
          consumed_units: consumedQty,
          ending_stock: newStock
        });
      }
    }
  }

  // Update coupon times_used
  console.log('7. Updating coupon usage counts in database...');
  const couponCounts = new Map();
  executionLog.couponRedemptions.forEach(r => {
    couponCounts.set(r.code, (couponCounts.get(r.code) || 0) + 1);
  });

  for (const [cCode, count] of couponCounts.entries()) {
    await supabase
      .from('coupons')
      .update({ times_used: count })
      .eq('code', cCode);
    executionLog.mutationsPerformed += 1;
  }

  // 6. Capture Raw Actual System State
  console.log('8. Querying and capturing all raw database and service metrics...');
  const { data: finalOrders } = await supabase.from('orders').select('*');
  const { data: finalVariants } = await supabase.from('product_variants').select('*');
  const { data: finalCoupons } = await supabase.from('coupons').select('*');
  const { data: finalCommissions } = await supabase.from('influencer_commissions').select('*');

  const activeOrders = (finalOrders || []).filter(o => !o.notes || !o.notes.includes('[ARCHIVED]'));
  const paidOrders = activeOrders.filter(o => o.payment_status === 'paid' || (o.payment_method === 'cod' && o.order_status === 'delivered'));
  const paidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const grossOrders = activeOrders.filter(o => o.order_status !== 'cancelled');
  const grossRevenue = grossOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const aov = paidOrders.length > 0 ? Math.round(paidRevenue / paidOrders.length) : 0;
  const prepaidCount = activeOrders.filter(o => o.payment_method === 'upi' || o.payment_method === 'card' || o.payment_method === 'razorpay' || o.payment_method === 'netbanking').length;
  const codCount = activeOrders.filter(o => o.payment_method === 'cod').length;

  const actualResults = {
    metadata: {
      generatedAt: new Date().toISOString(),
      dataset: 'LOOZARS_GOLDEN_DATASET_PHASE_2',
      executionDurationMs: Date.now() - new Date(executionLog.startTime).getTime()
    },
    systemSummary: {
      customersProcessed: executionLog.customersProcessed,
      ordersAttempted: executionLog.ordersAttempted,
      ordersCreatedInDB: finalOrders?.length || 0,
      mutationsPerformed: executionLog.mutationsPerformed,
      rejectedOperationsCount: executionLog.rejectedOperations.length,
      errorsCount: executionLog.errors.length
    },
    databaseCounts: {
      orders: finalOrders?.length || 0,
      product_variants: finalVariants?.length || 0,
      coupons: finalCoupons?.length || 0,
      influencer_commissions: finalCommissions?.length || 0
    },
    adminLiveMetrics: {
      totalOrders: activeOrders.length,
      paidOrdersCount: paidOrders.length,
      paidRevenue: paidRevenue,
      paidRevenueFormatted: '₹' + paidRevenue.toLocaleString('en-IN'),
      grossRevenue: grossRevenue,
      grossRevenueFormatted: '₹' + grossRevenue.toLocaleString('en-IN'),
      aov: aov,
      aovFormatted: '₹' + aov.toLocaleString('en-IN'),
      prepaidCount: prepaidCount,
      prepaidPercent: activeOrders.length ? Math.round((prepaidCount / activeOrders.length) * 100) : 0,
      codCount: codCount,
      codPercent: activeOrders.length ? Math.round((codCount / activeOrders.length) * 100) : 0
    },
    orderStatusBreakdown: {
      delivered: activeOrders.filter(o => o.order_status === 'delivered').length,
      shipped: activeOrders.filter(o => o.order_status === 'shipped').length,
      processing: activeOrders.filter(o => o.order_status === 'processing').length,
      pending: activeOrders.filter(o => o.order_status === 'pending').length,
      confirmed: activeOrders.filter(o => o.order_status === 'confirmed').length,
      cancelled: activeOrders.filter(o => o.order_status === 'cancelled').length,
      returned: activeOrders.filter(o => o.order_status === 'returned' || o.payment_status === 'refunded' || (o.notes || '').includes('[RETURNED]')).length
    },
    paymentStatusBreakdown: {
      paid: activeOrders.filter(o => o.payment_status === 'paid').length,
      pending: activeOrders.filter(o => o.payment_status === 'pending').length,
      failed: activeOrders.filter(o => o.payment_status === 'failed').length,
      refunded: activeOrders.filter(o => o.payment_status === 'refunded').length
    },
    finalInventoryBySku: finalVariants.map(v => {
      const start = startingInventorySnapshot.find(s => s.sku === v.sku)?.stock || 0;
      return {
        variant_id: v.id,
        sku: v.sku,
        starting_stock: start,
        final_stock: v.stock_quantity,
        net_deducted: start - v.stock_quantity
      };
    }),
    couponUsageActuals: finalCoupons.map(c => ({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      times_used_in_db: c.times_used
    })),
    influencerCommissionsActuals: {
      totalEntries: finalCommissions?.length || 0,
      totalCommissionAccrued: (finalCommissions || []).reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0),
      eligibleCount: (finalCommissions || []).filter(c => c.status === 'eligible').length,
      pendingCount: (finalCommissions || []).filter(c => c.status === 'pending').length,
      reversedCount: (finalCommissions || []).filter(c => c.status === 'reversed').length
    },
    rejectedOperationsLog: executionLog.rejectedOperations,
    abandonedCartsLog: executionLog.abandonedCartsProcessed
  };

  // Save machine-readable JSON output
  const jsonPath = path.resolve(process.cwd(), 'golden_test_actual_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(actualResults, null, 2), 'utf-8');
  console.log(`Saved machine-readable output to ${jsonPath}`);
  console.log('Execution Phase 2 Complete!');
}

runGoldenDatasetPhase2().catch(e => {
  console.error('Phase 2 Runner Error:', e);
  process.exit(1);
});
