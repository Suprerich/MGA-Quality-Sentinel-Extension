/**
 * MGA Quality Sentinel - Real Search & Scan Engine
 * Direct integration with Chrome & Microsoft Edge Chromium Extension APIs
 * Communicates with content.js, deep_review.js, and classification_v2.js
 */

import { ProductItem, Complaint, ScanPayload, PlatformCode } from '../types';

export function isExtensionRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as any).chrome?.runtime?.id) &&
    Boolean((window as any).chrome?.tabs?.create)
  );
}

export function buildRetailerSearchUrl(platform: string, keyword: string): string {
  const q = encodeURIComponent(keyword || 'MGA Entertainment');
  switch (platform) {
    case 'walmart_us':
    case 'Walmart US':
      return `https://www.walmart.com/search?q=${q}`;
    case 'walmart_ca':
    case 'Walmart CA':
    case 'Walmart Canada':
      return `https://www.walmart.ca/en/search?q=${q}`;
    case 'amazon_us':
    case 'Amazon US':
      return `https://www.amazon.com/s?k=${q}`;
    case 'amazon_ca':
    case 'Amazon CA':
    case 'Amazon Canada':
      return `https://www.amazon.ca/s?k=${q}`;
    case 'target':
    case 'Target':
      return `https://www.target.com/s?searchTerm=${q}`;
    default:
      return `https://www.walmart.com/search?q=${q}`;
  }
}

export function reviewsUrl(p: Partial<ProductItem>): string {
  try {
    const u = p.url || '';
    if (/walmart\.(com|ca)/.test(u) && p.walmartNumber) {
      const base = u.includes('walmart.ca')
        ? 'https://www.walmart.ca/reviews/product/'
        : 'https://www.walmart.com/reviews/product/';
      return base + p.walmartNumber;
    }
    if (/amazon\.(com|ca)/.test(u) && p.amazonNumber) {
      const base = u.includes('amazon.ca')
        ? 'https://www.amazon.ca/product-reviews/'
        : 'https://www.amazon.com/product-reviews/';
      return base + p.amazonNumber;
    }
  } catch (e) {}
  return p.url || '';
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitTabComplete(tabId: number, timeoutMs = 25000): Promise<boolean> {
  const chrome = (window as any).chrome;
  if (!chrome?.tabs?.onUpdated) return Promise.resolve(true);

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          chrome.tabs.onUpdated.removeListener(listener);
        } catch (e) {}
        resolve(false);
      }
    }, timeoutMs);

    const listener = (id: number, changeInfo: any) => {
      if (id === tabId && changeInfo.status === 'complete') {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try {
            chrome.tabs.onUpdated.removeListener(listener);
          } catch (e) {}
          resolve(true);
        }
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Initial check in case it completed synchronously
    chrome.tabs.get(tabId, (tab: any) => {
      if (tab && tab.status === 'complete' && !resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          chrome.tabs.onUpdated.removeListener(listener);
        } catch (e) {}
        resolve(true);
      }
    });
  });
}

async function sendMessageWithScriptFallback(tabId: number, msg: any): Promise<any> {
  const chrome = (window as any).chrome;
  if (!chrome?.tabs) return null;

  try {
    const res = await chrome.tabs.sendMessage(tabId, msg);
    if (res) return res;
  } catch (err) {
    // Content script not ready or not injected
  }

  // Fallback: inject content scripts dynamically via chrome.scripting
  try {
    if (chrome.scripting?.executeScript) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js', 'deep_review.js', 'classification_v2.js']
      });
      await sleep(1000);
      return await chrome.tabs.sendMessage(tabId, msg);
    }
  } catch (e) {
    console.error('Script injection failed:', e);
  }

  return null;
}

export interface RealSearchScanOptions {
  keyword: string;
  platform: string;
  threshold: number;
  maxResults: number;
  includeReviews: boolean;
  onProgress?: (stage: string, percent: number) => void;
  isCancelled?: () => boolean;
}

export interface RealSearchResult {
  success: boolean;
  products: ProductItem[];
  complaints: Complaint[];
  deepResults: any[];
  keywordSummary: { keyword: string; count: number }[];
  error?: string;
  isExtension: boolean;
}

/**
 * Executes a REAL Search & Scan across Walmart, Amazon, or Target.
 * Opens retailer tab in Chromium, waits for DOM completion, scans items,
 * performs deep reviews if requested, and restores focus.
 */
