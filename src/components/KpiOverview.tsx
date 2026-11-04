import React from 'react';
import { Bookmark, TrendingDown, Store, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';

interface KpiOverviewProps {
  watchlistCount: number;
  lowRatingCount: number;
  platformsCount: number;
  alertCount: number;
  threshold: number;
  language?: Language;
  onFilterAlerts?: () => void;
  onFilterLowRating?: () => void;
  onOpenWatchlist?: () => void;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  watchlistCount,
  lowRatingCount,
  platformsCount,
  alertCount,
  threshold,
  language = 'en',
  onFilterAlerts,
  onFilterLowRating,
  onOpenWatchlist
}) => {
  const t = getTranslation(language);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Watchlist Products */}
      <div
        onClick={onOpenWatchlist}
        className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#D1D1D6] dark:hover:border-[#3A3A3C] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors">
            {t.kpiWatchlist}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93]">
            <Bookmark className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-[32px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none">
            {watchlistCount}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiTrackedSkus}
          </span>
        </div>
      </div>

      {/* Card 2: Low Rating Products */}
      <div
        onClick={onFilterLowRating}
        className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#D1D1D6] dark:hover:border-[#3A3A3C] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors">
            {t.kpiLowRating}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#FFF2F0] dark:bg-[#3D1412] flex items-center justify-center text-[#FF3B30]">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-[32px] font-bold text-[#FF3B30] tabular-nums leading-none">
            {lowRatingCount}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiBelowThreshold} {threshold.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Card 3: Monitored Platforms */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93]">
            {t.kpiPlatforms}
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF]">
            <Store className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-[32px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none">
            {platformsCount}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiPlatformCoverage}
          </span>
        </div>
      </div>

      {/* Card 4: Active Alerts */}
      <div
        onClick={onFilterAlerts}
        className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#D1D1D6] dark:hover:border-[#3A3A3C] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-card-title text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors">
            {t.kpiAlerts}
          </span>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${alertCount > 0 ? 'bg-[#FFF2F0] text-[#FF3B30] dark:bg-[#3D1412]' : 'bg-[#EBF9F1] text-[#34C759] dark:bg-[#13381B]'}`}>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-[32px] font-bold tabular-nums leading-none ${alertCount > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {alertCount}
          </span>
          <span className="block mt-1 text-xs text-[#8E8E93]">
            {t.kpiActiveExceptions}
          </span>
        </div>
      </div>
    </div>
  );
};
