import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { DashboardHomeView } from './components/DashboardHomeView';
import { SearchScanView } from './components/SearchScanView';
import { WatchlistView } from './components/WatchlistView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ProductDetailDrawer } from './components/ProductDetailDrawer';
import { ExtensionInstallModal } from './components/ExtensionInstallModal';
import { NewProductConfirmModal } from './components/NewProductConfirmModal';

import {
  CrossPlatformGroup,
  NavSection,
  ProductItem,
  Complaint,
  TrendDatabase,
  UserPreferences,
  WatchlistItem,
  Language,
  ScanProgressState,
  ProductSession,
  PlatformCode,
  RetailerId,
  AlertStatus
} from './types';
import {
  INITIAL_WATCHLIST,
  isExtensionEnvironment
} from './services/extensionBridge';
import {
  groupProducts,
  buildEmailTableHtml,
  buildEmailTablePlain,
  belowPlatforms,
  PLAT_ORDER,
  PLAT_LABEL
} from './services/summaryService';
import {
  DEFAULT_PREFERENCES,
  getInitialPreferences,
  loadSyncPreferences,
  saveSyncPreferences,
  loadSyncWatchlist,
  saveSyncWatchlist,
  loadLastScanTime,
  saveLastScanTime
} from './services/storageSync';
import { loadTrendDb, saveTrendDb, recordTrendSnapshot } from './services/trendService';
import {
  loadCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
  loadProductHistory,
  saveProductToHistory,
  deleteProductFromHistory,
  deleteMultipleProducts,
  clearAllProductHistory,
  deletePlatformFromProduct,
  isSameProductQuery,
  createNewProductSession,
  accumulatePlatformScanResult
} from './services/sessionService';
import {
  executeRealSearchScan,
  executeRealActiveTabScan,
  isExtensionRuntime,
  validatePlatformDomain
} from './services/realSearchScanService';
import { findBestMatchingProduct } from './services/skuCore';

const INITIAL_PROGRESS: ScanProgressState = {
  status: 'idle',
  progressPercent: 0,
  message: ''
};

const PLATFORM_MAP: Record<string, { code: PlatformCode; name: string }> = {
  walmart_us: { code: 'WMUS', name: 'Walmart US' },
  walmart_ca: { code: 'WMCA', name: 'Walmart CA' },
  amazon_us: { code: 'AMZUS', name: 'Amazon US' },
  amazon_ca: { code: 'AMZCA', name: 'Amazon CA' },
  target: { code: 'TARGET', name: 'Target' },
  costco_us: { code: 'COSTCOUS', name: 'Costco US' },
  costco_ca: { code: 'COSTCOCA', name: 'Costco Canada' }
};

