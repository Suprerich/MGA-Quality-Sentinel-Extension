import { ProductItem, ScanPayload, ScanSettings, WatchlistItem } from '../types';
import { recordTrendSnapshot } from './trendService';

export function isExtensionEnvironment(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).chrome?.runtime?.id);
}

export function buildSearchUrl(retailer: string, keyword: string): string {
  const q = encodeURIComponent(keyword || 'MGA Entertainment');
  switch (retailer) {
    case 'walmart_ca':
      return `https://www.walmart.ca/en/search?q=${q}`;
    case 'walmart_us':
      return `https://www.walmart.com/search?q=${q}`;
    case 'amazon_us':
      return `https://www.amazon.com/s?k=${q}`;
    case 'amazon_ca':
      return `https://www.amazon.ca/s?k=${q}`;
    case 'target':
      return `https://www.target.com/s?searchTerm=${q}`;
    default:
      return `https://www.walmart.com/search?q=${q}`;
  }
}

/**
 * High-fidelity initial MGA QA team seed dataset
 * Accurately models multi-retailer ratings, defect classifications, and customer quotes.
 */
export const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    retailer: 'Target',
    platform: 'TARGET',
    name: "MGA's Miniverse Make It Mini Lord of the Rings Series 1",
    url: 'https://www.target.com/p/mga-s-miniverse-make-it-mini-lord-of-the-rings/-/A-89984321',
    rating: 2.4,
    reviewCount: 312,
    targetNumber: '89984321',
    upcNumber: '035051594238',
    modelNumber: '594238',
    countryOfOrigin: 'China',
    alertStatus: 'ALERT',
    mainIssue: 'Function issue',
    issueBreakdownText: 'Function issue(18), Safety(12), Missing parts(7), Quality(4)',
    checkedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    complaints: [
      {
        userTag: 'Sarah M.',
        reviewTime: 'Oct 28, 2026',
        reviewRating: 1,
        sentiment: 'NEGATIVE',
        issueType: 'Safety',
        keywords: ['chemical smell', 'strong smell', 'toxic', 'unsafe'],
        comment:
          'Extremely strong chemical smell and fumes coming off the resin liquid. We had to open all windows. Not safe for kids to play inside without serious ventilation!'
      },
      {
        userTag: 'David R.',
        reviewTime: 'Oct 25, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Function issue',
        keywords: ['curing', 'uv light', 'not working', 'sticky'],
        comment:
          'Resin will not cure even after 30 minutes under direct UV light torch. The sword blade remained sticky and completely ruined the mini forge model.'
      },
      {
        userTag: 'Jennifer K.',
        reviewTime: 'Oct 22, 2026',
        reviewRating: 1,
        sentiment: 'NEGATIVE',
        issueType: 'Missing parts',
        keywords: ['missing', 'piece missing', 'incomplete'],
        comment:
          'Opened the ball and the Narsil hilt accessory was missing entirely. My son was devastated. Incomplete package straight from the store.'
      },
      {
        userTag: 'Brian T.',
        reviewTime: 'Oct 19, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Damage',
        keywords: ['broken', 'snapped', 'cheap'],
        comment:
          'The tiny display stand broke in half when attempting to mount the finished piece. Plastic is brittle and snaps with negligible force.'
      }
    ]
  },
  {
    id: 'p-2',
    retailer: 'Walmart US',
    platform: 'WMUS',
    name: "MGA's Miniverse Make It Mini Lord of the Rings Series 1",
    url: 'https://www.walmart.com/ip/Miniverse-Make-It-Mini-Lord-of-the-Rings/6000207908091',
    rating: 3.1,
    reviewCount: 489,
    walmartNumber: '6000207908091',
    upcNumber: '035051594238',
    modelNumber: '594238',
    countryOfOrigin: 'China',
    alertStatus: 'ALERT',
    mainIssue: 'Function issue',
    issueBreakdownText: 'Function issue(15), Quality(9), Safety(6)',
    checkedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    complaints: [
      {
        userTag: 'Amanda C.',
        reviewTime: 'Oct 29, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Function issue',
        keywords: ['curing', 'uv light', 'sticky', 'stopped working'],
        comment:
          'Followed all instructions to the letter and the resin bottle was already thick and partially polymerized inside the bottle. Would not pour or cure.'
      },
      {
        userTag: 'Mark P.',
        reviewTime: 'Oct 20, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Safety',
        keywords: ['chemical smell', 'burn', 'smell'],
        comment:
          'Strong acrid smell that irritated my daughter’s throat. Caution advised for indoor crafts.'
      }
    ]
  },
  {
    id: 'p-3',
    retailer: 'Amazon US',
    platform: 'AMZUS',
    name: "MGA's Miniverse Make It Mini Lord of the Rings Series 1",
    url: 'https://www.amazon.com/dp/B0D5B7M88X',
    rating: 3.8,
    reviewCount: 840,
    amazonNumber: 'B0D5B7M88X',
    upcNumber: '035051594238',
    modelNumber: '594238',
    countryOfOrigin: 'China',
    alertStatus: 'ALERT',
    mainIssue: 'Missing parts',
    issueBreakdownText: 'Missing parts(14), Function issue(11), Packaging(8)',
    checkedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    complaints: [
      {
        userTag: 'ToyCollector88',
        reviewTime: 'Nov 01, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Missing parts',
        keywords: ['missing', 'empty', 'not included'],
        comment:
          'Received a duplicate capsule that was missing the resin bottle entirely. Cannot complete the craft.'
      }
    ]
  },
  {
    id: 'p-4',
    retailer: 'Target',
    platform: 'TARGET',
    name: 'Little Tikes Power Cuts Chainsaw Toy with Real Sound',
    url: 'https://www.target.com/p/little-tikes-power-cuts-chainsaw/-/A-79841203',
    rating: 2.1,
    reviewCount: 165,
    targetNumber: '79841203',
    upcNumber: '050743657382',
    modelNumber: '657382',
    countryOfOrigin: 'Vietnam',
    alertStatus: 'ALERT',
    mainIssue: 'Function issue',
    issueBreakdownText: 'Function issue(24), Damage(8), Quality(5)',
    checkedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    complaints: [
      {
        userTag: 'Grandpa Jim',
        reviewTime: 'Oct 30, 2026',
        reviewRating: 1,
        sentiment: 'NEGATIVE',
        issueType: 'Function issue',
        keywords: ['stopped working', 'not working', "doesn't work", 'motor'],
        comment:
          'Chainsaw motor worked for exactly 10 minutes on Christmas morning, then died completely. Put fresh Duracell batteries in, still dead.'
      },
      {
        userTag: 'Rachel H.',
        reviewTime: 'Oct 26, 2026',
        reviewRating: 1,
        sentiment: 'NEGATIVE',
        issueType: 'Function issue',
        keywords: ['pull cord', 'broken', 'not working'],
        comment:
          'The pull cord mechanism jammed on the second pull and won’t retract. Internal spring snapped.'
      },
      {
        userTag: 'Chris V.',
        reviewTime: 'Oct 14, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Damage',
        keywords: ['cracked', 'plastic', 'broken'],
        comment:
          'Chain rubber belt separated from the guide gear within two days of normal toddler play.'
      }
    ]
  },
  {
    id: 'p-5',
    retailer: 'Walmart US',
    platform: 'WMUS',
    name: 'Little Tikes Power Cuts Chainsaw Toy with Real Sound',
    url: 'https://www.walmart.com/ip/Little-Tikes-Power-Cuts-Chainsaw/849302194',
    rating: 2.8,
    reviewCount: 220,
    walmartNumber: '849302194',
    upcNumber: '050743657382',
    modelNumber: '657382',
    countryOfOrigin: 'Vietnam',
    alertStatus: 'ALERT',
    mainIssue: 'Function issue',
    issueBreakdownText: 'Function issue(19), Quality(7)',
    checkedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    complaints: [
      {
        userTag: 'MomOfThree',
        reviewTime: 'Oct 27, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Function issue',
        keywords: ['battery drain', 'stopped working', 'defective'],
        comment:
          'Eats 3 AA batteries every 24 hours even when turned off. Massive parasitic battery drain.'
      }
    ]
  },
  {
    id: 'p-6',
    retailer: 'Amazon US',
    platform: 'AMZUS',
    name: 'Little Tikes Power Cuts Chainsaw Toy with Real Sound',
    url: 'https://www.amazon.com/dp/B085B99Z1P',
    rating: 3.2,
    reviewCount: 390,
    amazonNumber: 'B085B99Z1P',
    upcNumber: '050743657382',
    modelNumber: '657382',
    countryOfOrigin: 'Vietnam',
    alertStatus: 'ALERT',
    mainIssue: 'Function issue',
    issueBreakdownText: 'Function issue(18), Damage(6)',
    checkedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    complaints: []
  },
  {
    id: 'p-7',
    retailer: 'Walmart US',
    platform: 'WMUS',
    name: 'L.O.L. Surprise! O.M.G. Core Fashion Doll Class Prez',
    url: 'https://www.walmart.com/ip/LOL-Surprise-OMG-Class-Prez/392019482',
    rating: 4.6,
    reviewCount: 1420,
    walmartNumber: '392019482',
    upcNumber: '035051569427',
    modelNumber: '569427',
    countryOfOrigin: 'China',
    alertStatus: 'OK',
    mainIssue: 'Quality',
    issueBreakdownText: 'Quality(4), Packaging(3)',
    checkedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    complaints: [
      {
        userTag: 'DollFanatic',
        reviewTime: 'Oct 29, 2026',
        reviewRating: 4,
        sentiment: 'POSITIVE',
        issueType: 'Quality',
        keywords: ['quality is good', 'cute'],
        comment: 'Gorgeous doll, hair is soft and outfits are detailed. Small paint scuff on shoe.'
      }
    ]
  },
  {
    id: 'p-8',
    retailer: 'Target',
    platform: 'TARGET',
    name: 'L.O.L. Surprise! O.M.G. Core Fashion Doll Class Prez',
    url: 'https://www.target.com/p/lol-surprise-omg-class-prez/-/A-82194820',
    rating: 4.5,
    reviewCount: 680,
    targetNumber: '82194820',
    upcNumber: '035051569427',
    modelNumber: '569427',
    countryOfOrigin: 'China',
    alertStatus: 'OK',
    mainIssue: 'Packaging',
    issueBreakdownText: 'Packaging(5), Quality(2)',
    checkedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    complaints: []
  },
  {
    id: 'p-9',
    retailer: 'Amazon US',
    platform: 'AMZUS',
    name: 'L.O.L. Surprise! O.M.G. Core Fashion Doll Class Prez',
    url: 'https://www.amazon.com/dp/B0859V5R4L',
    rating: 4.7,
    reviewCount: 3850,
    amazonNumber: 'B0859V5R4L',
    upcNumber: '035051569427',
    modelNumber: '569427',
    countryOfOrigin: 'China',
    alertStatus: 'OK',
    mainIssue: 'Quality',
    issueBreakdownText: 'Quality(12), Delivery(5)',
    checkedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    complaints: []
  },
  {
    id: 'p-10',
    retailer: 'Walmart Canada',
    platform: 'WMCA',
    name: 'L.O.L. Surprise! O.M.G. Core Fashion Doll Class Prez',
    url: 'https://www.walmart.ca/en/ip/LOL-Surprise-OMG-Class-Prez/60002019482',
    rating: 4.4,
    reviewCount: 215,
    walmartNumber: '60002019482',
    upcNumber: '035051569427',
    modelNumber: '569427',
    countryOfOrigin: 'China',
    alertStatus: 'OK',
    mainIssue: 'Quality',
    issueBreakdownText: 'Quality(2)',
    checkedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    complaints: []
  },
  {
    id: 'p-11',
    retailer: 'Amazon US',
    platform: 'AMZUS',
    name: 'Bratz Original 20th Anniversary Fashion Doll Cameron',
    url: 'https://www.amazon.com/dp/B08WGV8M81',
    rating: 3.7,
    reviewCount: 420,
    amazonNumber: 'B08WGV8M81',
    upcNumber: '035051573424',
    modelNumber: '573424',
    countryOfOrigin: 'China',
    alertStatus: 'ALERT',
    mainIssue: 'Damage',
    issueBreakdownText: 'Damage(11), Quality(8), Missing parts(4)',
    checkedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    complaints: [
      {
        userTag: 'BratzCollector',
        reviewTime: 'Oct 21, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Damage',
        keywords: ['broken', 'head fell off', 'neck peg'],
        comment:
          'The neck peg snapped clean off right as I was taking him out of the plastic ties. Collectors beware, the plastic formula is way too brittle on this run.'
      },
      {
        userTag: 'Elena G.',
        reviewTime: 'Oct 15, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Quality',
        keywords: ['paint', 'peeling', 'poor quality'],
        comment:
          'Wonky screening on his left eye. Paint is misaligned by almost 2 millimeters. Disappointed with the QC inspection.'
      }
    ]
  },
  {
    id: 'p-12',
    retailer: 'Target',
    platform: 'TARGET',
    name: 'Bratz Original 20th Anniversary Fashion Doll Cameron',
    url: 'https://www.target.com/p/bratz-20th-anniversary-cameron/-/A-82194888',
    rating: 3.6,
    reviewCount: 195,
    targetNumber: '82194888',
    upcNumber: '035051573424',
    modelNumber: '573424',
    countryOfOrigin: 'China',
    alertStatus: 'ALERT',
    mainIssue: 'Damage',
    issueBreakdownText: 'Damage(9), Quality(5)',
    checkedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    complaints: [
      {
        userTag: 'Marcus D.',
        reviewTime: 'Oct 18, 2026',
        reviewRating: 2,
        sentiment: 'NEGATIVE',
        issueType: 'Damage',
        keywords: ['broken', 'cracked', 'plastic'],
        comment:
          'Knee joint was cracked in the box and completely refused to bend without snapping.'
      }
    ]
  }
];

