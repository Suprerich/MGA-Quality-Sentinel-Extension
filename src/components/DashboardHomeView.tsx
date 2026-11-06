import React from 'react';
import {
  Search,
  Scan,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCw,
  Plus,
  FolderOpen,
  CheckCircle,
  ShieldAlert,
  Play
} from 'lucide-react';
import { KpiOverview } from './KpiOverview';
import { AlertCenter } from './AlertCenter';
import { ExecutiveSummary } from './ExecutiveSummary';
import {
  CrossPlatformGroup,
  ProductItem,
  NavSection,
  Language,
  ProductSession,
  PlatformCode
} from '../types';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms } from '../services/summaryService';
import { getTranslation } from '../services/i18n';

interface DashboardHomeViewProps {
  currentSession: ProductSession | null;
  productHistory: ProductSession[];
  watchlistCount: number;
  threshold: number;
  language: Language;
  onThresholdChange: (newVal: number) => void;
  onNewProductSearch: () => void;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onNavigateSection: (section: NavSection) => void;
  onCopyEmailTable: () => void;
  onOpenProduct: (product: ProductSession) => void;
  onScanCurrentPage: () => void;
  isScanning: boolean;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  currentSession,
  productHistory,
  watchlistCount,
  threshold,
  language,
  onThresholdChange,
  onNewProductSearch,
  onSelectGroup,
  onNavigateSection,
  onCopyEmailTable,
  onOpenProduct,
  onScanCurrentPage,
  isScanning
}) => {
  const t = getTranslation(language);

  const completedPlats = currentSession
    ? (Object.keys(currentSession.platformResults || {}) as PlatformCode[])
    : [];
  const hasActiveSession = currentSession && completedPlats.length > 0;

  // Build a synthetic single CrossPlatformGroup for current product
  const currentGroup: CrossPlatformGroup | null = hasActiveSession
    ? {
        id: currentSession.productId,
        name: currentSession.productName,
        upc: currentSession.identifiers?.upc || '',
        model: currentSession.identifiers?.model || '',
        platforms: Object.fromEntries(
          completedPlats.map((pCode) => {
            const res = currentSession.platformResults[pCode];
            return [
              pCode,
              {
                rating: res?.rating ?? null,
                count: res?.reviewCount ?? null,
                url: res?.url || ''
              }
            ];
          })
        ),
        complaints: currentSession.complaints || [],
        _seen: {},
        _probe: {
          name: currentSession.productName,
          upcNumber: currentSession.identifiers?.upc,
          modelNumber: currentSession.identifiers?.model,
          walmartNumber: currentSession.identifiers?.walmartNumber,
          targetNumber: currentSession.identifiers?.targetNumber,
          amazonNumber: currentSession.identifiers?.amazonNumber,
          costcoNumber: currentSession.identifiers?.costcoNumber
        }
      }
    : null;

  const currentGroups: CrossPlatformGroup[] = currentGroup ? [currentGroup] : [];
  const alertGroups = currentGroups.filter((g) => belowPlatforms(g, threshold).length > 0);

  // Case A: No active product session currently loaded in workspace
  if (!hasActiveSession) {
    return (
      <div className="space-y-6">
        {/* Welcome Empty State Banner */}
        <div className="rounded-3xl border border-[#E5E5EA] bg-gradient-to-br from-white via-white to-[#007AFF]/5 p-8 dark:border-[#2C2C2E] dark:bg-gradient-to-br dark:from-[#1C1C1E] dark:to-[#007AFF]/10 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chromium MV3 Local-First Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.emptyDashboardTitle}
              </h1>
              <p className="text-sm text-[#8E8E93] leading-relaxed">
                {t.emptyDashboardDesc}
              </p>
            </div>
            <img
              src="/assets/aistudio/MGA_LOGO_6f40ad1b.png"
              alt="MGA Entertainment"
              className="h-20 sm:h-24 w-auto object-contain shrink-0 self-start sm:self-center"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                onNewProductSearch();
                onNavigateSection('search-scan');
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t.btnNewProductSearch}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onScanCurrentPage}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-xl transition-colors cursor-pointer"
            >
              <Scan className="h-4 w-4 text-[#007AFF]" />
              <span>{t.btnScanCurrent}</span>
            </button>
          </div>
        </div>

        {/* Previous Saved Products in History */}
        {productHistory.length > 0 && (
          <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#007AFF]" />
                <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t.completedHistoryTitle}
                </h2>
              </div>
              <button
                onClick={() => onNavigateSection('history')}
                className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
              >
                <span>{t.viewAll} ({productHistory.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {productHistory.slice(0, 5).map((record) => {
                const plats = Object.keys(record.platformResults || {});
                return (
                  <div
                    key={record.productId}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {record.productName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {plats.length} {language === 'en' ? 'platforms' : language === 'zh-Hant' ? '個通路' : '个平台'}
                        </span>
                        {record.summary?.lowestRating !== null && record.summary?.lowestRating !== undefined ? (
                          <span className="text-[11px] font-bold text-[#FF3B30] font-mono">
                            {t.lowestRatingLabel}: {record.summary.lowestRating}★
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#34C759]">
                            {t.statusCompliant}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] font-mono">
                        {record.updatedAt || record.startedAt} · {record.summary?.totalScanned || 0} {t.scannedItemsCount} · {record.summary?.totalLowRated || 0} {t.lowRatedItemsLabel}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenProduct(record)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-lg transition-colors cursor-pointer"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>{t.btnRestoreProduct}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case B: Real Active Product Session Exists (Requirement 8: Dashboard only displays the current product)
  const summary = currentSession.summary;

  return (
    <div className="space-y-6">
      {/* 1. Active Product Header Banner */}
      <div className="rounded-2xl border border-[#007AFF]/30 bg-gradient-to-r from-white via-white to-[#007AFF]/5 dark:border-[#007AFF]/30 dark:from-[#1C1C1E] dark:to-[#007AFF]/10 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#007AFF] text-white">
                {t.activeSessionBadge || 'Active Product'}
              </span>
              <h1 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {currentSession.productName}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E8E93] font-mono">
              {currentSession.identifiers?.upc && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  UPC: {currentSession.identifiers.upc}
                </span>
              )}
              {currentSession.identifiers?.model && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  Model: {currentSession.identifiers.model}
                </span>
              )}
              {currentSession.identifiers?.walmartNumber && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  WM#: {currentSession.identifiers.walmartNumber}
                </span>
              )}
              {currentSession.identifiers?.amazonNumber && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  ASIN: {currentSession.identifiers.amazonNumber}
                </span>
              )}
              {currentSession.identifiers?.targetNumber && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  TCIN: {currentSession.identifiers.targetNumber}
                </span>
              )}
              {currentSession.identifiers?.costcoNumber && (
                <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                  Costco#: {currentSession.identifiers.costcoNumber}
                </span>
              )}
              <span>· {currentSession.updatedAt}</span>
            </div>
          </div>

          {/* Prominent New Product Search Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNewProductSearch}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.btnNewProductSearch}</span>
            </button>

            <button
              onClick={() => onNavigateSection('search-scan')}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.scanNextChannel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Current Product KPI Overview */}
      <KpiOverview
        watchlistCount={watchlistCount}
        lowRatingCount={summary?.totalLowRated ?? 0}
        platformsCount={completedPlats.length}
        alertCount={alertGroups.length}
        threshold={threshold}
        lowestRating={summary?.lowestRating ?? null}
        totalScanned={summary?.totalScanned ?? 0}
        language={language}
        onFilterAlerts={() => onNavigateSection('search-scan')}
        onFilterLowRating={() => onNavigateSection('search-scan')}
        onOpenWatchlist={() => onNavigateSection('watchlist')}
      />

      {/* 3. Executive Quality Key Findings (Natural language synthesis for current product) */}
      <ExecutiveSummary
        groups={currentGroups}
        threshold={threshold}
        onThresholdChange={onThresholdChange}
        focusOnly={false}
        onToggleFocusOnly={() => {}}
        onCopyEmailTable={onCopyEmailTable}
        onRefresh={() => {}}
        onClear={() => {}}
        language={language}
      />

      {/* 4. Split Layout: Cross-Platform Matrix (All 7 Channels) & History Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cross Platform Matrix for Current Product */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#007AFF]" />
              <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.tabCrossPlatform} ({completedPlats.length} / {PLAT_ORDER.length} {language === 'en' ? 'Channels' : language === 'zh-Hant' ? '個通路' : '个平台'})
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('search-scan')}
              className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
            >
              <span>{t.openStudio}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Matrix Table with 7 platforms (Requirement 5 & 6) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93]">
                  <th className="py-2.5 px-3">{t.colChannel}</th>
                  <th className="py-2.5 px-3">{t.colStatus}</th>
                  <th className="py-2.5 px-3 text-right">{t.totalScannedLabel}</th>
                  <th className="py-2.5 px-3 text-right">{t.belowThresholdLabel} &lt; {threshold.toFixed(1)}</th>
                  <th className="py-2.5 px-3 text-right">{t.lowestRatingLabel}</th>
                  <th className="py-2.5 px-3 text-right">{t.queryTimeLabel}</th>
                  <th className="py-2.5 px-3 text-right">{t.actionsLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
                {PLAT_ORDER.map((pCode) => {
                  const res = currentSession.platformResults[pCode];
                  const isScanned = !!res;
                  const total = res?.totalScanned ?? (res?.products?.length ?? 0);
                  const lowCount = res?.lowRatedCount ?? (res?.lowRatedItems?.length ?? 0);
                  const lowest = res?.lowestRating ?? null;
                  const queryTime = res?.scannedAt
                    ? new Date(res.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <tr
                      key={pCode}
                      className="hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {PLAT_LABEL[pCode]}
                      </td>
                      <td className="py-3 px-3">
                        {isScanned ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {t.statusCompleted}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93]">
                            {t.statusNotScanned}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {isScanned ? (
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {total} {t.itemsWord}
                          </span>
                        ) : (
                          <span className="text-[#8E8E93]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {isScanned ? (
                          <span className={lowCount > 0 ? 'text-[#FF3B30] font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                            {lowCount} {t.itemsWord}
                          </span>
                        ) : (
                          <span className="text-[#8E8E93]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {isScanned && lowest != null ? (
                          <span className={lowest < threshold ? 'text-[#FF3B30]' : 'text-emerald-600 dark:text-emerald-400'}>
                            {lowest.toFixed(1)}★
                          </span>
                        ) : isScanned ? (
                          <span className="text-[#34C759] text-[11px] font-normal">{t.noLowRating}</span>
                        ) : (
                          <span className="text-[#8E8E93] font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] font-mono text-[#8E8E93]">
                        {queryTime || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isScanned ? (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#007AFF] hover:underline text-[11px]"
                          >
                            <span>{t.openLink}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => onNavigateSection('search-scan')}
                            className="text-[#007AFF] font-medium hover:underline text-[11px]"
                          >
                            + {t.btnSearchScan}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: History Archive (Switch to other completed products) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#007AFF]" />
                <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t.savedProductsLibrary}
                </h2>
              </div>
              <button
                onClick={() => onNavigateSection('history')}
                className="text-xs font-semibold text-[#007AFF] hover:underline"
              >
                {t.viewAll} ({productHistory.length})
              </button>
            </div>

            <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E] mt-1">
              {productHistory.slice(0, 4).map((p) => {
                const isSelected = p.productId === currentSession.productId;
                const pCount = Object.keys(p.platformResults || {}).length;

                return (
                  <div
                    key={p.productId}
                    className="py-3 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-xs text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                        {p.productName}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] font-mono">
                        {pCount} {language === 'en' ? 'platforms' : language === 'zh-Hant' ? '個通路' : '个平台'} · {p.summary?.lowestRating != null ? `${t.lowestRatingLabel}: ${p.summary.lowestRating}★` : (p.summary?.totalScanned ? `${p.summary.totalScanned} ${t.itemsWord}` : '')}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                        {t.activeBadge}
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenProduct(p)}
                        className="px-2.5 py-1 text-[11px] font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {t.restoreLink}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              onNewProductSearch();
              onNavigateSection('search-scan');
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl transition-all shadow-2xs mt-3 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.btnNewProductSearch}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
