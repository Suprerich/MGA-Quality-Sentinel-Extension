import React from 'react';
import { Bookmark, TrendingDown, Store, AlertTriangle, ShieldCheck, Star, Layers, Search } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';

interface KpiOverviewProps {
  watchlistCount?: number;
  lowRatingCount: number;
  platformsCount: number;
  alertCount?: number;
  threshold: number;
  lowestRating?: number | null;
  totalScanned?: number;
  language?: Language;
  onFilterAlerts?: () => void;
  onFilterLowRating?: () => void;
  onOpenWatchlist?: () => void;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  watchlistCount = 0,
  lowRatingCount,
  platformsCount,
  alertCount = 0,
  threshold,
  lowestRating = null,
  totalScanned = 0,
  language = 'en',
  onFilterAlerts,
  onFilterLowRating,
  onOpenWatchlist
}) => {
  const t = getTranslation(language);

  const hasLowRated = lowestRating !== null && typeof lowestRating === 'number' && !isNaN(lowestRating);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Lowest Rating (Requirement 7) */}
      <div
        onClick={onFilterLowRating}
        className={`rounded-2xl border bg-[#FFFFFF] p-5 dark:bg-[#1C1C1E] shadow-2xs transition-all cursor-pointer group ${
          hasLowRated
            ? 'border-[#FF3B30]/30 hover:border-[#FF3B30]/60'
            : 'border-[#E5E5EA] dark:border-[#2C2C2E] hover:border-[#34C759]/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors font-medium">
            {t.lowestRatingLabel}
          </span>
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              hasLowRated
                ? 'bg-[#FFF2F0] dark:bg-[#3D1412] text-[#FF3B30]'
                : 'bg-[#EBF9F1] dark:bg-[#13381B] text-[#34C759]'
            }`}
          >
            {hasLowRated ? <Star className="h-3.5 w-3.5 fill-current" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          </div>
        </div>
        <div className="mt-3">
          {hasLowRated ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-[#FF3B30] tabular-nums leading-none font-mono">
                  {lowestRating.toFixed(1)}★
                </span>
              </div>
              <span className="block mt-1 text-xs text-[#8E8E93] truncate">
                {language === 'en'
                  ? `Below alert threshold (${threshold.toFixed(1)})`
                  : language === 'zh-Hant'
                  ? `全通路低於警戒值 (${threshold.toFixed(1)}) 最低分`
                  : `全网低于警戒值 (${threshold.toFixed(1)}) 最低分`}
              </span>
            </>
          ) : (
            <>
              <div className="text-base font-bold text-[#34C759] leading-snug">
                {t.noLowRatedFound}
              </div>
              <span className="block mt-1 text-xs text-[#8E8E93]">
                {language === 'en'
                  ? `All items maintain ≥ ${threshold.toFixed(1)}★`
                  : language === 'zh-Hant'
                  ? `已掃描商品評分均 ≥ ${threshold.toFixed(1)}★`
                  : `已扫描商品评分均 ≥ ${threshold.toFixed(1)}★`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Card 2: Low-Rated Items Count */}
      <div
        onClick={onFilterLowRating}
        className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#D1D1D6] dark:hover:border-[#3A3A3C] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors font-medium">
            {t.kpiLowRating}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#FFF2F0] dark:bg-[#3D1412] flex items-center justify-center text-[#FF3B30]">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-[32px] font-bold tabular-nums leading-none font-mono ${lowRatingCount > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {lowRatingCount}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiBelowThreshold} {threshold.toFixed(1)} ({language === 'en' ? 'strictly lower' : language === 'zh-Hant' ? '嚴格低於' : '严格低于'})
          </span>
        </div>
      </div>

      {/* Card 3: Total Products Scanned */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] font-medium">
            {t.kpiTotalScanned}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF]">
            <Search className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-[32px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none font-mono">
            {totalScanned}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiTotalScannedSubtitle}
          </span>
        </div>
      </div>

      {/* Card 4: Monitored Platforms Coverage */}
      <div
        onClick={onFilterAlerts}
        className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#D1D1D6] dark:hover:border-[#3A3A3C] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors font-medium">
            {t.kpiPlatforms}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF]">
            <Layers className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-[32px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none font-mono">
            {platformsCount} <span className="text-sm font-normal text-[#8E8E93]">/ 7</span>
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiPlatformCoverage}
          </span>
        </div>
      </div>
    </div>
  );
};
