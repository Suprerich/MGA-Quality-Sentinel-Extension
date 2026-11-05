import React, { useState } from 'react';
import {
  Search,
  Scan,
  RotateCw,
  XCircle,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Mail,
  Zap,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  TrendingUp,
  BarChart3,
  BookmarkCheck,
  Star,
  Sliders,
  Filter,
  Download,
  AlertOctagon,
  HelpCircle,
  Loader2
} from 'lucide-react';
import {
  ProductItem,
  Complaint,
  CrossPlatformGroup,
  WatchlistItem,
  TrendDatabase,
  Language,
  ScanProgressState,
  SearchHistoryRecord
} from '../types';
import { getTranslation } from '../services/i18n';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms } from '../services/summaryService';
import { exportLowRatedExcel, exportFullCsv } from '../services/exportService';

// Embedded child subviews for results
import { CrossPlatformMatrix } from './CrossPlatformMatrix';
import { ComplaintAnalyticsView } from './ComplaintAnalyticsView';
import { DeepReviewInsightsView } from './DeepReviewInsightsView';
import { TrendTrackingView } from './TrendTrackingView';
import { SkuValidationView } from './SkuValidationView';
import { ExportsCenterView } from './ExportsCenterView';

interface SearchScanViewProps {
  // Query Inputs & Handlers
  keyword: string;
  onKeywordChange: (val: string) => void;
  platform: string;
  onPlatformChange: (val: string) => void;
  threshold: number;
  onThresholdChange: (val: number) => void;
  maxResults: number;
  onMaxResultsChange: (val: number) => void;
  includeReviews: boolean;
  onIncludeReviewsChange: (val: boolean) => void;

  // Execution
  onExecuteSearchScan: () => void;
  onScanCurrentPage: () => void;
  onCancelScan: () => void;
  progress: ScanProgressState;

  // Active Results
  products: ProductItem[];
  complaints: Complaint[];
  groups: CrossPlatformGroup[];
  trendDb: TrendDatabase;
  watchlist: WatchlistItem[];
  deepResults?: any[];
  keywordSummary?: { keyword: string; count: number }[];
  lastScanTime: string;

  // Session Management (Requirement 1, 2, 6, 7)
  currentSession?: import('../types').ProductSession | null;
  onNewProductSearch?: () => void;

  // Secondary actions
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onCopyEmailTable: () => void;
  onDeepAnalyzeLowRated: () => void;
  isDeepAnalyzing?: boolean;

  language: Language;
}