export async function executeRealSearchScan(
  options: RealSearchScanOptions
): Promise<RealSearchResult> {
  const { keyword, platform, threshold, maxResults, includeReviews, onProgress, isCancelled } =
    options;
  const chrome = (window as any).chrome;

  if (!isExtensionRuntime()) {
    return {
      success: false,
      isExtension: false,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error:
        'Extension runtime not detected. To scan live Walmart, Amazon, and Target listings, load this extension as an unpacked extension in Chrome or Edge.'
    };
  }

  let searchTab: any = null;
  let callerTabId: number | null = null;

  try {
    // 1. Record current tab ID to restore focus later
    try {
      const currentTab = await chrome.tabs.getCurrent();
      callerTabId = currentTab?.id || null;
    } catch (e) {}

    // 2. Open Search Page
    onProgress?.('Opening retail search portal...', 15);
    const searchUrl = buildRetailerSearchUrl(platform, keyword);
    searchTab = await chrome.tabs.create({ url: searchUrl, active: true });

    if (isCancelled && isCancelled()) {
      if (searchTab?.id) await chrome.tabs.remove(searchTab.id);
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: 'Search operation cancelled by user.'
      };
    }

    // 3. Wait for DOM to finish loading
    onProgress?.('Waiting for retailer page to render...', 35);
    await waitTabComplete(searchTab.id, 25000);
    await sleep(2000); // Allow retailer hydration

    if (isCancelled && isCancelled()) {
      if (searchTab?.id) await chrome.tabs.remove(searchTab.id);
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: 'Search operation cancelled by user.'
      };
    }

    // 4. Send combined scan message
    onProgress?.('Extracting product catalog, ratings, and UPC barcodes...', 55);
    const scanResponse = await sendMessageWithScriptFallback(searchTab.id, {
      type: 'QC_COMBINED_SCAN',
      threshold,
      analyzeVisibleText: true,
      originKeyword: 'China'
    });

    if (!scanResponse || !scanResponse.products) {
      if (searchTab?.id) await chrome.tabs.remove(searchTab.id);
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: 'Scan failed to extract product listings. The retailer page may have presented a CAPTCHA or blocked requests.'
      };
    }

    // Map extracted products
    let rawProducts: ProductItem[] = (scanResponse.products || []).map((p: any, idx: number) => ({
      id: `p-${Date.now()}-${idx + 1}`,
      retailer: p.retailer || platform,
      name: p.name || 'Unnamed Product',
      url: p.url || '',
      rating: typeof p.rating === 'number' ? p.rating : null,
      reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : null,
      walmartNumber: p.walmartNumber || '',
      amazonNumber: p.amazonNumber || '',
      targetNumber: p.targetNumber || '',
      upcNumber: p.upcNumber || '',
      modelNumber: p.modelNumber || '',
      countryOfOrigin: p.countryOfOrigin || 'UNKNOWN',
      alertStatus: p.alertStatus || (p.rating != null && p.rating < threshold ? 'ALERT' : 'OK'),
      mainIssue: p.mainIssue || 'N/A',
      issueBreakdownText: p.issueBreakdownText || '',
      qaEvidenceSamples: p.qaEvidenceSamples || [],
      checkedAt: p.checkedAt || new Date().toISOString(),
      sourceSite: p.sourceSite || ''
    }));

    // Cap at maxResults
    rawProducts = rawProducts.slice(0, maxResults || 50);

    const allComplaints: Complaint[] = [...(scanResponse.complaints || [])];
    const deepResults: any[] = [];

    // 5. Deep Review Crawling for low-rated products (if requested)
    if (includeReviews) {
      const lowRated = rawProducts.filter(
        (p) => p.alertStatus === 'ALERT' || (p.rating !== null && p.rating < threshold)
      );
      const deepTargets = lowRated.slice(0, 5);

      if (deepTargets.length > 0) {
        onProgress?.(
          `Deep crawling ${deepTargets.length} low-rated products for consumer defect reviews...`,
          70
        );

        for (let i = 0; i < deepTargets.length; i++) {
          if (isCancelled && isCancelled()) break;
          const target = deepTargets[i];
          const reviewPageUrl = reviewsUrl(target);

          let deepTab: any = null;
          try {
            deepTab = await chrome.tabs.create({ url: reviewPageUrl, active: false });
            await waitTabComplete(deepTab.id, 18000);
            await sleep(1500);

            const deepRes = await sendMessageWithScriptFallback(deepTab.id, {
              type: 'QC_DEEP_LOW_SCAN',
              threshold
            });

            if (deepRes) {
              deepRes._searchName = target.name;
              deepRes._searchUrl = target.url;
              deepRes._searchRating = target.rating;
              deepResults.push(deepRes);

              if (deepRes.complaints && deepRes.complaints.length > 0) {
                target.complaints = deepRes.complaints;
                deepRes.complaints.forEach((c: any) => {
                  allComplaints.push({
                    userTag: c.userTag || 'Customer',
                    reviewTime: c.reviewTime || '',
                    reviewRating: c.reviewRating,
                    sentiment: c.sentiment || 'NEGATIVE',
                    issueType: c.issueType || 'Quality',
                    keywords: c.keywords || [],
                    comment: c.comment || '',
                    platform: target.platform
                  });
                });
              }
            }
          } catch (e) {
            console.error('Deep review scan error:', e);
          } finally {
            if (deepTab?.id) {
              try {
                await chrome.tabs.remove(deepTab.id);
              } catch (e) {}
            }
          }

          onProgress?.(
            `Deep review completed (${i + 1}/${deepTargets.length})...`,
            70 + Math.round(((i + 1) / deepTargets.length) * 20)
          );
        }
      }
    }

    // 6. Close the search tab to leave the workspace clean
    if (searchTab?.id) {
      try {
        await chrome.tabs.remove(searchTab.id);
      } catch (e) {}
    }

    // 7. Restore focus to caller tab
    if (callerTabId) {
      try {
        await chrome.tabs.update(callerTabId, { active: true });
      } catch (e) {}
    }

    // Compute keyword summary
    const kwMap: Record<string, number> = {};
    allComplaints.forEach((c) => {
      (c.keywords || []).forEach((k) => {
        kwMap[k] = (kwMap[k] || 0) + 1;
      });
    });
    const keywordSummary = Object.entries(kwMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    onProgress?.('Scan complete! Processing quality analysis...', 100);

    return {
      success: true,
      isExtension: true,
      products: rawProducts,
      complaints: allComplaints,
      deepResults,
      keywordSummary
    };
  } catch (err: any) {
    if (searchTab?.id) {
      try {
        await chrome.tabs.remove(searchTab.id);
      } catch (e) {}
    }
    return {
      success: false,
      isExtension: true,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error: err?.message || 'An unexpected error occurred during Search & Scan.'
    };
  }
}

