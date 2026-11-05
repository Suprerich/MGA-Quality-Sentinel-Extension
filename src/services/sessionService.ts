import {
  PlatformCode,
  ProductItem,
  Complaint,
  WatchlistItem,
  ProductSession,
  PlatformResultEntry,
  ProductSessionSummary,
  RetailerId,
  AlertStatus,
  ProductIdentifiers,
  LowRatedItem
} from '../types';
import { PLAT_ORDER, PLAT_LABEL } from './summaryService';
import { normId, tokens, overlap, seriesConflict } from './skuCore';

const CURRENT_SESSION_KEY = 'mga_current_session_v3';
const PRODUCT_HISTORY_KEY = 'mga_product_history_v3';

function hasChromeLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).chrome?.storage?.local);
}

// ==========================================
// 1. Storage Operations (Local-First / Isolated)
// ==========================================

export async function loadCurrentSession(): Promise<ProductSession | null> {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([CURRENT_SESSION_KEY], (res: any) => {
        resolve(res?.[CURRENT_SESSION_KEY] || null);
      });
    });
  }
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveCurrentSession(session: ProductSession | null): Promise<void> {
  if (hasChromeLocal()) {
    if (session) {
      (window as any).chrome.storage.local.set({ [CURRENT_SESSION_KEY]: session });
    } else {
      (window as any).chrome.storage.local.remove([CURRENT_SESSION_KEY]);
    }
  }
  try {
    if (session) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (e) {}
}

export async function clearCurrentSession(): Promise<void> {
  await saveCurrentSession(null);
}

export async function loadProductHistory(): Promise<ProductSession[]> {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([PRODUCT_HISTORY_KEY], (res: any) => {
        resolve(res?.[PRODUCT_HISTORY_KEY] || []);
      });
    });
  }
  try {
    const raw = localStorage.getItem(PRODUCT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function saveAllHistory(records: ProductSession[]): Promise<void> {
  if (hasChromeLocal()) {
    (window as any).chrome.storage.local.set({ [PRODUCT_HISTORY_KEY]: records });
  }
  try {
    localStorage.setItem(PRODUCT_HISTORY_KEY, JSON.stringify(records));
  } catch (e) {}
}

export async function saveProductToHistory(session: ProductSession): Promise<ProductSession[]> {
  if (!session || !session.productId) return await loadProductHistory();
  const current = await loadProductHistory();
  const existingIdx = current.findIndex((p) => p.productId === session.productId);

  let updated: ProductSession[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...session, updatedAt: new Date().toISOString() };
  } else {
    updated = [session, ...current];
  }

  // Cap at 150 products
  updated = updated.slice(0, 150);
  await saveAllHistory(updated);
  return updated;
}

export async function deleteProductFromHistory(productId: string): Promise<ProductSession[]> {
  const current = await loadProductHistory();
  const updated = current.filter((p) => p.productId !== productId);
  await saveAllHistory(updated);
  return updated;
}

export async function deleteMultipleProducts(productIds: string[]): Promise<ProductSession[]> {
  const idSet = new Set(productIds);
  const current = await loadProductHistory();
  const updated = current.filter((p) => !idSet.has(p.productId));
  await saveAllHistory(updated);
  return updated;
}

export async function clearAllProductHistory(): Promise<ProductSession[]> {
  await saveAllHistory([]);
  return [];
}

/**
 * Removes a single platform result from a product and recalculates its summary.
 */
export async function deletePlatformFromProduct(
  productId: string,
  platform: PlatformCode,
  threshold: number = 4.0,
  watchlist: WatchlistItem[] = []
): Promise<ProductSession | null> {
  const history = await loadProductHistory();
  const target = history.find((p) => p.productId === productId);
  if (!target) return null;

  const nextResults = { ...target.platformResults };
  delete nextResults[platform];

  const updatedTarget: ProductSession = {
    ...target,
    platformResults: nextResults,
    updatedAt: new Date().toISOString()
  };

  updatedTarget.summary = computeSessionSummary(updatedTarget, threshold, watchlist);

  // Update in history
  const updatedList = history.map((p) => (p.productId === productId ? updatedTarget : p));
  await saveAllHistory(updatedList);

  // If this was the current session, update it too
  const currentSession = await loadCurrentSession();
  if (currentSession && currentSession.productId === productId) {
    await saveCurrentSession(updatedTarget);
  }

  return updatedTarget;
}

// ==========================================
// 2. Product Identity & Priority Matching
// Priority: UPC > Model > WM# / TCIN / ASIN / Costco# > Normalized Product Name tokens
// ==========================================

export function isSameProductQuery(
  newQuery: {
    keyword?: string;
    productName?: string;
    upc?: string;
    model?: string;
    walmartNumber?: string;
    amazonNumber?: string;
    targetNumber?: string;
    costcoNumber?: string;
  },
  currentSession: ProductSession | null
): boolean {
  if (!currentSession) return true; // No active session, always fine
  const hasAnyScanned = Object.keys(currentSession.platformResults || {}).length > 0;
  if (!hasAnyScanned) return true; // Workspace empty, considered continuation

  const curId = currentSession.identifiers || {};

  // 1. UPC Priority
  const newUpc = normId(newQuery.upc);
  const curUpc = normId(curId.upc);
  if (newUpc && curUpc) {
    return newUpc === curUpc;
  }

  // 2. Model Priority
  const newModel = normId(newQuery.model);
  const curModel = normId(curId.model);
  if (newModel && curModel) {
    return newModel === curModel;
  }

  // 3. Retail Channel Number Priority (WM#, TCIN, ASIN, Costco#)
  const newWm = normId(newQuery.walmartNumber);
  const curWm = normId(curId.walmartNumber);
  if (newWm && curWm) return newWm === curWm;

  const newTcin = normId(newQuery.targetNumber);
  const curTcin = normId(curId.targetNumber);
  if (newTcin && curTcin) return newTcin === curTcin;

  const newAsin = normId(newQuery.amazonNumber);
  const curAsin = normId(curId.amazonNumber);
  if (newAsin && curAsin) return newAsin === curAsin;

  const newCostco = normId(newQuery.costcoNumber);
  const curCostco = normId(curId.costcoNumber);
  if (newCostco && curCostco) return newCostco === curCostco;

  // 4. Normalized Product Name / Search Keyword Tokens Priority
  const queryText = (newQuery.keyword || newQuery.productName || '').trim().toLowerCase();
  const sessionText = (currentSession.searchKeyword || currentSession.productName || '').trim().toLowerCase();

  if (!queryText || !sessionText) return true;

  // Exact or contains match
  if (queryText === sessionText || queryText.includes(sessionText) || sessionText.includes(queryText)) {
    return true;
  }

  const tkA = tokens(queryText);
  const tkB = tokens(sessionText);

  if (seriesConflict(tkA, tkB)) {
    return false;
  }

  const ov = overlap(tkA, tkB);
  return ov >= 0.55;
}

// ==========================================
// 3. Live Summary & Accumulation Logic
// ==========================================

export function computeSessionSummary(
  session: ProductSession,
  threshold: number = 4.0,
  _watchlist: WatchlistItem[] = []
): ProductSessionSummary {
  const results = session.platformResults || {};
  const completedPlats = Object.keys(results) as PlatformCode[];

  let totalScanned = 0;
  let totalLowRated = 0;
  let totalReviews = 0;
  const allLowRatings: number[] = [];
  const lowRatingPlatforms: PlatformCode[] = [];
  let alertCount = 0;

  completedPlats.forEach((pCode) => {
    const res = results[pCode];
    if (!res) return;

    const scannedCount = res.totalScanned || (res.products?.length || 0);
    totalScanned += scannedCount;

    const lowCount = res.lowRatedCount ?? (res.lowRatedItems?.length || 0);
    totalLowRated += lowCount;

    if (lowCount > 0) {
      lowRatingPlatforms.push(pCode);
      alertCount++;
    }

    if (res.lowestRating != null && typeof res.lowestRating === 'number' && !isNaN(res.lowestRating)) {
      allLowRatings.push(res.lowestRating);
    } else if (res.lowRatedItems && res.lowRatedItems.length > 0) {
      res.lowRatedItems.forEach((it) => {
        if (typeof it.rating === 'number' && !isNaN(it.rating) && it.rating < threshold) {
          allLowRatings.push(it.rating);
        }
      });
    }

    (res.lowRatedItems || []).forEach((it) => {
      if (typeof it.reviewCount === 'number') totalReviews += it.reviewCount;
    });
  });

  // Requirement 7: lowestRating = Math.min(...allLowRatedItems.map(item => item.rating))
  const lowestRating = allLowRatings.length > 0 ? Number(Math.min(...allLowRatings).toFixed(1)) : null;

  // Aggregate complaints
  const allComplaints: Complaint[] = [];
  completedPlats.forEach((pCode) => {
    const res = results[pCode];
    if (res?.complaints) {
      allComplaints.push(...res.complaints);
    }
  });

  // Complaint Breakdown
  const issueCounts: Record<string, number> = {};
  allComplaints.forEach((c) => {
    const t = c.issueType || 'Quality';
    issueCounts[t] = (issueCounts[t] || 0) + 1;
  });

  const totalComplaints = allComplaints.length;
  const complaintBreakdown = Object.entries(issueCounts)
    .map(([issue, count]) => ({
      issue,
      count,
      percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  let keyFindings = '';
  if (completedPlats.length === 0) {
    keyFindings = '未开始任何平台查询。';
  } else if (totalLowRated > 0 && lowestRating !== null) {
    keyFindings = `在已查询的 ${completedPlats.length} 个平台中共扫描 ${totalScanned} 个商品，发现 ${totalLowRated} 个低于警戒值 (${threshold}) 的低分商品，全网最低评分为 ${lowestRating}★。`;
  } else {
    keyFindings = `在已查询的 ${completedPlats.length} 个平台中共扫描 ${totalScanned} 个商品，未发现低于警戒值 (${threshold}) 的低分商品。`;
  }

  const now = new Date();
  const lastUpdated = `${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return {
    lowestRating,
    totalScanned,
    totalLowRated,
    totalReviews,
    platformsScannedCount: completedPlats.length,
    lowRatingPlatforms,
    alertCount,
    skuMatchStatus: completedPlats.length > 0 ? 'Matched' : 'Needs Manual Review',
    lastUpdated,
    keyFindings,
    complaintBreakdown
  };
}

/**
 * Creates a brand new empty product session.
 */
export function createNewProductSession(
  keyword: string,
  initialIdentifiers: ProductIdentifiers = {}
): ProductSession {
  const now = new Date();
  const formatted = `${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const cleanId = normId(initialIdentifiers.upc) || normId(initialIdentifiers.model) || `prod-${Date.now()}`;

  return {
    productId: cleanId,
    productName: keyword.trim() || 'New Product Query',
    searchKeyword: keyword.trim(),
    identifiers: { ...initialIdentifiers },
    startedAt: formatted,
    updatedAt: formatted,
    platformResults: {},
    complaints: [],
    deepResults: [],
    status: 'in_progress'
  };
}

/**
 * Accumulates a new platform scan result into the current product session without overwriting other platforms.
 */
export function accumulatePlatformScanResult(
  existingSession: ProductSession,
  platform: PlatformCode,
  retailerId: RetailerId,
  retailerName: string,
  url: string,
  rating: number | null,
  reviewCount: number | null,
  alertStatus: AlertStatus,
  countryOfOrigin: string = 'UNKNOWN',
  products: ProductItem[],
  complaints: Complaint[],
  deepResults: any[] = [],
  keywordSummary: { keyword: string; count: number }[] = [],
  threshold: number = 4.0,
  watchlist: WatchlistItem[] = [],
  tabId?: number | null,
  matchedProductName?: string
): ProductSession {
  const now = new Date();
  const formattedTime = `${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Extract identifiers from the new products
  const nextIdentifiers: ProductIdentifiers = { ...existingSession.identifiers };
  products.forEach((p) => {
    if (p.upcNumber && !nextIdentifiers.upc) nextIdentifiers.upc = p.upcNumber;
    if (p.modelNumber && !nextIdentifiers.model) nextIdentifiers.model = p.modelNumber;
    if (p.walmartNumber && !nextIdentifiers.walmartNumber) nextIdentifiers.walmartNumber = p.walmartNumber;
    if (p.amazonNumber && !nextIdentifiers.amazonNumber) nextIdentifiers.amazonNumber = p.amazonNumber;
    if (p.targetNumber && !nextIdentifiers.targetNumber) nextIdentifiers.targetNumber = p.targetNumber;
    if (p.costcoNumber && !nextIdentifiers.costcoNumber) nextIdentifiers.costcoNumber = p.costcoNumber;
  });

  // Pick the most specific product name
  let bestName = matchedProductName || existingSession.productName;
  if (!matchedProductName) {
    const firstWithGoodName = products.find((p) => p.name && p.name.length > 10);
    if (firstWithGoodName && firstWithGoodName.name.length > (bestName || '').length) {
      bestName = firstWithGoodName.name;
    }
  }

  // Rule 2: lowRatedItems = scannedItems.filter(item => item.rating != null && item.rating < userThreshold);
  // Using strictly lower than threshold. Items without rating are marked as no rating and NOT added to lowRatedItems.
  const lowRatedItems: LowRatedItem[] = (products || [])
    .filter((p) => typeof p.rating === 'number' && !isNaN(p.rating) && p.rating < threshold)
    .map((p, idx) => ({
      id: p.id || `low-${platform}-${Date.now()}-${idx}`,
      productName: p.name || 'Unnamed Product',
      rating: p.rating as number,
      reviewCount: p.reviewCount ?? null,
      price: p.price || '',
      productUrl: p.url || url,
      imageUrl: p.imageUrl || '',
      sku: p.modelNumber || p.upcNumber || p.walmartNumber || p.targetNumber || p.amazonNumber || p.costcoNumber || '',
      upc: p.upcNumber || '',
      model: p.modelNumber || '',
      platformNumber: p.walmartNumber || p.targetNumber || p.amazonNumber || p.costcoNumber || '',
      countryOfOrigin: p.countryOfOrigin || 'UNKNOWN',
      mainIssue: p.mainIssue || 'N/A',
      issueBreakdownText: p.issueBreakdownText || '',
      scannedAt: new Date().toISOString()
    }));

  const totalScanned = products.length;
  const lowRatedCount = lowRatedItems.length;
  const lowestRating = lowRatedItems.length > 0
    ? Number(Math.min(...lowRatedItems.map((it) => it.rating)).toFixed(1))
    : null;

  // Build the platform entry using structuredClone (Requirement 4, 6, 8)
  const platformEntry: PlatformResultEntry = structuredClone({
    platform,
    retailerId,
    retailerName,
    url,
    sourceUrl: url,
    tabId: tabId ?? null,
    searchKeyword: existingSession.searchKeyword || bestName,
    totalScanned,
    lowRatedCount,
    threshold,
    lowestRating,
    lowRatedItems,
    // Store only lowRatedItems for product tables (Requirement 1: 评分等于或高于警戒值的商品不显示在查询结果、低分列表和历史详情中)
    products: lowRatedItems.map((it) => ({
      id: it.id,
      retailer: retailerName,
      name: it.productName,
      url: it.productUrl,
      imageUrl: it.imageUrl,
      price: it.price,
      rating: it.rating,
      reviewCount: it.reviewCount ?? null,
      alertStatus: 'ALERT' as AlertStatus,
      countryOfOrigin: it.countryOfOrigin,
      upcNumber: it.upc,
      modelNumber: it.model
    })),
    rating: lowestRating,
    reviewCount: lowRatedItems.reduce((acc, it) => acc + (it.reviewCount || 0), 0),
    productName: bestName,
    alertStatus: lowRatedCount > 0 ? ('ALERT' as AlertStatus) : ('OK' as AlertStatus),
    countryOfOrigin: lowRatedItems[0]?.countryOfOrigin || 'UNKNOWN',
    complaints: complaints.filter((c) => c.reviewRating == null || c.reviewRating < threshold),
    deepResults,
    keywordSummary,
    scannedAt: new Date().toISOString(),
    queryKeyword: existingSession.searchKeyword,
    status: 'completed'
  });

  // Deep clone existing platform results to ensure absolute isolation (Requirement 6)
  const updatedPlatformResults: Partial<Record<PlatformCode, PlatformResultEntry>> = structuredClone(
    existingSession.platformResults || {}
  );
  updatedPlatformResults[platform] = platformEntry;

  // Merge complaints uniquely
  const mergedComplaintsMap = new Map<string, Complaint>();
  (existingSession.complaints || []).forEach((c) => {
    const key = `${c.platform || ''}_${c.reviewTime}_${(c.comment || '').slice(0, 40)}`;
    mergedComplaintsMap.set(key, c);
  });
  complaints.forEach((c) => {
    const key = `${c.platform || platform}_${c.reviewTime}_${(c.comment || '').slice(0, 40)}`;
    mergedComplaintsMap.set(key, { ...c, platform: c.platform || platform });
  });

  const mergedDeepResults = [
    ...(existingSession.deepResults || []),
    ...deepResults.filter(
      (d) => !(existingSession.deepResults || []).some((x) => x.id === d.id)
    )
  ];

  const updatedSession: ProductSession = {
    ...existingSession,
    productName: bestName,
    identifiers: nextIdentifiers,
    updatedAt: formattedTime,
    platformResults: updatedPlatformResults,
    complaints: Array.from(mergedComplaintsMap.values()),
    deepResults: mergedDeepResults,
    status: 'completed'
  };

  // Recalculate live summary
  updatedSession.summary = computeSessionSummary(updatedSession, threshold, watchlist);

  return updatedSession;
}
