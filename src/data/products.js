// Photoshoot Images — DROP 01: RACING DIVISION
import velo01 from '../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import velo02 from '../assets/photoshoot/01-lzr-velo-07-black/velo-02.jpeg';
import velo03 from '../assets/photoshoot/01-lzr-velo-07-black/velo-03.jpeg';
import velo04 from '../assets/photoshoot/01-lzr-velo-07-black/velo-04.jpeg';
import velo05 from '../assets/photoshoot/01-lzr-velo-07-black/velo-05.jpeg';

import burgundy01 from '../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';

import apex01 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-01.jpeg';
import apex02 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import apex03 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-03.jpeg';
import apex04 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-04.jpeg';
import apex05 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-05.jpeg';

import navy01 from '../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-01.jpeg';
import navy02 from '../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-02.jpeg';
import navy03 from '../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-03.jpeg';
import navy04 from '../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-04.jpeg';

// Campaign Shoot Editorial Assets
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';

export const PRODUCTS = [
  {
    id: 'lzr-velo-07',
    sku: 'LZR-D01-01',
    name: 'LZR VELO 07',
    subtitle: 'Black Racing Tee',
    price: 899,
    formattedPrice: '₹899',
    drop: 'DROP 01 — RACING DIVISION',
    category: 'tees',
    tags: ['tees', 'oversized', 'racing'],
    badge: 'DROP 01 / PIECE 01',
    headline: 'FOUR TEES. ONE RACING LANGUAGE.',
    description: 'A black racing-inspired tee featuring bold LZR branding, red and white racing stripes, technical graphics, and motorsport-inspired detailing. Built with an aggressive, fast-paced visual language that gives the piece the feel of a racing uniform reworked for the streets.',
    details: [
      '320 GSM 100% Combed Heavyweight Cotton',
      'Bold LZR motorsport racing uniform screenprint',
      'Red & white technical racing stripes and track details',
      'Woven inner collar label with red metallic embroidery',
      'Pre-shrunk enzyme mineral wash treatment',
      'By The Rare. For The Rare.'
    ],
    fit: 'Signature boxy oversized fit. Dropped shoulders with relaxed drape.',
    images: [
      velo01,
      velo02,
      velo03,
      velo04,
      velo05
    ],
    detailThumbnails: [
      { img: velo02, label: '01 / RACING STRIPE' },
      { img: velo03, label: '02 / TECHNICAL GRAPHIC' },
      { img: velo04, label: '03 / BACK TRACK DETAILS' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: { XS: 4, S: 8, M: 15, L: 20, XL: 8, XXL: 3 },
    measurements: {
      XS: { chest: '42"', length: '28"', shoulder: '20"' },
      S: { chest: '44"', length: '29"', shoulder: '21"' },
      M: { chest: '46"', length: '30"', shoulder: '22"' },
      L: { chest: '48"', length: '31"', shoulder: '23"' },
      XL: { chest: '50"', length: '32"', shoulder: '24"' },
      XXL: { chest: '52"', length: '33"', shoulder: '25"' }
    }
  },
  {
    id: 'lzr-racing-division',
    sku: 'LZR-D01-02',
    name: 'LZR RACING DIVISION',
    subtitle: 'Burgundy Racing Tee',
    price: 899,
    formattedPrice: '₹899',
    drop: 'DROP 01 — RACING DIVISION',
    category: 'tees',
    tags: ['tees', 'oversized', 'racing'],
    badge: 'DROP 01 / PIECE 02',
    headline: 'DARKER, MORE AGGRESSIVE MOTORSPORT AESTHETIC.',
    description: 'A deep burgundy racing tee built around the LZR identity, with oversized central branding, technical linework, halftone graphics, racing typography, and red-and-white detailing. A darker, more aggressive interpretation of the Loozars racing aesthetic.',
    details: [
      '320 GSM Heavy French Terry Compact Cotton',
      'Deep Burgundy mineral-wash finish',
      'Oversized central LZR emblem with technical linework',
      'Halftone racing graphics and red-and-white accents',
      'Reinforced crewneck and reverse exposed stitching',
      'By The Rare. For The Rare.'
    ],
    fit: 'Heavy drop-shoulder boxy fit.',
    images: [
      burgundy01,
      campaignShoot05,
      campaignShoot03
    ],
    detailThumbnails: [
      { img: burgundy01, label: '01 / SILHOUETTE' },
      { img: campaignShoot05, label: '02 / EDITORIAL FIT' },
      { img: campaignShoot03, label: '03 / GROUP ARCHIVE' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { S: 5, M: 11, L: 14, XL: 6, XXL: 2 },
    measurements: {
      S: { chest: '44"', length: '29"', shoulder: '21"' },
      M: { chest: '46"', length: '30"', shoulder: '22"' },
      L: { chest: '48"', length: '31"', shoulder: '23"' },
      XL: { chest: '50"', length: '32"', shoulder: '24"' },
      XXL: { chest: '52"', length: '33"', shoulder: '25"' }
    }
  },
  {
    id: 'lzr-apex-club',
    sku: 'LZR-D01-03',
    name: 'LZR APEX CLUB',
    subtitle: 'Off-White Racing Tee',
    price: 899,
    formattedPrice: '₹899',
    drop: 'DROP 01 — RACING DIVISION',
    category: 'tees',
    tags: ['tees', 'oversized', 'racing'],
    badge: 'DROP 01 / PIECE 03',
    headline: 'DRIVER NUMBER 88 — PRO JERSEY SILHOUETTE.',
    description: 'An off-white racing tee dominated by the LZR logo and 88 driver number. Inspired by professional driver jerseys, it combines bold numerical graphics, technical typography, black side detailing, and racing stripes for a clean motorsport silhouette.',
    details: [
      '320 GSM Premium Off-White Heavy Cotton',
      'Oversized 88 driver number & LZR typography',
      'Black side-panel detailing & racing stripes',
      'Inspired by professional driver track jerseys',
      'Twin-needle reinforced construction',
      'By The Rare. For The Rare.'
    ],
    fit: 'Relaxed motorsport jersey drape.',
    images: [
      apex02,
      apex01,
      apex04,
      apex03,
      apex05
    ],
    detailThumbnails: [
      { img: apex02, label: '01 / DRIVER 88' },
      { img: apex04, label: '02 / SIDE RACING STRIPES' },
      { img: apex01, label: '03 / TRACK SILHOUETTE' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: { XS: 3, S: 7, M: 12, L: 10, XL: 4 },
    measurements: {
      XS: { chest: '42"', length: '28"', shoulder: '20"' },
      S: { chest: '44"', length: '29"', shoulder: '21"' },
      M: { chest: '46"', length: '30"', shoulder: '22"' },
      L: { chest: '48"', length: '31"', shoulder: '23"' },
      XL: { chest: '50"', length: '32"', shoulder: '24"' }
    }
  },
  {
    id: 'lzr-ocean-speedway',
    sku: 'LZR-D01-04',
    name: 'LZR OCEAN SPEEDWAY',
    subtitle: 'Navy Racing Tee',
    price: 899,
    formattedPrice: '₹899',
    drop: 'DROP 01 — RACING DIVISION',
    category: 'tees',
    tags: ['tees', 'oversized', 'racing'],
    badge: 'DROP 01 / PIECE 04',
    headline: 'COASTAL CULTURE MEETS HIGH-VELOCITY SPEED.',
    description: 'A deep navy racing tee inspired by the intersection of coastal culture and speed. Featuring large LOOZARS branding, technical racing graphics, white stripe detailing, and layered typography, it brings a slightly more relaxed coastal character to the Drop 01 racing aesthetic.',
    details: [
      '320 GSM Heavyweight Deep Navy Cotton',
      'Large LOOZARS technical speedway branding',
      'High-contrast white stripe detailing',
      'Layered coastal motorsport typography',
      'Pre-shrunk vintage wash finish',
      'By The Rare. For The Rare.'
    ],
    fit: 'Wide boxy streetwear fit.',
    images: [
      navy01,
      navy03,
      navy02,
      navy04
    ],
    detailThumbnails: [
      { img: navy01, label: '01 / SPEEDWAY EMBLEM' },
      { img: navy03, label: '02 / WHITE STRIPE ACCENTS' },
      { img: navy02, label: '03 / VINTAGE DRAPE' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { S: 5, M: 12, L: 16, XL: 7, XXL: 3 },
    measurements: {
      S: { chest: '44"', length: '29"', shoulder: '21"' },
      M: { chest: '46"', length: '30"', shoulder: '22"' },
      L: { chest: '48"', length: '31"', shoulder: '23"' },
      XL: { chest: '50"', length: '32"', shoulder: '24"' },
      XXL: { chest: '52"', length: '33"', shoulder: '25"' }
    }
  }
];

export const INSTAGRAM_POSTS = [
  { id: 'ig-1', image: campaignShoot03, tag: 'DROP 01 // RACING DIVISION' },
  { id: 'ig-2', image: campaignShoot01, tag: 'LZR VELO 07 / 07 SPEED' },
  { id: 'ig-3', image: campaignShoot05, tag: 'RACING DIVISION / BURGUNDY' },
  { id: 'ig-4', image: campaignShoot04, tag: 'APEX CLUB // DRIVER 88' },
  { id: 'ig-5', image: navy01, tag: 'OCEAN SPEEDWAY // COASTAL' },
  { id: 'ig-6', image: campaignShoot02, tag: 'BY THE RARE. FOR THE RARE.' },
];

export const CAMPAIGN_EDITORIALS = [
  { id: 'camp-1', image: campaignShoot03, title: 'DROP 01 CAPSULE', subtitle: 'FOUR TEES. ONE RACING LANGUAGE.' },
  { id: 'camp-2', image: campaignShoot01, title: 'LZR VELO 07', subtitle: 'RAW SPEED // 35MM ARCHIVE' },
  { id: 'camp-3', image: campaignShoot05, title: 'LZR RACING DIVISION', subtitle: 'BURGUNDY & MOTORSPORT GRAIN' },
  { id: 'camp-4', image: campaignShoot04, title: 'APEX 88 & VELO 07', subtitle: 'UNDERGROUND GARAGE SESSIONS' },
  { id: 'camp-5', image: campaignShoot02, title: 'NIGHT RUN', subtitle: 'MUMBAI // DELHI // SPEEDWAY' }
];

export const DROP_INFO = {
  number: '01',
  title: 'RACING DIVISION',
  fullTitle: 'LOOZARS — DROP 01: RACING DIVISION',
  subtitle: 'FOUR TEES. ONE RACING LANGUAGE.',
  tagline: 'BY THE RARE. FOR THE RARE.',
  season: 'EST. 2025 // INDIA',
  statement: 'WEAR WHAT SHOULDN’T EXIST.',
  curation: 'A streetwear collection built around speed, movement, and the raw energy of motorsport. Drop 01 translates racing-inspired graphics, technical typography, driver numbers, track details, and bold jersey construction into everyday streetwear.',
  piecesCount: 4,
  location: 'MUMBAI // DELHI // SPEEDWAY ARCHIVE'
};
