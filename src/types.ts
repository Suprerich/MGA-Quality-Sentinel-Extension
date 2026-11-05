/**
 * MGA Quality Sentinel - Type Definitions
 * Cross-platform retail monitoring & complaint analysis
 */

export type RetailerId =
  | 'walmart_us'
  | 'walmart_ca'
  | 'amazon_us'
  | 'amazon_ca'
  | 'target'
  | 'costco_us'
  | 'costco_ca';

export type PlatformCode =
  | 'WMUS'
  | 'WMCA'
  | 'AMZUS'
  | 'AMZCA'
  | 'TARGET'
  | 'COSTCOUS'
  | 'COSTCOCA';

export type AlertStatus = 'ALERT' | 'OK' | 'NEED MANUAL CHECK';

export type Sentiment = 'NEGATIVE' | 'POSITIVE' | 'NEUTRAL';

export type DefectSeverity = 'Critical' | 'Major' | 'Minor';

export interface TaxonomyRule {
  issue: DefectCategory;
  severity: DefectSeverity;
  words: string[];
}

export type DefectCategory =
  | 'Function issue'
  | 'Damage'
  | 'Missing parts'
  | 'Safety'
  | 'Quality'
  | 'Assembly / Instruction'
  | 'Packaging'
  | 'Delivery'
  | 'Value'
  | 'Size / Appearance mismatch'
  | 'Other';

export type SkuValidationStatus =
  | 'Matched'
  | 'Not Matched'
  | 'Potential Variant'
  | 'Duplicate SKU'
  | 'Needs Manual Review';

export type NavSection =
  | 'dashboard'
  | 'search-scan'
  | 'watchlist'
  | 'history'
  | 'settings';

export interface Complaint {
  id?: string;
  index?: number;
  productId?: string;
  productName?: string;
  retailer?: string;
  userTag: string;
  reviewTime: string;
  reviewRating?: number | null;
  sentiment: Sentiment;
  issueType: DefectCategory;
  keywords: string[];
  comment: string;
  platform?: PlatformCode;
  sourceUrl?: string;
  countryOfOrigin?: string;
}

export interface ProductItem {
  id: string;
  retailer: string;
  platform?: PlatformCode;
  name: string;
  url: string;
  imageUrl?: string;
  price?: string;
  rating: number | null;
  reviewCount: number | null;
  walmartNumber?: string;
  amazonNumber?: string;
  targetNumber?: string;
  costcoNumber?: string;
  upcNumber?: string;
  modelNumber?: string;
  countryOfOrigin?: string;
  alertStatus: AlertStatus;
  mainIssue?: string;
  issueBreakdownText?: string;
  qaEvidenceSamples?: string[];
  checkedAt?: string;
  sourceSite?: string;
  ratingSource?: string;
  ratingCheck?: string;
  complaints?: Complaint[];
  keywordSummary?: { keyword: string; count: number }[];
  skuValidationStatus?: SkuValidationStatus;
  skuValidationNote?: string;
}

export interface WatchlistItem {
  id?: string;
  name: string;
  upc: string;
  model: string;
  wm: string;
  tcin: string;
  asin: string;
  costco?: string;
  status?: SkuValidationStatus;
  matchSource?: string;
  tokens?: Set<string>;
}

export interface PlatformScore {
  rating: number | null;
  count: number | null;
  url: string;
}

export interface CrossPlatformGroup {
  id: string;
  name: string;
  upc: string;
  model: string;
  platforms: Partial<Record<PlatformCode, PlatformScore>>;
  complaints: Complaint[];
  _seen: Record<string, number>;
  _wl?: string | null;
  _probe: {
    name: string;
    upcNumber?: string;
    modelNumber?: string;
    walmartNumber?: string;
    targetNumber?: string;
    amazonNumber?: string;
    costcoNumber?: string;
  };
}

export interface TrendSnapshot {
  d: string; // YYYY-MM-DD
  rating: number;
  count?: number | null;
}

export interface ProductTrendEntry {
  name: string;
  plats: Record<string, TrendSnapshot[]>;
}

