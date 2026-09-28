/**
 * LOOZARS® Pincode & Delivery Estimation Service
 * Provides instant city/state auto-detection and delivery turnaround calculation
 * for Indian Postal Codes (with online India Post API + local instant fallback).
 */

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const PINCODE_PREFIX_MAP = {
  // Delhi
  '11': { city: 'New Delhi', state: 'Delhi', estDays: '2–3 Business Days', isMetro: true },
  
  // Haryana
  '12': { city: 'Gurugram', state: 'Haryana', estDays: '2–3 Business Days', isMetro: true },
  '13': { city: 'Faridabad', state: 'Haryana', estDays: '2–3 Business Days', isMetro: true },
  
  // Punjab & Chandigarh
  '14': { city: 'Ludhiana', state: 'Punjab', estDays: '3–4 Business Days', isMetro: false },
  '15': { city: 'Amritsar', state: 'Punjab', estDays: '3–4 Business Days', isMetro: false },
  '16': { city: 'Chandigarh', state: 'Chandigarh', estDays: '2–3 Business Days', isMetro: true },
  
  // Himachal Pradesh
  '17': { city: 'Shimla', state: 'Himachal Pradesh', estDays: '3–5 Business Days', isMetro: false },
  
  // Jammu & Kashmir / Ladakh
  '18': { city: 'Jammu', state: 'Jammu and Kashmir', estDays: '4–6 Business Days', isMetro: false },
  '19': { city: 'Srinagar', state: 'Jammu and Kashmir', estDays: '4–6 Business Days', isMetro: false },
  
  // Uttar Pradesh & Uttarakhand
  '20': { city: 'Noida', state: 'Uttar Pradesh', estDays: '2–3 Business Days', isMetro: true },
  '21': { city: 'Prayagraj', state: 'Uttar Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '22': { city: 'Lucknow', state: 'Uttar Pradesh', estDays: '3–4 Business Days', isMetro: true },
  '23': { city: 'Varanasi', state: 'Uttar Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '24': { city: 'Dehradun', state: 'Uttarakhand', estDays: '3–4 Business Days', isMetro: false },
  '25': { city: 'Meerut', state: 'Uttar Pradesh', estDays: '2–3 Business Days', isMetro: false },
  '26': { city: 'Bareilly', state: 'Uttar Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '27': { city: 'Gorakhpur', state: 'Uttar Pradesh', estDays: '3–5 Business Days', isMetro: false },
  '28': { city: 'Agra', state: 'Uttar Pradesh', estDays: '3–4 Business Days', isMetro: false },
  
  // Rajasthan
  '30': { city: 'Jaipur', state: 'Rajasthan', estDays: '2–3 Business Days', isMetro: true },
  '31': { city: 'Kota', state: 'Rajasthan', estDays: '3–4 Business Days', isMetro: false },
  '32': { city: 'Bharatpur', state: 'Rajasthan', estDays: '3–4 Business Days', isMetro: false },
  '33': { city: 'Bikaner', state: 'Rajasthan', estDays: '3–5 Business Days', isMetro: false },
  '34': { city: 'Jodhpur', state: 'Rajasthan', estDays: '3–4 Business Days', isMetro: false },
  
  // Gujarat, Daman, Diu, Dadra
  '36': { city: 'Rajkot', state: 'Gujarat', estDays: '2–3 Business Days', isMetro: false },
  '37': { city: 'Bhuj / Kutch', state: 'Gujarat', estDays: '3–5 Business Days', isMetro: false },
  '38': { city: 'Ahmedabad', state: 'Gujarat', estDays: '2–3 Business Days', isMetro: true },
  '39': { city: 'Surat', state: 'Gujarat', estDays: '2–3 Business Days', isMetro: true },
  
  // Maharashtra & Goa
  '40': { city: 'Mumbai', state: 'Maharashtra', estDays: '2–3 Business Days', isMetro: true },
  '41': { city: 'Pune', state: 'Maharashtra', estDays: '2–3 Business Days', isMetro: true },
  '42': { city: 'Thane / Nashik', state: 'Maharashtra', estDays: '2–3 Business Days', isMetro: true },
  '43': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', estDays: '3–4 Business Days', isMetro: false },
  '44': { city: 'Nagpur', state: 'Maharashtra', estDays: '3–4 Business Days', isMetro: true },
  
  // Madhya Pradesh & Chhattisgarh
  '45': { city: 'Indore', state: 'Madhya Pradesh', estDays: '2–3 Business Days', isMetro: true },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh', estDays: '3–4 Business Days', isMetro: true },
  '47': { city: 'Gwalior', state: 'Madhya Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '48': { city: 'Jabalpur', state: 'Madhya Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '49': { city: 'Raipur', state: 'Chhattisgarh', estDays: '3–4 Business Days', isMetro: false },
  
  // Andhra Pradesh & Telangana
  '50': { city: 'Hyderabad', state: 'Telangana', estDays: '2–3 Business Days', isMetro: true },
  '51': { city: 'Tirupati', state: 'Andhra Pradesh', estDays: '3–4 Business Days', isMetro: false },
  '52': { city: 'Vijayawada', state: 'Andhra Pradesh', estDays: '3–4 Business Days', isMetro: true },
  '53': { city: 'Visakhapatnam', state: 'Andhra Pradesh', estDays: '3–4 Business Days', isMetro: true },
  
  // Karnataka
  '56': { city: 'Bengaluru', state: 'Karnataka', estDays: '2–3 Business Days', isMetro: true },
  '57': { city: 'Mangaluru', state: 'Karnataka', estDays: '3–4 Business Days', isMetro: false },
  '58': { city: 'Hubballi', state: 'Karnataka', estDays: '3–4 Business Days', isMetro: false },
  '59': { city: 'Belagavi', state: 'Karnataka', estDays: '3–4 Business Days', isMetro: false },
  
  // Tamil Nadu & Puducherry
  '60': { city: 'Chennai', state: 'Tamil Nadu', estDays: '2–3 Business Days', isMetro: true },
  '61': { city: 'Tiruchirappalli', state: 'Tamil Nadu', estDays: '3–4 Business Days', isMetro: false },
  '62': { city: 'Madurai', state: 'Tamil Nadu', estDays: '3–4 Business Days', isMetro: false },
  '63': { city: 'Salem / Vellore', state: 'Tamil Nadu', estDays: '3–4 Business Days', isMetro: false },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu', estDays: '2–3 Business Days', isMetro: true },
  
  // Kerala & Lakshadweep
  '67': { city: 'Kozhikode', state: 'Kerala', estDays: '3–4 Business Days', isMetro: false },
  '68': { city: 'Kochi', state: 'Kerala', estDays: '2–3 Business Days', isMetro: true },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala', estDays: '3–4 Business Days', isMetro: false },
  
  // West Bengal, Sikkim & Andaman
  '70': { city: 'Kolkata', state: 'West Bengal', estDays: '2–3 Business Days', isMetro: true },
  '71': { city: 'Howrah', state: 'West Bengal', estDays: '2–3 Business Days', isMetro: true },
  '72': { city: 'Midnapore', state: 'West Bengal', estDays: '3–4 Business Days', isMetro: false },
  '73': { city: 'Siliguri', state: 'West Bengal', estDays: '3–5 Business Days', isMetro: false },
  '74': { city: 'North 24 Parganas', state: 'West Bengal', estDays: '2–3 Business Days', isMetro: false },
  
  // Odisha
  '75': { city: 'Bhubaneswar', state: 'Odisha', estDays: '3–4 Business Days', isMetro: true },
  '76': { city: 'Cuttack', state: 'Odisha', estDays: '3–4 Business Days', isMetro: false },
  '77': { city: 'Rourkela', state: 'Odisha', estDays: '3–5 Business Days', isMetro: false },
  
  // North-Eastern States
  '78': { city: 'Guwahati', state: 'Assam', estDays: '3–5 Business Days', isMetro: false },
  '79': { city: 'Shillong / Imphal', state: 'Meghalaya', estDays: '4–6 Business Days', isMetro: false },
  
  // Bihar & Jharkhand
  '80': { city: 'Patna', state: 'Bihar', estDays: '3–4 Business Days', isMetro: true },
  '81': { city: 'Bhagalpur', state: 'Bihar', estDays: '3–5 Business Days', isMetro: false },
  '82': { city: 'Gaya / Muzaffarpur', state: 'Bihar', estDays: '3–5 Business Days', isMetro: false },
  '83': { city: 'Ranchi', state: 'Jharkhand', estDays: '3–4 Business Days', isMetro: false },
  '84': { city: 'Dhanbad', state: 'Jharkhand', estDays: '3–4 Business Days', isMetro: false },
  '85': { city: 'Jamshedpur', state: 'Jharkhand', estDays: '3–4 Business Days', isMetro: false }
};

// In-memory session cache for fast lookup
const cache = new Map();

/**
 * Normalizes state name to match official INDIAN_STATES list
 */
const normalizeStateName = (stateStr) => {
  if (!stateStr) return 'Maharashtra';
  const clean = String(stateStr).trim().toLowerCase();
  
  const found = INDIAN_STATES.find(s => s.toLowerCase() === clean);
  if (found) return found;

  if (clean.includes('delhi')) return 'Delhi';
  if (clean.includes('jammu') || clean.includes('kashmir')) return 'Jammu and Kashmir';
  if (clean.includes('odisha') || clean.includes('orissa')) return 'Odisha';
  if (clean.includes('uttaranchal') || clean.includes('uttarakhand')) return 'Uttarakhand';
  if (clean.includes('pondicherry') || clean.includes('puducherry')) return 'Puducherry';
  if (clean.includes('andaman')) return 'Andaman and Nicobar Islands';
  if (clean.includes('daman') || clean.includes('diu') || clean.includes('dadra')) return 'Dadra and Nagar Haveli and Daman and Diu';
  if (clean.includes('ladakh')) return 'Ladakh';

  return INDIAN_STATES.find(s => s.toLowerCase().includes(clean) || clean.includes(s.toLowerCase())) || stateStr;
};

/**
 * Validates and detects City, State and Delivery ETA for an Indian Pincode
 * @param {string} pincode - 6-digit postal code
 * @returns {Promise<{ valid: boolean, city?: string, state?: string, estimatedDays?: string, isMetro?: boolean, pincode?: string, error?: string }>}
 */
export const lookupPincode = async (pincode) => {
  if (!pincode) {
    return { valid: false, error: 'Please enter a 6-digit pincode' };
  }

  const cleanPin = String(pincode).trim().replace(/\D/g, '');
  
  if (cleanPin.length !== 6 || cleanPin.startsWith('0')) {
    return { valid: false, error: 'Please enter a valid 6-digit Indian PIN code' };
  }

  if (cache.has(cleanPin)) {
    return cache.get(cleanPin);
  }

  // 3-digit and 2-digit prefix checks
  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);

  let fallbackState = 'Maharashtra';
  let fallbackCity = 'Mumbai';
  let fallbackEst = '2–3 Business Days';
  let fallbackMetro = false;

  if (prefix3 === '403') {
    fallbackState = 'Goa';
    fallbackCity = 'Panaji';
    fallbackEst = '3–4 Business Days';
  } else if (prefix3 === '737') {
    fallbackState = 'Sikkim';
    fallbackCity = 'Gangtok';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '790' || prefix3 === '791' || prefix3 === '792') {
    fallbackState = 'Arunachal Pradesh';
    fallbackCity = 'Itanagar';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '793' || prefix3 === '794') {
    fallbackState = 'Meghalaya';
    fallbackCity = 'Shillong';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '795') {
    fallbackState = 'Manipur';
    fallbackCity = 'Imphal';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '796') {
    fallbackState = 'Mizoram';
    fallbackCity = 'Aizawl';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '797' || prefix3 === '798') {
    fallbackState = 'Nagaland';
    fallbackCity = 'Kohima';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '799') {
    fallbackState = 'Tripura';
    fallbackCity = 'Agartala';
    fallbackEst = '4–6 Business Days';
  } else if (prefix3 === '605') {
    fallbackState = 'Puducherry';
    fallbackCity = 'Puducherry';
    fallbackEst = '2–3 Business Days';
  } else if (prefix3 === '744') {
    fallbackState = 'Andaman and Nicobar Islands';
    fallbackCity = 'Port Blair';
    fallbackEst = '5–7 Business Days';
  } else if (prefix3 === '682') {
    fallbackState = 'Lakshadweep';
    fallbackCity = 'Kavaratti';
    fallbackEst = '5–7 Business Days';
  } else if (PINCODE_PREFIX_MAP[prefix2]) {
    const mapEntry = PINCODE_PREFIX_MAP[prefix2];
    fallbackState = mapEntry.state;
    fallbackCity = mapEntry.city;
    fallbackEst = mapEntry.estDays;
    fallbackMetro = mapEntry.isMetro;
  }

  try {
    // Attempt online lookup with 2.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const normalizedState = normalizeStateName(po.State || fallbackState);
        const result = {
          valid: true,
          pincode: cleanPin,
          city: po.District || po.Block || fallbackCity,
          state: normalizedState,
          postOffice: po.Name,
          estimatedDays: fallbackEst,
          isMetro: fallbackMetro,
          error: null
        };
        cache.set(cleanPin, result);
        return result;
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // Use local fallback
  const result = {
    valid: true,
    pincode: cleanPin,
    city: fallbackCity,
    state: normalizeStateName(fallbackState),
    estimatedDays: fallbackEst,
    isMetro: fallbackMetro,
    error: null
  };
  cache.set(cleanPin, result);
  return result;
};
