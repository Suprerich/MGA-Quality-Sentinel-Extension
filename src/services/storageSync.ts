import { UserPreferences, WatchlistItem, ProductItem, TrendDatabase } from '../types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  threshold: 4.0,
  syncPreferences: 'sync_enabled',
  defaultExportFormat: 'excel',
  theme: 'system',
  densityMode: 'comfortable',
  autoScanVisible: true,
  language: 'en'
};

const SYNC_KEYS = {
  PREFERENCES: 'mga_preferences_sync',
  WATCHLIST: 'mga_watchlist_sync',
  CUSTOM_FILTERS: 'mga_filters_sync'
};

const LOCAL_KEYS = {
  PRODUCTS: 'mga_products_local',
  TRENDS: 'mga_trends_local',
  DEEP_CACHE: 'mga_deep_cache_local',
  LAST_SCAN: 'mga_last_scan_time'
};

function hasChromeSync(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).chrome?.storage?.sync);
}

function hasChromeLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).chrome?.storage?.local);
}

// 1. Sync Tier (chrome.storage.sync for settings & watchlist)
export async function loadSyncPreferences(): Promise<UserPreferences> {
  if (hasChromeSync()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.sync.get([SYNC_KEYS.PREFERENCES], (res: any) => {
        resolve(res?.[SYNC_KEYS.PREFERENCES] || DEFAULT_PREFERENCES);
      });
    });
  }
  try {
    const raw = localStorage.getItem(SYNC_KEYS.PREFERENCES);
    return raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveSyncPreferences(prefs: UserPreferences): Promise<void> {
  if (hasChromeSync()) {
    (window as any).chrome.storage.sync.set({ [SYNC_KEYS.PREFERENCES]: prefs });
  }
  try {
    localStorage.setItem(SYNC_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {}
}

export async function loadSyncWatchlist(): Promise<WatchlistItem[] | null> {
  if (hasChromeSync()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.sync.get([SYNC_KEYS.WATCHLIST], (res: any) => {
        resolve(res?.[SYNC_KEYS.WATCHLIST] || null);
      });
    });
  }
  try {
    const raw = localStorage.getItem(SYNC_KEYS.WATCHLIST);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveSyncWatchlist(items: WatchlistItem[]): Promise<void> {
  const plain = items.map((i) => ({
    name: i.name,
    upc: i.upc,
    model: i.model,
    wm: i.wm,
    tcin: i.tcin,
    asin: i.asin,
    status: i.status,
    matchSource: i.matchSource
  }));

  if (hasChromeSync()) {
    (window as any).chrome.storage.sync.set({ [SYNC_KEYS.WATCHLIST]: plain });
  }
  try {
    localStorage.setItem(SYNC_KEYS.WATCHLIST, JSON.stringify(plain));
  } catch (e) {}
}

// 2. Local Tier (chrome.storage.local for big data, scan results, review cache)
export async function loadLocalProducts(): Promise<ProductItem[] | null> {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([LOCAL_KEYS.PRODUCTS], (res: any) => {
        resolve(res?.[LOCAL_KEYS.PRODUCTS] || null);
      });
    });
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveLocalProducts(products: ProductItem[]): Promise<void> {
  if (hasChromeLocal()) {
    (window as any).chrome.storage.local.set({ [LOCAL_KEYS.PRODUCTS]: products });
  }
  try {
    localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {}
}

export async function loadLastScanTime(): Promise<string> {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([LOCAL_KEYS.LAST_SCAN], (res: any) => {
        resolve(res?.[LOCAL_KEYS.LAST_SCAN] || 'Today 10:23 AM');
      });
    });
  }
  return localStorage.getItem(LOCAL_KEYS.LAST_SCAN) || 'Today 10:23 AM';
}

export async function saveLastScanTime(timeStr: string): Promise<void> {
  if (hasChromeLocal()) {
    (window as any).chrome.storage.local.set({ [LOCAL_KEYS.LAST_SCAN]: timeStr });
  }
  try {
    localStorage.setItem(LOCAL_KEYS.LAST_SCAN, timeStr);
  } catch (e) {}
}