export type TrendDatabase = Record<string, ProductTrendEntry>;

export interface ScanPayload {
  mode: 'search' | 'detail' | 'deepLow';
  products?: ProductItem[];
  meta?: Partial<ProductItem> & { productName?: string; sourceUrl?: string };
  complaints?: Complaint[];
  keywordSummary?: { keyword: string; count: number }[];
  threshold?: number;
  error?: string;
}

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export interface SearchHistoryRecord {
  id: string;
  keyword: string;
  platform: string;
  threshold: number;
  maxResults: number;
  includeReviews: boolean;
  queryTime: string;
  itemsCount: number;
  alertCount: number;
  avgRating: number | null;
  products: ProductItem[];
  complaints: Complaint[];
  groups: CrossPlatformGroup[];
  deepResults?: any[];
  keywordSummary?: { keyword: string; count: number }[];
}

export interface ScanProgressState {
  status:
    | 'idle'
    | 'opening_tab'
    | 'loading_page'
    | 'injecting_scripts'
    | 'scanning_products'
    | 'crawling_reviews'
    | 'completed'
    | 'cancelled'
    | 'error';
  progressPercent: number;
  message: string;
  currentStep?: string;
  error?: string;
}

export interface UserPreferences {
  threshold: number;
  syncPreferences: 'sync_enabled' | 'local_only';
  defaultExportFormat: 'excel' | 'csv' | 'email_html';
  theme: 'system' | 'light' | 'dark';
  densityMode: 'comfortable' | 'compact';
  autoScanVisible: boolean;
  language: Language;
}

export interface ScanSettings {
  threshold: number;
  analyzeVisibleText: boolean;
  lowRatingOnly: boolean;
  originOnly: boolean;
  originKeyword: string;
}

export interface ProductIdentifiers {
  upc?: string;
  model?: string;
  walmartNumber?: string;
  amazonNumber?: string;
  targetNumber?: string;
  costcoNumber?: string;
}

export interface LowRatedItem {
  id: string;
  productName: string;
  rating: number;
  reviewCount?: number | null;
  price?: string;
  productUrl: string;
  imageUrl?: string;
  sku?: string;
  upc?: string;
  model?: string;
  platformNumber?: string;
  countryOfOrigin?: string;
  mainIssue?: string;
  issueBreakdownText?: string;
  scannedAt: string;
}

export interface PlatformResultEntry {
  platform: PlatformCode;
  retailerId: RetailerId;
  retailerName: string;
  url: string;
  sourceUrl?: string;
  tabId?: number | null;
  searchKeyword?: string;
  totalScanned: number;
  lowRatedCount: number;
  threshold: number;
  lowestRating: number | null;
  lowRatedItems: LowRatedItem[];
  rating?: number | null;
  reviewCount?: number | null;
  productName?: string;
  alertStatus?: AlertStatus;
  countryOfOrigin?: string;
  products?: ProductItem[];
  complaints?: Complaint[];
  deepResults?: any[];
  keywordSummary?: { keyword: string; count: number }[];
  scannedAt: string;
  queryKeyword?: string;
  status: 'completed' | 'not_scanned' | 'failed';
  error?: string;
}

export interface ProductSessionSummary {
  lowestRating: number | null;
  totalScanned: number;
  totalLowRated: number;
  totalReviews: number;
  platformsScannedCount: number;
  lowRatingPlatforms: PlatformCode[];
  alertCount: number;
  skuMatchStatus?: SkuValidationStatus;
  lastUpdated: string;
  keyFindings: string;
  complaintBreakdown: { issue: string; count: number; percentage: number }[];
  avgRating?: number | null;
}

export interface ProductSession {
  productId: string;
  productName: string;
  searchKeyword?: string;
  identifiers: ProductIdentifiers;
  startedAt: string;
  updatedAt: string;
  platformResults: Partial<Record<PlatformCode, PlatformResultEntry>>;
  summary?: ProductSessionSummary;
  complaints: Complaint[];
  deepResults?: any[];
  status: 'in_progress' | 'completed';
}

export type ProductHistoryRecord = ProductSession;


