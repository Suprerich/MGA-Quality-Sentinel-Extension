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
import { PLAT_LABEL, belowPlatforms } from '../services/summaryService';
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

  // Metrics
  const alertProducts = products.filter(
    (p) => p.alertStatus === 'ALERT' || (typeof p.rating === 'number' && p.rating < threshold)
  );
  const ratedProducts = products.filter((p) => typeof p.rating === 'number');
  const avgRating =
    ratedProducts.length > 0
      ? ratedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProducts.length
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
          {/* Result Metric Banner & Action Hub */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Total Scanned */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                Total Products
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {products.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">items</span>
              </div>
            </div>

            {/* Metric 2: Alert Products Below Threshold */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider flex items-center justify-between">
                <span>Below Threshold</span>
                <span className="text-[#FF3B30] font-mono text-[10px]">&lt; {threshold.toFixed(1)}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    alertProducts.length > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                  }`}
                >
                  {alertProducts.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">breached</span>
              </div>
            </div>

            {/* Metric 3: Average Star Rating */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                Average Rating
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {avgRating !== null ? avgRating.toFixed(2) : '—'}
                </span>
                <div className="flex text-[#FF9500] text-xs">
                  {'★'.repeat(Math.round(avgRating || 0))}
                </div>
              </div>
            </div>

            {/* Metric 4: Customer Complaints Analyzed */}
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
              <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                Customer Reviews
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {complaints.length}
                </span>
                <span className="text-[11px] text-[#8E8E93]">analyzed</span>
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
              {alertProducts.length > 0 && (
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
                  <span>{t.btnDeepAnalyzeAll} ({alertProducts.length})</span>
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
              { id: 'overview', label: t.tabOverview, count: products.length },
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
                        ? 'bg-[#007AFF]/10 text-[#007AFF]'
                        : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Subview 1: Products Overview List */}
          {activeResultTab === 'overview' && (
            <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#FAFAFC] dark:bg-[#18181A] text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                      <th className="py-3 px-4">{t.colProduct}</th>
                      <th className="py-3 px-3">{t.colPlatform}</th>
                      <th className="py-3 px-3">{t.colIdentifiers}</th>
                      <th className="py-3 px-3 text-right">{t.colRating}</th>
                      <th className="py-3 px-3 text-right">{t.colReviews}</th>
                      <th className="py-3 px-3 text-center">{t.colAlertStatus}</th>
                      <th className="py-3 px-4">{t.colIssues}</th>
                      <th className="py-3 px-3 text-right">{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E] text-xs">
                    {products.map((item) => {
                      const isAlert =
                        item.alertStatus === 'ALERT' ||
                        (typeof item.rating === 'number' && item.rating < threshold);
                      const idStr =
                        [
                          item.upcNumber ? `UPC: ${item.upcNumber}` : '',
                          item.modelNumber ? `Model: ${item.modelNumber}` : '',
                          item.walmartNumber ? `WM#: ${item.walmartNumber}` : '',
                          item.targetNumber ? `TCIN: ${item.targetNumber}` : '',
                          item.amazonNumber ? `ASIN: ${item.amazonNumber}` : ''
                        ]
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(' · ') || '—';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/40 transition-colors"
                        >
                          {/* Product Name & Source Site */}
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-2">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#8E8E93] mt-0.5">
                              Origin: {item.countryOfOrigin || 'UNKNOWN'}
                            </div>
                          </td>

                          {/* Platform Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {item.retailer}
                            </span>
                          </td>

                          {/* Identifiers */}
                          <td className="py-3 px-3 font-mono text-[11px] text-[#8E8E93] whitespace-nowrap">
                            {idStr}
                          </td>

                          {/* Rating */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-mono text-sm font-bold tabular-nums ${
                                isAlert
                                  ? 'text-[#FF3B30]'
                                  : typeof item.rating === 'number'
                                  ? 'text-[#34C759]'
                                  : 'text-[#8E8E93]'
                              }`}
                            >
                              {item.rating !== null ? item.rating.toFixed(1) : '—'}
                            </span>
                          </td>

                          {/* Review Count */}
                          <td className="py-3 px-3 text-right font-mono text-xs text-[#8E8E93] tabular-nums whitespace-nowrap">
                            {item.reviewCount !== null ? item.reviewCount.toLocaleString() : '—'}
                          </td>

                          {/* Alert Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 ${
                                isAlert
                                  ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                                  : 'bg-[#34C759]/10 text-[#34C759]'
                              }`}
                            >
                              {isAlert ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                              <span>{isAlert ? t.statusAlert : t.statusPass}</span>
                            </span>
                          </td>

                          {/* Issues & Breakdown */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-medium line-clamp-1">
                              {item.mainIssue || 'N/A'}
                            </div>
                            <div className="text-[11px] text-[#8E8E93] line-clamp-1 mt-0.5">
                              {item.issueBreakdownText || 'No recurring issues logged'}
                            </div>
                          </td>

                          {/* External Link */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#007AFF] hover:underline"
                              >
                                <span>Link</span>
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
