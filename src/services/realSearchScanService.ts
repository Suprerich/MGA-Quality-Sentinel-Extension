/**
 * MGA Quality Sentinel - Real Search & Scan Engine
 * Dual-Mode Engine:
 * 1. Chromium Extension Native Mode (when loaded in Chrome / Edge extension origin):
 *    Directly creates tabs, executes content.js, sends QC_COMBINED_SCAN and QC_DEEP_LOW_SCAN.
 * 2. Web Mode (when hosted on Cloud Run / browser preview):
 *    Queries retailer endpoints or gracefully guides the user to the extension without returning fake numbers.
 */

import { ProductItem, Complaint, PlatformCode } from '../types';

export function isExtensionRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as any).chrome?.runtime?.id) &&
    Boolean((window as any).chrome?.tabs?.create)
  );
}

export const PLATFORM_DOMAINS: Record<string, { domain: string; name: string }> = {
  walmart_us: { domain: 'walmart.com', name: 'Walmart US' },
  WMUS: { domain: 'walmart.com', name: 'Walmart US' },
  walmart_ca: { domain: 'walmart.ca', name: 'Walmart CA' },
  WMCA: { domain: 'walmart.ca', name: 'Walmart CA' },
  amazon_us: { domain: 'amazon.com', name: 'Amazon US' },
  AMZUS: { domain: 'amazon.com', name: 'Amazon US' },
  amazon_ca: { domain: 'amazon.ca', name: 'Amazon CA' },
  AMZCA: { domain: 'amazon.ca', name: 'Amazon CA' },
  target: { domain: 'target.com', name: 'Target' },
  TARGET: { domain: 'target.com', name: 'Target' },
  costco_us: { domain: 'costco.com', name: 'Costco US' },
  COSTCOUS: { domain: 'costco.com', name: 'Costco US' },
  costco_ca: { domain: 'costco.ca', name: 'Costco Canada' },
  COSTCOCA: { domain: 'costco.ca', name: 'Costco Canada' }
};

/**
 * Validates whether the given URL belongs to the expected retailer platform (Requirement 7).
 */
export function validatePlatformDomain(
  platform: string,
  url: string
): { valid: boolean; expected: string; actualDomain: string; error?: string } {
  const normPlat = (platform || '').toLowerCase().replace(/[\s-]/g, '_');
  let meta = PLATFORM_DOMAINS[platform] || PLATFORM_DOMAINS[normPlat];
  if (!meta) {
    if (normPlat.includes('target')) meta = PLATFORM_DOMAINS.target;
    else if (normPlat.includes('walmart_ca') || normPlat.includes('wmca')) meta = PLATFORM_DOMAINS.walmart_ca;
    else if (normPlat.includes('walmart')) meta = PLATFORM_DOMAINS.walmart_us;
    else if (normPlat.includes('amazon_ca') || normPlat.includes('amzca')) meta = PLATFORM_DOMAINS.amazon_ca;
    else if (normPlat.includes('amazon')) meta = PLATFORM_DOMAINS.amazon_us;
    else if (normPlat.includes('costco_ca') || normPlat.includes('costcoca')) meta = PLATFORM_DOMAINS.costco_ca;
    else if (normPlat.includes('costco')) meta = PLATFORM_DOMAINS.costco_us;
  }
  const expectedName = meta?.name || platform;
  const expectedDomain = meta?.domain || '';

  let actualDomain = '';
  try {
    const u = new URL(url);
    actualDomain = u.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    actualDomain = (url || '').toLowerCase();
  }

  if (expectedDomain && !actualDomain.includes(expectedDomain)) {
    return {
      valid: false,
      expected: expectedName,
      actualDomain,
      error: `当前页面不是[${expectedName}]，请确认是否选择了正确的平台标签。`
    };
  }
  return { valid: true, expected: expectedName, actualDomain };
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
    case 'costco_us':
    case 'Costco US':
      return `https://www.costco.com/CatalogSearch?dept=All&keyword=${q}`;
    case 'costco_ca':
    case 'Costco CA':
    case 'Costco Canada':
      return `https://www.costco.ca/CatalogSearch?dept=All&keyword=${q}`;
    default:
      return `https://www.walmart.ca/en/search?q=${q}`;
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

/**
 * Ensures content script is injected and ready in the target tab.
 */
async function sendMessageWithScriptFallback(tabId: number, msg: any): Promise<any> {
  const chrome = (window as any).chrome;
  if (!chrome?.tabs) return null;

  try {
    const res = await chrome.tabs.sendMessage(tabId, msg);
    if (res) return res;
  } catch (err) {}

  try {
    if (chrome.scripting?.executeScript) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js', 'deep_review.js', 'classification_v2.js']
      });
      await sleep(1200);
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
  sourceUrl?: string;
  tabId?: number | null;
}