/**
 * Scans the currently active tab in the browser (helper button).
 */
export async function executeRealActiveTabScan(threshold = 4.0): Promise<RealSearchResult> {
  const chrome = (window as any).chrome;
  if (!isExtensionRuntime()) {
    return {
      success: false,
      isExtension: false,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error:
        'Extension runtime not detected. To scan the active tab, install this extension in Chrome or Edge.'
    };
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id) {
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: 'No active browser tab found.'
      };
    }

    const url = activeTab.url || '';
    const isSupported = /https:\/\/www\.(walmart\.(com|ca)|amazon\.(com|ca)|target\.com)\//.test(
      url
    );
    if (!isSupported) {
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error:
          'Current page is not a supported retailer. Please navigate to Walmart US, Walmart Canada, Amazon US, Amazon Canada, or Target.'
      };
    }

    const res = await sendMessageWithScriptFallback(activeTab.id, {
      type: 'QC_COMBINED_SCAN',
      threshold,
      analyzeVisibleText: true,
      originKeyword: 'China'
    });

    if (!res) {
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: 'Scan failed on active tab. Please refresh the page and try again.'
      };
    }

    if (res.mode === 'detail') {
      const meta = res.meta || {};
      const singleProduct: ProductItem = {
        id: `p-${Date.now()}`,
        retailer: meta.retailer || 'Retailer',
        name: meta.productName || 'Scanned Product',
        url: meta.sourceUrl || url,
        rating: meta.rating,
        reviewCount: meta.reviewCount,
        walmartNumber: meta.walmartNumber || '',
        amazonNumber: meta.amazonNumber || '',
        targetNumber: meta.targetNumber || '',
        upcNumber: meta.upcNumber || '',
        modelNumber: meta.modelNumber || '',
        countryOfOrigin: meta.countryOfOrigin || 'UNKNOWN',
        alertStatus: meta.alertStatus || 'OK',
        checkedAt: meta.checkedAt || new Date().toISOString(),
        complaints: res.complaints || []
      };

      return {
        success: true,
        isExtension: true,
        products: [singleProduct],
        complaints: res.complaints || [],
        deepResults: [],
        keywordSummary: res.keywordSummary || []
      };
    }

    const prods: ProductItem[] = (res.products || []).map((p: any, idx: number) => ({
      id: `p-${Date.now()}-${idx + 1}`,
      retailer: p.retailer || 'Retailer',
      name: p.name || 'Scanned Listing',
      url: p.url || '',
      rating: p.rating,
      reviewCount: p.reviewCount,
      walmartNumber: p.walmartNumber || '',
      amazonNumber: p.amazonNumber || '',
      targetNumber: p.targetNumber || '',
      upcNumber: p.upcNumber || '',
      modelNumber: p.modelNumber || '',
      countryOfOrigin: p.countryOfOrigin || 'UNKNOWN',
      alertStatus: p.alertStatus || 'OK',
      mainIssue: p.mainIssue || 'N/A',
      issueBreakdownText: p.issueBreakdownText || '',
      qaEvidenceSamples: p.qaEvidenceSamples || [],
      checkedAt: p.checkedAt || new Date().toISOString()
    }));

    return {
      success: true,
      isExtension: true,
      products: prods,
      complaints: res.complaints || [],
      deepResults: [],
      keywordSummary: res.keywordSummary || []
    };
  } catch (err: any) {
    return {
      success: false,
      isExtension: true,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error: err?.message || 'Error scanning active tab.'
    };
  }
}