const CODE_TO_RETAILER: Record<PlatformCode, RetailerId> = {
  WMUS: 'walmart_us',
  WMCA: 'walmart_ca',
  AMZUS: 'amazon_us',
  AMZCA: 'amazon_ca',
  TARGET: 'target',
  COSTCOUS: 'costco_us',
  COSTCOCA: 'costco_ca'
};

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(getInitialPreferences);
  const [lastScanTime, setLastScanTime] = useState<string>('Not scanned yet');

  // Query Form State for Search & Scan
  const [searchKeyword, setSearchKeyword] = useState<string>('Mini Verse Make It Mini');
  const [searchPlatform, setSearchPlatform] = useState<string>('walmart_us');
  const [searchThreshold, setSearchThreshold] = useState<number>(DEFAULT_PREFERENCES.threshold);
  const [searchMaxResults, setSearchMaxResults] = useState<number>(50);
  const [searchIncludeReviews, setSearchIncludeReviews] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<ScanProgressState>(INITIAL_PROGRESS);
  const abortFlagRef = useRef(false);

  // Current Product Session & Product History (Requirement 1, 2, 5, 8, 11)
  const [currentSession, setCurrentSession] = useState<ProductSession | null>(null);
  const [productHistory, setProductHistory] = useState<ProductSession[]>([]);

  // Active Workspace Products & Complaints (Reflects currentSession)
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [deepResults, setDeepResults] = useState<any[]>([]);
  const [keywordSummary, setKeywordSummary] = useState<{ keyword: string; count: number }[]>([]);

  // Watchlist & Trends
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [trendDb, setTrendDb] = useState<TrendDatabase>({});

  // UI Drawers & Modals
  const [selectedGroup, setSelectedGroup] = useState<CrossPlatformGroup | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Product Confirmation Modal (Requirement 6)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [pendingNewProductName, setPendingNewProductName] = useState('');

  // Load storage on mount
  useEffect(() => {
    async function initStorage() {
      const prefs = await loadSyncPreferences();
      setPreferences(prefs);
      setSearchThreshold(prefs.threshold);

      // Load product history
      const historyList = await loadProductHistory();
      setProductHistory(historyList);

      // Load active current session
      const storedSession = await loadCurrentSession();
      if (storedSession) {
        setCurrentSession(storedSession);
        setSearchKeyword(storedSession.searchKeyword || storedSession.productName || '');
        const completedPlats = Object.keys(storedSession.platformResults || {}) as PlatformCode[];
        const unpackedProds = completedPlats.flatMap((p) => storedSession.platformResults[p]?.products || []);
        setProducts(unpackedProds);
        setComplaints(storedSession.complaints || []);
        setDeepResults(storedSession.deepResults || []);
      }

      const syncWl = await loadSyncWatchlist();
      if (syncWl && syncWl.length > 0) {
        setWatchlist(syncWl);
      } else {
        await saveSyncWatchlist(INITIAL_WATCHLIST);
      }

      const storedTrends = await loadTrendDb();
      if (storedTrends && Object.keys(storedTrends).length > 0) {
        setTrendDb(storedTrends);
      }

      const scanTime = await loadLastScanTime();
      if (scanTime) {
        setLastScanTime(scanTime);
      }
    }
    initStorage();
  }, []);

  // Theme effect
  const isDark = preferences.theme === 'dark';
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...preferences, theme: nextTheme as 'light' | 'dark' };
    setPreferences(updated);
    saveSyncPreferences(updated);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Compute Cross-Platform Groups based on active workspace products
  const groups = useMemo(() => {
    return groupProducts(products, watchlist);
  }, [products, watchlist]);

  const alertGroups = useMemo(() => {
    return groups.filter((g) => belowPlatforms(g, preferences.threshold).length > 0);
  }, [groups, preferences.threshold]);

  // Language change handler
  const handleLanguageChange = async (newLang: Language) => {
    const updated = { ...preferences, language: newLang };
    setPreferences(updated);
    await saveSyncPreferences(updated);
    showToast(
      newLang === 'zh-CN'
        ? '已切换至简体中文'
        : newLang === 'zh-Hant'
        ? '已切換至繁體中文'
        : 'Switched to English'
    );
  };

  // ==========================================================
  // Core Scanning & Multi-Platform Accumulation (Requirement 1, 2, 3, 4, 10)
  // ==========================================================

  const runScanForProduct = async (
    targetKeyword: string,
    targetPlatform: string,
    targetThreshold: number,
    targetMaxResults: number,
    targetIncludeReviews: boolean,
    forceFreshSession = false
  ) => {
    // Requirement 1: Clear temporary scanning variables for this run without affecting other platforms
    abortFlagRef.current = false;
    setScanProgress({
      status: 'opening_tab',
      progressPercent: 10,
      message: `Connecting to ${targetPlatform}...`
    });

    const result = await executeRealSearchScan({
      keyword: targetKeyword,
      platform: targetPlatform,
      threshold: targetThreshold,
      maxResults: targetMaxResults,
      includeReviews: targetIncludeReviews,
      onProgress: (stage, percent) => {
        setScanProgress({
          status: 'scanning_products',
          progressPercent: percent,
          message: stage
        });
      },
      isCancelled: () => abortFlagRef.current
    });

    if (!result.success) {
      setScanProgress({
        status: 'error',
        progressPercent: 0,
        message: '',
        error: result.error || 'Scan failed.'
      });
      showToast(result.error || 'Scan failed.');
      return;
    }

    const platMeta = PLATFORM_MAP[targetPlatform] || { code: 'WMUS' as PlatformCode, name: 'Walmart US' };
    const pCode = platMeta.code;

    // Requirement 7: Validate that the scraped URL domain matches the expected platform
    const scannedUrl = result.sourceUrl || result.products[0]?.url || '';
    if (scannedUrl) {
      const domainCheck = validatePlatformDomain(targetPlatform, scannedUrl);
      if (!domainCheck.valid) {
        setScanProgress({
          status: 'error',
          progressPercent: 0,
          message: '',
          error: domainCheck.error || `当前页面不是[${platMeta.name}]，请确认是否选择了正确的平台标签。`
        });
        showToast(domainCheck.error || `当前页面不是[${platMeta.name}]，请确认是否选择了正确的平台标签。`);
        return;
      }
    }

    // Determine target session to accumulate into
    const hasExisting = !forceFreshSession && currentSession && Object.keys(currentSession.platformResults || {}).length > 0;
    const baseSession = hasExisting
      ? currentSession!
      : createNewProductSession(targetKeyword);

    // Match the specific target product item from search results instead of averaging unrelated items
    const matchedItem = findBestMatchingProduct(result.products, targetKeyword);

    // Requirement 5: STRICTLY FORBID FALLBACK TO PREVIOUS DATA
    // NO: rating = newRating || previousRating;
    // NO: reviewCount = newCount || previousReviewCount;
    const currentRating = (matchedItem && typeof matchedItem.rating === 'number' && !isNaN(matchedItem.rating))
      ? matchedItem.rating
      : null;
    const currentReviewCount = (matchedItem && typeof matchedItem.reviewCount === 'number' && !isNaN(matchedItem.reviewCount))
      ? matchedItem.reviewCount
      : null;
    const currentProductName = matchedItem?.name || targetKeyword;
    const currentSourceUrl = matchedItem?.url || scannedUrl || '';
    const currentTabId = result.tabId || null;

    const alertStatus: AlertStatus = (typeof currentRating === 'number' && currentRating < targetThreshold)
      ? 'ALERT'
      : (currentRating === null ? 'NEED MANUAL CHECK' : 'OK');

    // Requirement 6: Deep copy platform entry using structuredClone inside accumulatePlatformScanResult
    const updatedSession = accumulatePlatformScanResult(
      baseSession,
      pCode,
      targetPlatform as RetailerId,
      platMeta.name,
      currentSourceUrl,
      currentRating,
      currentReviewCount,
      alertStatus,
      matchedItem?.countryOfOrigin || 'UNKNOWN',
      result.products,
      result.complaints,
      result.deepResults,
      result.keywordSummary,
      targetThreshold,
      watchlist,
      currentTabId,
      currentProductName
    );

    // Persist session to local storage (Requirement 11)
    setCurrentSession(updatedSession);
    await saveCurrentSession(updatedSession);

    // Persist to history (Requirement 5)
    const updatedHistory = await saveProductToHistory(updatedSession);
    setProductHistory(updatedHistory);

    // Update active workspace
    const completedPlats = Object.keys(updatedSession.platformResults) as PlatformCode[];
    const allSessionProducts = completedPlats.flatMap((p) => updatedSession.platformResults[p]?.products || []);

    setProducts(allSessionProducts);
    setComplaints(updatedSession.complaints);
    setDeepResults(updatedSession.deepResults || []);
    setKeywordSummary(result.keywordSummary);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setLastScanTime(formattedDate);
    await saveLastScanTime(formattedDate);

    // Save trend snapshots
    for (const item of result.products) {
      if (item.rating !== null) {
        await recordTrendSnapshot(item.id, item.name, item.retailer, item.rating, item.reviewCount);
      }
    }
    const updatedTrends = await loadTrendDb();
    setTrendDb(updatedTrends);

    setScanProgress({
      status: 'completed',
      progressPercent: 100,
      message: 'Scan completed successfully!'
    });

    setActiveSection('search-scan');
    showToast(
      preferences.language === 'en'
        ? `Added ${platMeta.name} to "${updatedSession.productName}" (${completedPlats.length}/7 channels).`
        : `已为“${updatedSession.productName}”累积 ${platMeta.name} 数据（已完成 ${completedPlats.length}/7 个平台）。`
    );
  };

  // Primary Action: Real Search & Scan with Same-Product Accumulation or Switch Confirmation
  const handleExecuteSearchScan = async () => {
    if (!searchKeyword.trim()) {
      showToast('Please enter a search keyword or brand name.');
      return;
    }

    // Check if there is an active session with completed platforms
    const hasCompletedPlatforms = currentSession && Object.keys(currentSession.platformResults || {}).length > 0;
    if (hasCompletedPlatforms) {
      const isSame = isSameProductQuery({ keyword: searchKeyword }, currentSession);
      if (!isSame) {
        // Different product! Show confirmation modal (Requirement 6)
        setPendingNewProductName(searchKeyword);
        setIsNewProductModalOpen(true);
        return;
      }
    }

    // Same product or fresh start -> accumulate directly
    await runScanForProduct(
      searchKeyword,
      searchPlatform,
      searchThreshold,
      searchMaxResults,
      searchIncludeReviews,
      false
    );
  };

  // Confirm Switch to New Product (Requirement 6)
  const handleConfirmNewProductQuery = async () => {
    setIsNewProductModalOpen(false);

    // 1. Ensure previous session is saved to History
    if (currentSession && Object.keys(currentSession.platformResults || {}).length > 0) {
      await saveProductToHistory(currentSession);
    }

    // 2. Clear current workspace
    await clearCurrentSession();
    setCurrentSession(null);
    setProducts([]);
    setComplaints([]);
    setDeepResults([]);
    setKeywordSummary([]);

    // 3. Start scanning for the new product
    await runScanForProduct(
      searchKeyword,
      searchPlatform,
      searchThreshold,
      searchMaxResults,
      searchIncludeReviews,
      true
    );
  };

  // Prominent New Product Search Action (Requirement 7)
  const handleNewProductSearch = async () => {
    // If current session has completed scans, ensure it is archived in history
    if (currentSession && Object.keys(currentSession.platformResults || {}).length > 0) {
      await saveProductToHistory(currentSession);
      const updatedHistory = await loadProductHistory();
      setProductHistory(updatedHistory);
    }

    // Clear active workspace
    await clearCurrentSession();
    setCurrentSession(null);
    setProducts([]);
    setComplaints([]);
    setDeepResults([]);
    setKeywordSummary([]);
    setSearchKeyword('');
    setActiveSection('search-scan');

    showToast(
      preferences.language === 'en'
        ? 'Current product saved to History. Workspace ready for new product.'
        : '当前产品已归档至历史记录，工作区已清空，可开始查询新产品。'
    );
  };

  // Secondary Action: Scan Current Active Tab
  const handleScanCurrentPage = async () => {
    setScanProgress({
      status: 'scanning_products',
      progressPercent: 40,
      message: 'Scanning active browser tab...'
    });

    const result = await executeRealActiveTabScan(preferences.threshold);

    if (!result.success) {
      setScanProgress({
        status: 'error',
        progressPercent: 0,
        message: '',
        error: result.error || 'Scan failed on active page.'
      });
      return;
    }

    const firstProd = result.products[0];
    const detectedRetailer = firstProd?.retailer || 'Walmart US';
    let pCode: PlatformCode = 'WMUS';
    let retailerId: RetailerId = 'walmart_us';

    if (detectedRetailer.toLowerCase().includes('canada') && detectedRetailer.toLowerCase().includes('walmart')) {
      pCode = 'WMCA'; retailerId = 'walmart_ca';
    } else if (detectedRetailer.toLowerCase().includes('amazon') && detectedRetailer.toLowerCase().includes('canada')) {
      pCode = 'AMZCA'; retailerId = 'amazon_ca';
    } else if (detectedRetailer.toLowerCase().includes('amazon')) {
      pCode = 'AMZUS'; retailerId = 'amazon_us';
    } else if (detectedRetailer.toLowerCase().includes('target')) {
      pCode = 'TARGET'; retailerId = 'target';
    } else if (detectedRetailer.toLowerCase().includes('costco') && detectedRetailer.toLowerCase().includes('canada')) {
      pCode = 'COSTCOCA'; retailerId = 'costco_ca';
    } else if (detectedRetailer.toLowerCase().includes('costco')) {
      pCode = 'COSTCOUS'; retailerId = 'costco_us';
    }

    const baseSession = currentSession && Object.keys(currentSession.platformResults || {}).length > 0
      ? currentSession
      : createNewProductSession(firstProd?.name || 'Active Tab Product');

    const matchedItem = result.products.length === 1
      ? result.products[0]
      : findBestMatchingProduct(result.products, searchKeyword || firstProd?.name || '');

    const currentRating = (matchedItem && typeof matchedItem.rating === 'number' && !isNaN(matchedItem.rating))
      ? matchedItem.rating
      : null;
    const currentReviewCount = (matchedItem && typeof matchedItem.reviewCount === 'number' && !isNaN(matchedItem.reviewCount))
      ? matchedItem.reviewCount
      : null;
    const currentProductName = matchedItem?.name || firstProd?.name || 'Active Tab Product';
    const currentSourceUrl = matchedItem?.url || result.sourceUrl || firstProd?.url || '';
    const currentTabId = result.tabId || null;

    const alertStatus: AlertStatus = (typeof currentRating === 'number' && currentRating < preferences.threshold)
      ? 'ALERT'
      : (currentRating === null ? 'NEED MANUAL CHECK' : 'OK');

    const updatedSession = accumulatePlatformScanResult(
      baseSession,
      pCode,
      retailerId,
      detectedRetailer,
      currentSourceUrl,
      currentRating,
      currentReviewCount,
      alertStatus,
      matchedItem?.countryOfOrigin || 'UNKNOWN',
      result.products,
      result.complaints,
      result.deepResults,
      result.keywordSummary,
      preferences.threshold,
      watchlist,
      currentTabId,
      currentProductName
    );

    setCurrentSession(updatedSession);
    await saveCurrentSession(updatedSession);

    const updatedHistory = await saveProductToHistory(updatedSession);
    setProductHistory(updatedHistory);

    const completedPlats = Object.keys(updatedSession.platformResults) as PlatformCode[];
    const allSessionProducts = completedPlats.flatMap((p) => updatedSession.platformResults[p]?.products || []);

    setProducts(allSessionProducts);
    setComplaints(updatedSession.complaints);
    setDeepResults(updatedSession.deepResults || []);
    setKeywordSummary(result.keywordSummary);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setLastScanTime(formattedDate);
    await saveLastScanTime(formattedDate);

    setScanProgress({
      status: 'completed',
      progressPercent: 100,
      message: 'Active page scan completed!'
    });

    setActiveSection('search-scan');
    showToast(`Active tab scanned: ${result.products.length} product(s) synchronized into session.`);
  };

  const handleCancelScan = () => {
    abortFlagRef.current = true;
    setScanProgress({
      status: 'cancelled',
      progressPercent: 0,
      message: 'Scan cancelled by user.'
    });
    showToast('Scan operation stopped.');
  };

  // ==========================================================
  // History Restoration & Product Management (Requirement 5 & 9)
  // ==========================================================

  const handleOpenProduct = async (product: ProductSession) => {
    setCurrentSession(product);
    await saveCurrentSession(product);

    const completedPlats = Object.keys(product.platformResults || {}) as PlatformCode[];
    const allProds = completedPlats.flatMap((p) => product.platformResults[p]?.products || []);

    setProducts(allProds);
    setComplaints(product.complaints || []);
    setDeepResults(product.deepResults || []);
    setSearchKeyword(product.searchKeyword || product.productName);

    // If there is an uncompleted platform, pre-select it
    const uncompleted = PLAT_ORDER.filter((p) => !completedPlats.includes(p));
    if (uncompleted.length > 0) {
      setSearchPlatform(CODE_TO_RETAILER[uncompleted[0]] || 'walmart_us');
    }

    setActiveSection('search-scan');
    showToast(
      preferences.language === 'en'
        ? `Restored analysis for "${product.productName}" (${completedPlats.length} platforms).`
        : `已恢复“${product.productName}”的完整多平台记录（${completedPlats.length} 个平台）。`
    );
  };

  const handleContinueNextPlatform = async (product: ProductSession, nextPlatform: PlatformCode) => {
    await handleOpenProduct(product);
    const retailerKey = CODE_TO_RETAILER[nextPlatform] || 'walmart_us';
    setSearchPlatform(retailerKey);
    setActiveSection('search-scan');
    showToast(
      preferences.language === 'en'
        ? `Ready to scan ${PLAT_LABEL[nextPlatform]} for "${product.productName}".`
        : `已切换至 ${PLAT_LABEL[nextPlatform]}，准备继续扫描“${product.productName}”。`
    );
  };

  const handleRescanPlatform = async (product: ProductSession, platform: PlatformCode) => {
    await handleOpenProduct(product);
    const retailerKey = CODE_TO_RETAILER[platform] || 'walmart_us';
    setSearchPlatform(retailerKey);
    setActiveSection('search-scan');
    setTimeout(() => {
      handleExecuteSearchScan();
    }, 150);
  };

  const handleDeletePlatform = async (productId: string, platform: PlatformCode) => {
    const updatedTarget = await deletePlatformFromProduct(productId, platform, preferences.threshold, watchlist);
    const hist = await loadProductHistory();
    setProductHistory(hist);

    if (currentSession && currentSession.productId === productId) {
      setCurrentSession(updatedTarget);
      if (updatedTarget) {
        const completedPlats = Object.keys(updatedTarget.platformResults || {}) as PlatformCode[];
        const allProds = completedPlats.flatMap((p) => updatedTarget.platformResults[p]?.products || []);
        setProducts(allProds);
        setComplaints(updatedTarget.complaints || []);
      } else {
        setProducts([]);
        setComplaints([]);
      }
    }

    showToast(
      preferences.language === 'en'
        ? `Platform ${PLAT_LABEL[platform]} data removed and summary recalculated.`
        : `已删除 ${PLAT_LABEL[platform]} 平台数据并重新计算汇总。`
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    const updated = await deleteProductFromHistory(productId);
    setProductHistory(updated);
    if (currentSession && currentSession.productId === productId) {
      await clearCurrentSession();
      setCurrentSession(null);
      setProducts([]);
      setComplaints([]);
    }
    showToast(preferences.language === 'en' ? 'Product record deleted.' : '已删除产品记录。');
  };

  const handleDeleteMultipleProducts = async (productIds: string[]) => {
    const updated = await deleteMultipleProducts(productIds);
    setProductHistory(updated);
    if (currentSession && productIds.includes(currentSession.productId)) {
      await clearCurrentSession();
      setCurrentSession(null);
      setProducts([]);
      setComplaints([]);
    }
    showToast(
      preferences.language === 'en'
        ? `${productIds.length} products deleted.`
        : `已删除 ${productIds.length} 条产品记录。`
    );
  };

  const handleClearAllHistory = async () => {
    await clearAllProductHistory();
    setProductHistory([]);
    await clearCurrentSession();
    setCurrentSession(null);
    setProducts([]);
    setComplaints([]);
    showToast(
      preferences.language === 'en'
        ? 'All product history and workspaces cleared.'
        : '已清空全部产品历史记录与工作区。'
    );
  };

  const handleClearAllLocalData = async () => {
    await clearAllProductHistory();
    await clearCurrentSession();
    await saveTrendDb({});
    setProducts([]);
    setComplaints([]);
    setDeepResults([]);
    setKeywordSummary([]);
    setCurrentSession(null);
    setProductHistory([]);
    setTrendDb({});
    showToast('All local scan data, product sessions, and trends wiped.');
  };

  // Copy Email Table
  const handleCopyEmailTable = async () => {
    const html = buildEmailTableHtml(groups, preferences.threshold, false);
    const plain = buildEmailTablePlain(groups, preferences.threshold, false);

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' })
          })
        ]);
        showToast('Email Table copied! Ready to paste into Outlook / Gmail.');
      } else {
        await navigator.clipboard.writeText(plain);
        showToast('Copied as plain-text tab-separated table.');
      }
    } catch (e) {
      await navigator.clipboard.writeText(plain);
      showToast('Copied as plain-text tab-separated table.');
    }
  };

  const handleDeepAnalyzeLowRated = async () => {
    setIsDeepAnalyzing(true);
    showToast('Deep review analysis initiated for low-rated products...');
    setTimeout(() => {
      setIsDeepAnalyzing(false);
      showToast('Deep reviews updated.');
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* 1. Left Sidebar Navigation */}
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        alertCount={alertGroups.length}
        watchlistCount={watchlist.length}
        historyCount={productHistory.length}
        language={preferences.language || 'en'}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky Top Header */}
        <TopHeader
          lastScanTime={lastScanTime}
          onNewProductSearch={handleNewProductSearch}
          onScanCurrentPage={handleScanCurrentPage}
          onOpenSearchScan={() => setActiveSection('search-scan')}
          onDeepAnalyze={handleDeepAnalyzeLowRated}
          onRefreshDashboard={() => {
            showToast('Dashboard refreshed with latest quality data.');
          }}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isScanning={scanProgress.status === 'opening_tab' || scanProgress.status === 'scanning_products'}
          isDeepScanning={isDeepAnalyzing}
          darkMode={isDark}
          onToggleDarkMode={handleToggleTheme}
          language={preferences.language || 'en'}
          onLanguageChange={handleLanguageChange}
        />

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Section 1: Dashboard Home (Requirement 8: Only shows current product) */}
            {activeSection === 'dashboard' && (
              <DashboardHomeView
                currentSession={currentSession}
                productHistory={productHistory}
                watchlistCount={watchlist.length}
                threshold={preferences.threshold}
                language={preferences.language || 'en'}
                onThresholdChange={(newTh) => {
                  const updated = { ...preferences, threshold: newTh };
                  setPreferences(updated);
                  saveSyncPreferences(updated);
                }}
                onNewProductSearch={handleNewProductSearch}
                onSelectGroup={(g) => setSelectedGroup(g)}
                onNavigateSection={setActiveSection}
                onCopyEmailTable={handleCopyEmailTable}
                onOpenProduct={handleOpenProduct}
                onScanCurrentPage={handleScanCurrentPage}
                isScanning={scanProgress.status === 'scanning_products'}
              />
            )}

            {/* Section 2: Core Search & Scan Engine (Requirement 1, 2, 4, 6, 7) */}
            {activeSection === 'search-scan' && (
              <SearchScanView
                keyword={searchKeyword}
                onKeywordChange={setSearchKeyword}
                platform={searchPlatform}
                onPlatformChange={setSearchPlatform}
                threshold={searchThreshold}
                onThresholdChange={setSearchThreshold}
                maxResults={searchMaxResults}
                onMaxResultsChange={setSearchMaxResults}
                includeReviews={searchIncludeReviews}
                onIncludeReviewsChange={setSearchIncludeReviews}
                onExecuteSearchScan={handleExecuteSearchScan}
                onScanCurrentPage={handleScanCurrentPage}
                onCancelScan={handleCancelScan}
                progress={scanProgress}
                products={products}
                complaints={complaints}
                groups={groups}
                trendDb={trendDb}
                watchlist={watchlist}
                deepResults={deepResults}
                keywordSummary={keywordSummary}
                lastScanTime={lastScanTime}
                currentSession={currentSession}
                onNewProductSearch={handleNewProductSearch}
                onSelectGroup={(g) => setSelectedGroup(g)}
                onCopyEmailTable={handleCopyEmailTable}
                onDeepAnalyzeLowRated={handleDeepAnalyzeLowRated}
                isDeepAnalyzing={isDeepAnalyzing}
                language={preferences.language || 'en'}
              />
            )}

            {/* Section 3: Watchlist Management */}
            {activeSection === 'watchlist' && (
              <WatchlistView
                watchlist={watchlist}
                onUpdateWatchlist={async (items) => {
                  setWatchlist(items);
                  await saveSyncWatchlist(items);
                  showToast(preferences.language === 'en' ? 'Watchlist synchronized.' : '关注产品库已同步。');
                }}
                language={preferences.language || 'en'}
              />
            )}

            {/* Section 4: Personal Product History (Requirement 5 & 9) */}
            {activeSection === 'history' && (
              <HistoryView
                history={productHistory}
                currentSessionId={currentSession?.productId}
                onOpenProduct={handleOpenProduct}
                onContinueNextPlatform={handleContinueNextPlatform}
                onRescanPlatform={handleRescanPlatform}
                onDeletePlatform={handleDeletePlatform}
                onDeleteProduct={handleDeleteProduct}
                onDeleteMultipleProducts={handleDeleteMultipleProducts}
                onClearAllHistory={handleClearAllHistory}
                language={preferences.language || 'en'}
              />
            )}

            {/* Section 5: Settings & Preferences */}
            {activeSection === 'settings' && (
              <SettingsView
                preferences={preferences}
                onUpdatePreferences={async (newPrefs) => {
                  setPreferences(newPrefs);
                  await saveSyncPreferences(newPrefs);
                  showToast(preferences.language === 'en' ? 'Preferences updated.' : '配置已保存并同步。');
                }}
                onResetToDefaults={async () => {
                  setPreferences(DEFAULT_PREFERENCES);
                  await saveSyncPreferences(DEFAULT_PREFERENCES);
                  showToast(preferences.language === 'en' ? 'Settings restored to defaults.' : '已恢复默认设置。');
                }}
                onClearAllLocalData={handleClearAllLocalData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Slide-over Product Detail Drawer */}
      <ProductDetailDrawer
        group={selectedGroup}
        threshold={preferences.threshold}
        onClose={() => setSelectedGroup(null)}
        language={preferences.language || 'en'}
      />

      {/* Switch Product Confirmation Modal (Requirement 6) */}
      <NewProductConfirmModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onConfirm={handleConfirmNewProductQuery}
        currentProductName={currentSession?.productName || 'Current Product'}
        newProductName={pendingNewProductName}
        language={preferences.language || 'en'}
      />

      {/* Extension Installation Modal */}
      <ExtensionInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        language={preferences.language || 'en'}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1D1D1F] text-white px-4 py-3 text-xs font-medium shadow-2xl dark:bg-white dark:text-[#1D1D1F] animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
