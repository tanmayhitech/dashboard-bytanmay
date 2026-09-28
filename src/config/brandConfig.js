/**
 * BRAND_CONFIG
 * 
 * Centralized Brand & Company Configuration.
 * To rebrand this Admin & E-Commerce Engine for any new website or client,
 * simply update the values in this file.
 */
export const BRAND_CONFIG = {
  // Brand Identity
  brandName: 'LOOZARS',
  tagline: 'Independent Streetwear & Archive Apparel',
  legalName: 'LOOZARS Archive Apparel Atelier',
  
  // Web & Contact
  websiteUrl: 'https://www.theloozars.com',
  websiteDomain: 'theloozars.com',
  supportEmail: 'support@theloozars.com',
  supportPhone: '+91 98765 43210',
  
  // Registered Business Address (Printed on Invoices & Bills)
  registeredAddress: {
    line1: 'Loozars Archive Apparel Atelier',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '208001'
  },
  
  // Financial & Commerce Defaults
  currencySymbol: '₹',
  currencyCode: 'INR',
  freeShippingThreshold: 2000,
  standardShippingFee: 99,
  defaultTaxRatePercent: 5,
  
  // Creator / Affiliate System Defaults
  defaultInfluencerCommissionPercent: 8,
  defaultCustomerDiscountPercent: 10,
  
  // System Metadata
  orderPrefix: '#LZR',
  invoicePrefix: 'INV'
};

export default BRAND_CONFIG;