export const SearchScanView: React.FC<SearchScanViewProps> = ({
  keyword,
  onKeywordChange,
  platform,
  onPlatformChange,
  threshold,
  onThresholdChange,
  maxResults,
  onMaxResultsChange,
  includeReviews,
  onIncludeReviewsChange,
  onExecuteSearchScan,
  onScanCurrentPage,
  onCancelScan,
  progress,
  products,
  complaints,
  groups,
  trendDb,
  watchlist,
  deepResults = [],
  keywordSummary = [],
  lastScanTime,
  currentSession = null,
  onNewProductSearch,
  onSelectGroup,
  onCopyEmailTable,
  onDeepAnalyzeLowRated,
  isDeepAnalyzing = false,
  language
}) => {
  const t = getTranslation(language);
  const [activeResultTab, setActiveResultTab] = useState<
    'overview' | 'matrix' | 'complaints' | 'deep' | 'trends' | 'sku' | 'exports'
  >('overview');

  const isScanning = progress.status !== 'idle' && progress.status !== 'completed' && progress.status !== 'cancelled' && progress.status !== 'error';

  // Rule 2: Strictly item.rating != null && item.rating < threshold
  const lowRatedProducts = products.filter(
    (p) => typeof p.rating === 'number' && !isNaN(p.rating) && p.rating < threshold
  );
  const lowestRating =
    lowRatedProducts.length > 0
      ? Number(Math.min(...lowRatedProducts.map((p) => p.rating as number)).toFixed(1))
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Header & Description */}
      <div>
        <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
          {t.navSearchScan}
        </h1>
        <p className="text-body text-[#8E8E93] mt-1">
          {t.resultsSubtitle}
        </p>
      </div>

      {/* Active Product Session Banner (Requirements 1, 2, 5, 6, 7) */}
      {currentSession && Object.keys(currentSession.platformResults || {}).length > 0 && (
        <div className="rounded-2xl border border-[#007AFF]/30 bg-gradient-to-r from-[#007AFF]/5 via-[#007AFF]/10 to-transparent p-5 dark:border-[#007AFF]/40 dark:from-[#007AFF]/10 dark:via-[#007AFF]/15 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#007AFF] text-white">
                  {language === 'en' ? 'Active Product Session' : '当前产品查询会话'}
                </span>
                <span className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {currentSession.productName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E8E93] font-mono">
                {currentSession.identifiers?.upc && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    UPC: {currentSession.identifiers.upc}
                  </span>
                )}
                {currentSession.identifiers?.model && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    Model: {currentSession.identifiers.model}
                  </span>
                )}
                {currentSession.identifiers?.walmartNumber && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    WM#: {currentSession.identifiers.walmartNumber}
                  </span>
                )}
                {currentSession.identifiers?.amazonNumber && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    ASIN: {currentSession.identifiers.amazonNumber}
                  </span>
                )}
                {currentSession.identifiers?.targetNumber && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    TCIN: {currentSession.identifiers.targetNumber}
                  </span>
                )}
                {currentSession.identifiers?.costcoNumber && (
                  <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    Costco#: {currentSession.identifiers.costcoNumber}
                  </span>
                )}
                <span>
                  · {language === 'en' ? 'Multi-channel cross-platform synthesis' : '跨平台数据持续累积中'}
                </span>
              </div>
            </div>

            {onNewProductSearch && (
              <button
                type="button"
                onClick={onNewProductSearch}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-center"
              >
                <span>+ {t.btnNewProductSearch}</span>
              </button>
            )}
          </div>

          {/* Cross-Platform Summary Status Strip (Requirement 6) */}
          <div className="flex flex-wrap items-center gap-3 py-2 px-3 bg-white/70 dark:bg-black/20 rounded-xl border border-[#007AFF]/20 text-xs">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {language === 'en' ? 'Queried' : '已查询'}: <b className="text-[#007AFF] font-mono">{Object.keys(currentSession.platformResults || {}).length} / 7</b> {language === 'en' ? 'platforms' : '个平台'}
            </span>
            <span className="text-[#8E8E93]">·</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {language === 'en' ? 'Total Scanned' : '共扫描'}: <b className="font-mono">{currentSession.summary?.totalScanned ?? products.length}</b> {language === 'en' ? 'items' : '个商品'}
            </span>
            <span className="text-[#8E8E93]">·</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {language === 'en' ? 'Below Threshold' : '低分商品'}: <b className={`font-mono ${(currentSession.summary?.totalLowRated ?? lowRatedProducts.length) > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>{currentSession.summary?.totalLowRated ?? lowRatedProducts.length}</b> {language === 'en' ? 'items' : '个'}
            </span>
            <span className="text-[#8E8E93]">·</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {language === 'en' ? 'Lowest Rating' : '全部平台中的最低评分'}:{' '}
              {currentSession.summary?.lowestRating != null ? (
                <b className="font-mono text-[#FF3B30]">{currentSession.summary.lowestRating}★</b>
              ) : (
                <span className="text-[#34C759] font-medium">{language === 'en' ? 'No items below threshold' : '未发现低于警戒值的商品'}</span>
              )}
            </span>
          </div>

          {/* 7 Channels Status Strip (Requirement 5) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {PLAT_ORDER.map((pCode) => {
              const res = currentSession.platformResults?.[pCode];
              const isScanned = !!res;
              const retailerKey = {
                WMUS: 'walmart_us',
                WMCA: 'walmart_ca',
                AMZUS: 'amazon_us',
                AMZCA: 'amazon_ca',
                TARGET: 'target',
                COSTCOUS: 'costco_us',
                COSTCOCA: 'costco_ca'
              }[pCode];

              const total = res?.totalScanned ?? (res?.products?.length ?? 0);
              const lowCount = res?.lowRatedCount ?? (res?.lowRatedItems?.length ?? 0);
              const lowest = res?.lowestRating ?? null;
              const queryTime = res?.scannedAt
                ? new Date(res.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={pCode}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    isScanned
                      ? lowCount > 0
                        ? 'border-[#FF3B30]/40 bg-[#FF3B30]/10 text-[#FF3B30]'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-[#1C1C1E]/70 text-[#8E8E93]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] truncate">
                      {PLAT_LABEL[pCode]}
                    </span>
                    {isScanned ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (retailerKey) onPlatformChange(retailerKey);
                        }}
                        className="text-[10px] text-[#007AFF] font-bold hover:underline"
                        title={language === 'en' ? 'Select this channel to scan' : '选择此平台并查询'}
                      >
                        + {language === 'en' ? 'Scan' : '查询'}
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-0.5 text-[10px] font-mono leading-tight">
                    {isScanned ? (
                      <>
                        <div className="text-neutral-700 dark:text-neutral-300">
                          {language === 'en' ? 'Scanned' : '扫描'}：<b>{total}</b> {language === 'en' ? 'items' : '个商品'}
                        </div>
                        <div className={lowCount > 0 ? 'text-[#FF3B30] font-bold' : 'text-[#34C759]'}>
                          {language === 'en' ? `< ${threshold.toFixed(1)}` : `低于${threshold.toFixed(1)}`}：<b>{lowCount}</b> {language === 'en' ? 'items' : '个'}
                        </div>
                        <div className="font-bold">
                          {lowest != null ? (
                            <span className="text-[#FF3B30]">
                              {language === 'en' ? 'Lowest' : '最低评分'}：{lowest.toFixed(1)}★
                            </span>
                          ) : (
                            <span className="text-[#34C759] font-normal">
                              {language === 'en' ? 'No Low Rating' : '无低分'}
                            </span>
                          )}
                        </div>
                        {queryTime && (
                          <div className="text-[#8E8E93] text-[9px] pt-0.5">
                            {queryTime}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[#8E8E93] text-[10px] block py-1">{t.statusNotScanned || '未查询'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Primary Query Formulation Card */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E] transition-all">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isScanning) onExecuteSearchScan();
          }}
          className="space-y-4"
        >
          {/* Row 1: Search Keyword & Platform Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Input */}
            <div className="md:col-span-8 space-y-1">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>{t.searchKeywordLabel}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => onKeywordChange(e.target.value)}
                  placeholder={t.searchKeywordPlaceholder}
                  disabled={isScanning}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] rounded-xl outline-none transition-all pr-8"
                />
                {keyword && !isScanning && (
                  <button
                    type="button"
                    onClick={() => onKeywordChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Platform Dropdown */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>{t.platformLabel}</span>
              </label>
              <select
                value={platform}
                onChange={(e) => onPlatformChange(e.target.value)}
                disabled={isScanning}
                className="w-full px-3 py-2.5 text-sm bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] rounded-xl outline-none transition-all cursor-pointer"
              >
                <option value="walmart_us">Walmart US</option>
                <option value="walmart_ca">Walmart Canada</option>
                <option value="amazon_us">Amazon US</option>
                <option value="amazon_ca">Amazon Canada</option>
                <option value="target">Target</option>
                <option value="costco_us">Costco US</option>
                <option value="costco_ca">Costco Canada</option>
              </select>
            </div>
          </div>

          {/* Row 2: Parameters & Review Option */}
          <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Rating Threshold */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">{t.ratingThreshold}:</span>
                <input
                  type="range"
                  min="2.5"
                  max="4.8"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                  disabled={isScanning}
                  className="w-24 accent-[#007AFF] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#FF3B30] tabular-nums">
                  &lt; {threshold.toFixed(1)}
                </span>
              </div>

              {/* Max Results */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">{t.maxResults}:</span>
                <select
                  value={maxResults}
                  onChange={(e) => onMaxResultsChange(parseInt(e.target.value, 10))}
                  disabled={isScanning}
                  className="text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-1 rounded-lg border-none outline-none font-medium cursor-pointer"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>

              {/* Include Reviews Checkbox */}
              <label className="flex items-center gap-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeReviews}
                  onChange={(e) => onIncludeReviewsChange(e.target.checked)}
                  disabled={isScanning}
                  className="rounded accent-[#007AFF] h-3.5 w-3.5 cursor-pointer"
                />
                <span>{t.includeReviews}</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Scan Current Page (Secondary) */}
              <button
                type="button"
                onClick={onScanCurrentPage}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-xl transition-colors whitespace-nowrap"
              >
                <Scan className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>{t.btnScanCurrent}</span>
              </button>

              {/* Search & Scan (Primary) */}
              <button
                type="submit"
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-all shadow-2xs whitespace-nowrap disabled:opacity-50"
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Search className="h-4 w-4 text-white" />
                )}
                <span>{isScanning ? t.btnScanning : t.btnStartSearchScan}</span>
              </button>

              {/* Cancel / Stop button */}
              {isScanning && (
                <button
                  type="button"
                  onClick={onCancelScan}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-xl transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{t.btnStopScan}</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Live Progress Bar & Stage Indicator */}
        {isScanning && (
          <div className="mt-4 pt-4 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#007AFF] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{progress.message || t.scanStatusOpening}</span>
              </span>
              <span className="font-mono text-[#8E8E93] tabular-nums">
                {progress.progressPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007AFF] transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {progress.error && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs text-[#FF3B30] flex items-start gap-2.5">
            <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">{progress.error}</div>
              <div className="text-[11px] text-[#FF3B30]/80">
                Ensure you are running the extension unpacked in Chrome or Edge and connected to retail portals.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Empty State Guidance when No Products Scanned Yet */}
      {products.length === 0 && !isScanning && (
        <div className="rounded-2xl border border-dashed border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#FFFFFF]/50 dark:bg-[#1C1C1E]/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF]">
            <Search className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.emptySearchScanTitle}
            </h3>
            <p className="text-xs text-[#8E8E93] leading-relaxed">
              {t.emptySearchScanDesc}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                onKeywordChange('Mini Verse Make It Mini');
                onExecuteSearchScan();
              }}
              className="px-4 py-2 text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-xl transition-colors"
            >
              Try: "Mini Verse Make It Mini"
            </button>
            <button
              onClick={() => {
                onKeywordChange('Bratz');
                onExecuteSearchScan();
              }}
              className="px-4 py-2 text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-xl transition-colors"
            >
              Try: "Bratz"
            </button>
          </div>
        </div>
      )}

      {/* 4. Active Scan Results Area */}
      {products.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* Result Metric Banner & Action Hub (Requirement 3 & 7: No average rating) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Total Scanned */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                {language === 'en' ? 'Total Products Scanned' : '扫描商品总数'}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {products.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">{language === 'en' ? 'items' : '个商品'}</span>
              </div>
            </div>

            {/* Metric 2: Alert Products Below Threshold */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider flex items-center justify-between">
                <span>{language === 'en' ? 'Below Threshold' : '低于警戒值商品'}</span>
                <span className="text-[#FF3B30] font-mono text-[10px]">&lt; {threshold.toFixed(1)}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    lowRatedProducts.length > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                  }`}
                >
                  {lowRatedProducts.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">{language === 'en' ? 'flagged' : '个'}</span>
              </div>
            </div>

            {/* Metric 3: Lowest Rating (Requirement 7) */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                {language === 'en' ? 'Lowest Rating' : '最低评分'}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                {lowestRating !== null ? (
                  <>
                    <span className="font-mono text-2xl font-bold text-[#FF3B30] tabular-nums">
                      {lowestRating.toFixed(1)}★
                    </span>
                    <span className="text-[10px] text-[#8E8E93] truncate">
                      {language === 'en' ? 'in low-rated' : '低分最小值'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-[#34C759]">
                    {language === 'en' ? 'No items < threshold' : '未发现低于警戒值商品'}
                  </span>
                )}
              </div>
            </div>

            {/* Metric 4: Customer Complaints Analyzed */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                {language === 'en' ? 'Customer Reviews' : '抓取评论数'}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {complaints.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">{language === 'en' ? 'analyzed' : '条'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Bar for Results */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.resultsTitle}:
              </span>
              <span className="text-xs font-mono text-[#8E8E93]">
                "{keyword || 'All'}" on {platform}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Deep Analyze All Low-Rated */}
              {lowRatedProducts.length > 0 && (
                <button
                  onClick={onDeepAnalyzeLowRated}
                  disabled={isDeepAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-lg transition-colors"
                >
                  {isDeepAnalyzing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>{t.btnDeepAnalyzeAll} ({lowRatedProducts.length})</span>
                </button>
              )}

              {/* Copy Email Table */}
              <button
                onClick={onCopyEmailTable}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>{t.btnCopyEmailTable}</span>
              </button>

              {/* Export Excel */}
              <button
                onClick={() => exportLowRatedExcel(products, threshold)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#34C759]" />
                <span>{t.btnExportExcel}</span>
              </button>

              {/* Re-Scan */}
              <button
                onClick={onExecuteSearchScan}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-lg transition-colors shadow-2xs"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>{t.btnRescan}</span>
              </button>
            </div>
          </div>

          {/* Result Sub-Navigation Tabs */}
          <div className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: language === 'en' ? `Low-Rated Items (< ${threshold.toFixed(1)})` : `低分商品列表 (< ${threshold.toFixed(1)})`, count: lowRatedProducts.length },
              { id: 'matrix', label: t.tabCrossPlatform, count: groups.length },
              { id: 'complaints', label: t.tabComplaints, count: complaints.length },
              { id: 'deep', label: t.tabDeepReview, count: deepResults.length },
              { id: 'trends', label: t.tabTrends },
              { id: 'sku', label: t.tabSkuValidation },
              { id: 'exports', label: t.tabExports }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  activeResultTab === tab.id
                    ? 'border-[#007AFF] text-[#007AFF]'
                    : 'border-transparent text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeResultTab === tab.id
                        ? tab.id === 'overview' && lowRatedProducts.length > 0 ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#007AFF]/10 text-[#007AFF]'
                        : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Subview 1: Products Overview List (Requirements 1 & 8: Low-Rated Items Only) */}
          {activeResultTab === 'overview' && (
            <div className="space-y-4">
              {lowRatedProducts.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-[#FAFAFC] dark:bg-[#18181A] rounded-2xl border border-[#E5E5EA] dark:border-[#2C2C2E]">
                  <CheckCircle className="h-8 w-8 text-[#34C759] mx-auto" />
                  <div className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'en' ? 'No items below alert threshold' : '未发现低于警戒值的商品'}
                  </div>
                  <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
                    {language === 'en'
                      ? `Total ${products.length} product variant(s) scanned. All maintain ratings ≥ ${threshold.toFixed(1)}★. No quality alerts triggered.`
                      : `本次共扫描 ${products.length} 个在售商品/规格，所有商品评分均达到或高于警戒阈值 ${threshold.toFixed(1)}★。系统无需列出达标商品。`}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#FF3B30]/20 bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] overflow-hidden shadow-2xs">
                  <div className="p-3 bg-[#FF3B30]/5 border-b border-[#FF3B30]/15 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FF3B30] flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {language === 'en' ? `Showing ${lowRatedProducts.length} item(s) below ${threshold.toFixed(1)}★ (Total ${products.length} scanned)` : `展示 ${lowRatedProducts.length} 个低于警戒值 (${threshold.toFixed(1)}★) 的商品（共扫描 ${products.length} 个）`}
                      </span>
                    </span>
                    <span className="text-[#8E8E93] text-[11px]">
                      {language === 'en' ? 'Ratings ≥ threshold are filtered out' : '达标商品已自动过滤，不计入低分列表'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#FAFAFC] dark:bg-[#18181A] text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                          <th className="py-3 px-3">{language === 'en' ? 'Image' : '商品图片'}</th>
                          <th className="py-3 px-4">{t.colProduct}</th>
                          <th className="py-3 px-3">{language === 'en' ? 'Price' : '价格'}</th>
                          <th className="py-3 px-3">{t.colPlatform}</th>
                          <th className="py-3 px-3">{t.colIdentifiers}</th>
                          <th className="py-3 px-3 text-right">{t.colRating}</th>
                          <th className="py-3 px-3 text-right">{t.colReviews}</th>
                          <th className="py-3 px-4">{t.colIssues}</th>
                          <th className="py-3 px-3 text-right">{t.colActions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E] text-xs">
                        {lowRatedProducts.map((item) => {
                          const idStr =
                            [
                              item.upcNumber ? `UPC: ${item.upcNumber}` : '',
                              item.modelNumber ? `Model: ${item.modelNumber}` : '',
                              item.walmartNumber ? `WM#: ${item.walmartNumber}` : '',
                              item.targetNumber ? `TCIN: ${item.targetNumber}` : '',
                              item.amazonNumber ? `ASIN: ${item.amazonNumber}` : '',
                              item.costcoNumber ? `Costco#: ${item.costcoNumber}` : ''
                            ]
                              .filter(Boolean)
                              .slice(0, 2)
                              .join(' · ') || '—';

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-[#FF3B30]/5 dark:hover:bg-[#3D1412]/30 transition-colors"
                            >
                              {/* Product Thumbnail */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-12 w-12 object-contain rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white"
                                    onError={(e) => {
                                      // Fallback on broken image
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs">
                                    MGA
                                  </div>
                                )}
                              </td>

                              {/* Product Name & Source Site */}
                              <td className="py-3 px-4 max-w-sm">
                                <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-2">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                                  Origin: {item.countryOfOrigin || 'UNKNOWN'}
                                </div>
                              </td>

                              {/* Price */}
                              <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-neutral-800 dark:text-neutral-200">
                                {item.price || '—'}
                              </td>

                              {/* Platform Badge */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                                  {item.retailer}
                                </span>
                              </td>

                              {/* Identifiers */}
                              <td className="py-3 px-3 font-mono text-[11px] text-[#8E8E93] whitespace-nowrap">
                                {idStr}
                              </td>

                              {/* Rating */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <span className="font-mono text-sm font-bold text-[#FF3B30] tabular-nums">
                                  {item.rating !== null ? item.rating.toFixed(1) : '—'}★
                                </span>
                              </td>

                              {/* Review Count */}
                              <td className="py-3 px-3 text-right font-mono text-xs text-[#8E8E93] tabular-nums whitespace-nowrap">
                                {item.reviewCount !== null ? `${item.reviewCount.toLocaleString()} ${language === 'en' ? 'reviews' : '条'}` : '—'}
                              </td>

                              {/* Issues & Breakdown */}
                              <td className="py-3 px-4 max-w-xs">
                                <div className="text-xs text-[#FF3B30] font-semibold line-clamp-1">
                                  {item.mainIssue || 'Quality Concern'}
                                </div>
                                <div className="text-[11px] text-[#8E8E93] line-clamp-1 mt-0.5">
                                  {item.issueBreakdownText || 'Flagged for quality review'}
                                </div>
                              </td>

                              {/* External Link: Open Product Page Button (Requirement 8) */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-lg transition-colors shadow-2xs cursor-pointer"
                                    title={language === 'en' ? 'Open product page in retail store' : '打开商品页面核对真实数据'}
                                  >
                                    <span>{language === 'en' ? 'Open Page' : '打开商品页面'}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subview 2: Cross Platform Summary Matrix */}
          {activeResultTab === 'matrix' && (
            <CrossPlatformMatrix
              groups={groups}
              allProducts={products}
              threshold={threshold}
              onSelectGroup={onSelectGroup}
            />
          )}

          {/* Subview 3: Complaint Analytics */}
          {activeResultTab === 'complaints' && (
            <ComplaintAnalyticsView products={products} />
          )}

          {/* Subview 4: Deep Review Insights */}
          {activeResultTab === 'deep' && (
            <DeepReviewInsightsView products={products} threshold={threshold} />
          )}

          {/* Subview 5: Trend Tracking */}
          {activeResultTab === 'trends' && (
            <TrendTrackingView
              trendDb={trendDb}
              threshold={threshold}
              onRefresh={() => {}}
              onClear={() => {}}
            />
          )}

          {/* Subview 6: SKU Validation */}
          {activeResultTab === 'sku' && (
            <SkuValidationView products={products} watchlist={watchlist} />
          )}

          {/* Subview 7: Exports Hub */}
          {activeResultTab === 'exports' && (
            <ExportsCenterView
              groups={groups}
              products={products}
              trendDb={trendDb}
              threshold={threshold}
              lastScanTime={lastScanTime}
            />
          )}
        </div>
      )}
    </div>
  );
};