export const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    name: "MGA's Miniverse Make It Mini Lord of the Rings",
    upc: '035051594238',
    model: '594238',
    wm: '6000207908091',
    tcin: '89984321',
    asin: 'b0d5b7m88x'
  },
  {
    name: 'Little Tikes Power Cuts Chainsaw Toy',
    upc: '050743657382',
    model: '657382',
    wm: '849302194',
    tcin: '79841203',
    asin: 'b085b99z1p'
  },
  {
    name: 'L.O.L. Surprise! O.M.G. Core Fashion Doll Class Prez',
    upc: '035051569427',
    model: '569427',
    wm: '392019482',
    tcin: '82194820',
    asin: 'b0859v5r4l'
  },
  {
    name: 'Bratz Original 20th Anniversary Fashion Doll Cameron',
    upc: '035051573424',
    model: '573424',
    wm: '',
    tcin: '82194888',
    asin: 'b08wgv8m81'
  }
];

/**
 * Seed historical trend data
 */
export async function seedInitialTrends(): Promise<void> {
  // Pre-seed some dates over the past 3 weeks
  const d1 = '2026-10-12';
  const d2 = '2026-10-20';
  const d3 = '2026-10-28';
  const d4 = '2026-11-02';

  // Miniverse worsening
  await recordTrendSnapshot('035051594238', "MGA's Miniverse Make It Mini Lord of the Rings", 'TARGET', 3.2, 140);
  await recordTrendSnapshot('035051594238', "MGA's Miniverse Make It Mini Lord of the Rings", 'WMUS', 3.6, 210);

  // Chainsaw worsening
  await recordTrendSnapshot('050743657382', 'Little Tikes Power Cuts Chainsaw Toy', 'TARGET', 2.9, 85);
  await recordTrendSnapshot('050743657382', 'Little Tikes Power Cuts Chainsaw Toy', 'WMUS', 3.4, 110);
}