/**
 * Executes Search & Scan across Walmart, Amazon, Target, or Costco.
 * In Extension mode: Controls browser tabs directly via Chromium APIs with strict domain check and fresh tab isolation.
 * In Web mode: Queries retailer proxy or prompts the user with zero fake/hardcoded data.
 */
export async function executeRealSearchScan(
  options: RealSearchScanOptions
): Promise<RealSearchResult> {
  const { keyword, platform, threshold, maxResults, includeReviews, onProgress, isCancelled } =
    options;
  const chrome = (window as any).chrome;

  // Web Fallback Mode: Strictly no mock / placeholder data (Requirement 4 & 5)
  if (!isExtensionRuntime()) {
    onProgress?.(`Connecting to retailer query proxy for ${platform}...`, 20);
    try {
      const resp = await fetch(
        `/api/retail-scrape?platform=${encodeURIComponent(platform)}&keyword=${encodeURIComponent(keyword)}&threshold=${threshold}`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
          onProgress?.('Extracted real product data from retailer.', 100);
          return {
            success: true,
            isExtension: false,
            products: data.products,
            complaints: data.complaints || [],
            deepResults: data.deepResults || [],
            keywordSummary: data.keywordSummary || [],
            sourceUrl: data.sourceUrl || buildRetailerSearchUrl(platform, keyword),
            tabId: null
          };
        } else if (data && data.error) {
          return {
            success: false,
            isExtension: false,
            products: [],
            complaints: [],
            deepResults: [],
            keywordSummary: [],
            error: data.error
          };
        }
      }
    } catch (e) {}

    // When Web cannot reach retailer due to anti-bot / CORS, report real status without fake data
    const platName = PLATFORM_DOMAINS[platform]?.name || platform;
    return {
      success: false,
      isExtension: false,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error: `Web端无法直接穿透[${platName}]的反爬虫安全策略。请点击右上角“Install Extension”在 Chrome 或 Edge 中加载插件，在真实浏览器会话中执行原生抓取，或在零售商商品页面点击侧边栏的“Scan Current Page”进行真实抓取。`
    };
  }

  // Extension Native Mode
  let searchTab: any = null;
  let callerTabId: number | null = null;

  try {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      callerTabId = currentTab?.id || null;
    } catch (e) {}

    onProgress?.(`Opening ${platform} in Chromium browser...`, 15);
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

    // Requirement 4: Wait for page load and wait for DOM content
    onProgress?.('Waiting for retailer page to render...', 35);
    await waitTabComplete(searchTab.id, 25000);
    await sleep(2500); // Allow dynamic JavaScript hydration (Target / Walmart React)

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

    // Requirement 7: Validate domain of target tab
    let finalUrl = searchUrl;
    try {
      const tabInfo = await chrome.tabs.get(searchTab.id);
      if (tabInfo?.url) finalUrl = tabInfo.url;
    } catch (e) {}

    const domainValidation = validatePlatformDomain(platform, finalUrl);
    if (!domainValidation.valid) {
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
        error: domainValidation.error || `当前页面不是[${domainValidation.expected}]，请确认是否选择了正确的平台标签。`
      };
    }

    // Requirement 3: Send scan message strictly to the newly created searchTab.id
    onProgress?.('Extracting live ratings, reviews, and barcodes...', 55);
    const scanResponse = await sendMessageWithScriptFallback(searchTab.id, {
      type: 'QC_COMBINED_SCAN',
      threshold,
      analyzeVisibleText: true,
      originKeyword: 'China',
      expectedPlatform: platform
    });

    if (!scanResponse || !scanResponse.products || scanResponse.products.length === 0) {
      const errText = scanResponse?.error || '未能从零售商页面提取到商品信息（可能出现反爬验证码拦截或页面未加载完成）。';
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
        error: errText
      };
    }

    // Requirement 5: Strict type check, never fallback to previous numbers
    let rawProducts: ProductItem[] = (scanResponse.products || []).map((p: any, idx: number) => ({
      id: `p-${Date.now()}-${idx + 1}`,
      retailer: p.retailer || platform,
      name: p.name || 'Unnamed Product',
      url: p.url || finalUrl,
      imageUrl: p.imageUrl || '',
      rating: typeof p.rating === 'number' && !isNaN(p.rating) ? p.rating : null,
      reviewCount: typeof p.reviewCount === 'number' && !isNaN(p.reviewCount) ? p.reviewCount : null,
      walmartNumber: p.walmartNumber || '',
      amazonNumber: p.amazonNumber || '',
      targetNumber: p.targetNumber || '',
      costcoNumber: p.costcoNumber || '',
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

    rawProducts = rawProducts.slice(0, maxResults || 50);

    const allComplaints: Complaint[] = [...(scanResponse.complaints || [])];
    const deepResults: any[] = [];

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
            await sleep(800);

            const deepRes = await sendMessageWithScriptFallback(deepTab.id, {
              type: 'QC_DEEP_LOW_SCAN',
              threshold
            });

            if (deepRes && Array.isArray(deepRes.complaints)) {
              deepResults.push({
                _searchName: target.name,
                _searchUrl: target.url,
                _searchRating: target.rating,
                productName: target.name,
                rating: target.rating,
                alertStatus: target.alertStatus,
                complaints: deepRes.complaints
              });

              deepRes.complaints.forEach((c: any) => {
                allComplaints.push({
                  id: `deep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  productId: target.id,
                  productName: target.name,
                  retailer: target.retailer,
                  reviewRating: c.reviewRating,
                  sentiment: c.sentiment || 'NEGATIVE',
                  issueType: c.issueType || 'Quality',
                  keywords: c.keywords || [],
                  userTag: c.userTag || '',
                  reviewTime: c.reviewTime || '',
                  comment: c.comment || '',
                  sourceUrl: target.url,
                  countryOfOrigin: target.countryOfOrigin
                });
              });
            }
          } catch (e) {
            console.warn('Deep scan item error:', e);
          } finally {
            if (deepTab?.id) {
              try {
                await chrome.tabs.remove(deepTab.id);
              } catch (e) {}
            }
          }
        }
      }
    }

    if (callerTabId) {
      try {
        await chrome.tabs.update(callerTabId, { active: true });
      } catch (e) {}
    }

    const savedTabId = searchTab?.id || null;
    if (searchTab?.id) {
      try {
        await chrome.tabs.remove(searchTab.id);
      } catch (e) {}
    }

    const keywordCounts = new Map<string, number>();
    allComplaints.forEach((c) => {
      (c.keywords || []).forEach((k) => {
        const norm = k.toLowerCase().trim();
        if (norm) {
          keywordCounts.set(norm, (keywordCounts.get(norm) || 0) + 1);
        }
      });
    });

    const keywordSummary = Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      isExtension: true,
      products: rawProducts,
      complaints: allComplaints,
      deepResults,
      keywordSummary,
      sourceUrl: finalUrl,
      tabId: savedTabId
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
      error: err?.message || 'Unexpected error during Search & Scan.'
    };
  }
}

/**
 * Scans the currently active tab or current product view.
 */
export async function executeRealActiveTabScan(threshold = 4.0): Promise<RealSearchResult> {
  const chrome = (window as any).chrome;

  // Web Fallback Mode: strictly no fake simulation
  if (!isExtensionRuntime()) {
    return {
      success: false,
      isExtension: false,
      products: [],
      complaints: [],
      deepResults: [],
      keywordSummary: [],
      error: '“Scan Current Page”功能需要运行在 Chrome 或 Microsoft Edge 扩展环境中。请在浏览器扩展栏中点击 MGA Quality Sentinel 运行，或在零售商商品页面点击侧边栏扫描。'
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
    const isSupported = /https:\/\/www\.(walmart\.(com|ca)|amazon\.(com|ca)|target\.com|costco\.(com|ca))\//.test(url);
    if (!isSupported) {
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: '当前页面不是受支持的零售商。请访问 Walmart US, Walmart Canada, Amazon US, Amazon Canada, Target, Costco US, 或 Costco Canada。'
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

    if (res.error) {
      return {
        success: false,
        isExtension: true,
        products: [],
        complaints: [],
        deepResults: [],
        keywordSummary: [],
        error: res.error
      };
    }

    if (res.mode === 'detail') {
      const meta = res.meta || {};
      const singleProduct: ProductItem = {
        id: `p-${Date.now()}`,
        retailer: meta.retailer || 'Retailer',
        name: meta.productName || 'Scanned Product',
        url: meta.sourceUrl || url,
        rating: typeof meta.rating === 'number' && !isNaN(meta.rating) ? meta.rating : null,
        reviewCount: typeof meta.reviewCount === 'number' && !isNaN(meta.reviewCount) ? meta.reviewCount : null,
        walmartNumber: meta.walmartNumber || '',
        amazonNumber: meta.amazonNumber || '',
        targetNumber: meta.targetNumber || '',
        costcoNumber: meta.costcoNumber || '',
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
        keywordSummary: res.keywordSummary || [],
        sourceUrl: meta.sourceUrl || url,
        tabId: activeTab.id
      };
    }

    const prods: ProductItem[] = (res.products || []).map((p: any, idx: number) => ({
      id: `p-${Date.now()}-${idx + 1}`,
      retailer: p.retailer || 'Retailer',
      name: p.name || 'Scanned Listing',
      url: p.url || url,
      rating: typeof p.rating === 'number' && !isNaN(p.rating) ? p.rating : null,
      reviewCount: typeof p.reviewCount === 'number' && !isNaN(p.reviewCount) ? p.reviewCount : null,
      walmartNumber: p.walmartNumber || '',
      amazonNumber: p.amazonNumber || '',
      targetNumber: p.targetNumber || '',
      costcoNumber: p.costcoNumber || '',
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
      keywordSummary: res.keywordSummary || [],
      sourceUrl: url,
      tabId: activeTab.id
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
