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
  RotateCw
} from 'lucide-react';
import { KpiOverview } from './KpiOverview';
import { AlertCenter } from './AlertCenter';
import { ExecutiveSummary } from './ExecutiveSummary';
import {
  CrossPlatformGroup,
  ProductItem,
  TrendDatabase,
  NavSection,
  Language,
  SearchHistoryRecord
} from '../types';
import { PLAT_ORDER, belowPlatforms } from '../services/summaryService';
import { getTranslation } from '../services/i18n';

interface DashboardHomeViewProps {
  groups: CrossPlatformGroup[];
  products: ProductItem[];
  trendDb: TrendDatabase;
  watchlistCount: number;
  threshold: number;
  searchHistory: SearchHistoryRecord[];
  language: Language;
  onThresholdChange: (newVal: number) => void;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onNavigateSection: (section: NavSection) => void;
  onCopyEmailTable: () => void;
  onOpenHistoryRecord: (record: SearchHistoryRecord) => void;
  onScanCurrentPage: () => void;
  isScanning: boolean;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  groups,
  products,
  trendDb,
  watchlistCount,
  threshold,
  searchHistory,
  language,
  onThresholdChange,
  onSelectGroup,
  onNavigateSection,
  onCopyEmailTable,
  onOpenHistoryRecord,
  onScanCurrentPage,
  isScanning
}) => {
  const t = getTranslation(language);
  const alertGroups = groups.filter((g) => belowPlatforms(g, threshold).length > 0);
  const lowRatingCount = products.filter((p) => p.rating !== null && p.rating < threshold).length;

  // Case A: First time user or no data loaded yet (Requirement 4 & 14)
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        {/* Welcome Empty State Banner */}
        <div className="rounded-3xl border border-[#E5E5EA] bg-gradient-to-br from-white via-white to-[#007AFF]/5 p-8 dark:border-[#2C2C2E] dark:bg-gradient-to-br dark:from-[#1C1C1E] dark:to-[#007AFF]/10 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chromium MV3 Extension</span>
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
              onClick={() => onNavigateSection('search-scan')}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>{t.btnGoToSearchScan}</span>
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

        {/* Previous Search Records (if any exist in local storage) */}
        {searchHistory.length > 0 && (
          <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#007AFF]" />
                <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t.historyTitle}
                </h2>
              </div>
              <button
                onClick={() => onNavigateSection('history')}
                className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
              >
                <span>View All ({searchHistory.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {searchHistory.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/40 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {record.keyword}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {record.platform}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93] font-mono">
                      {record.queryTime} · {record.itemsCount} products {record.alertCount > 0 ? `· ${record.alertCount} alert(s)` : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenHistoryRecord(record)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{t.btnOpenResult}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case B: Real Scan Results Exist (Requirement 4)
  return (
    <div className="space-y-6">
      {/* 1. KPI Overview (Reflects real scan results) */}
      <KpiOverview
        watchlistCount={watchlistCount}
        lowRatingCount={lowRatingCount}
        platformsCount={PLAT_ORDER.length}
        alertCount={alertGroups.length}
        threshold={threshold}
        language={language}
        onFilterAlerts={() => onNavigateSection('search-scan')}
        onFilterLowRating={() => onNavigateSection('search-scan')}
        onOpenWatchlist={() => onNavigateSection('watchlist')}
      />

      {/* 2. Alert Center (High-priority alert list) */}
      <AlertCenter
        groups={groups}
        threshold={threshold}
        language={language}
        onSelectGroup={onSelectGroup}
        onOpenAlertsPage={() => onNavigateSection('search-scan')}
      />

      {/* 3. Executive Quality Key Findings (Natural language synthesis) */}
      <ExecutiveSummary
        groups={groups}
        threshold={threshold}
        onThresholdChange={onThresholdChange}
        focusOnly={false}
        onToggleFocusOnly={() => {}}
        onCopyEmailTable={onCopyEmailTable}
        onRefresh={() => {}}
        onClear={() => {}}
      />

      {/* 4. Split Layout: Cross-Platform Health Matrix & Recent Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cross Platform Matrix Preview */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#007AFF]" />
              <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.tabCrossPlatform}
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('search-scan')}
              className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
            >
              <span>{t.colDetails}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                  <th className="py-2.5 px-3">Product</th>
                  {PLAT_ORDER.map((plat) => (
                    <th key={plat} className="py-2.5 px-2 text-center whitespace-nowrap">
                      {PLAT_LABEL[plat]}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
                {groups.slice(0, 6).map((g) => {
                  const breached = belowPlatforms(g, threshold);
                  const isAlert = breached.length > 0;

                  return (
                    <tr
                      key={g.id}
                      onClick={() => onSelectGroup(g)}
                      className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate max-w-[200px]">
                        {g.name}
                      </td>

                      {PLAT_ORDER.map((plat) => {
                        const sc = g.platforms[plat];
                        if (!sc || sc.rating === null) {
                          return (
                            <td
                              key={plat}
                              className="py-3 px-2 text-center text-[#C7C7CC] dark:text-[#48484A]"
                            >
                              —
                            </td>
                          );
                        }
                        const isLow = sc.rating < threshold;
                        return (
                          <td
                            key={plat}
                            className={`py-3 px-2 text-center font-mono tabular-nums ${
                              isLow
                                ? 'text-[#FF3B30] font-bold bg-[#FFF2F0]/60 dark:bg-[#3D1412]/40'
                                : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                            }`}
                          >
                            {sc.rating.toFixed(1)}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right">
                        {isAlert ? (
                          <span className="text-[11px] font-bold text-[#FF3B30]">
                            {breached.length} Alert
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#34C759]">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Personal Search History Quick Widget */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#007AFF]" />
              <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.historyTitle}
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('history')}
              className="text-xs font-semibold text-[#007AFF] hover:underline"
            >
              All ({searchHistory.length})
            </button>
          </div>

          <div className="space-y-2">
            {searchHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8E8E93]">
                {t.emptyHistoryTitle}
              </div>
            ) : (
              searchHistory.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onOpenHistoryRecord(rec)}
                  className="p-3 rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {rec.keyword}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2F2F7] dark:bg-[#2C2C2E] font-medium text-[#8E8E93]">
                      {rec.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-mono">
                    <span>{rec.itemsCount} products</span>
                    <span>{rec.queryTime.split(' ')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
