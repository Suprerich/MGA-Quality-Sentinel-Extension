import React from 'react';
import { AlertTriangle, ChevronRight, ArrowUpRight, Flame, ShieldAlert } from 'lucide-react';
import { CrossPlatformGroup, PlatformCode, Language } from '../types';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms } from '../services/summaryService';
import { getTranslation } from '../services/i18n';

interface AlertCenterProps {
  groups: CrossPlatformGroup[];
  threshold: number;
  language?: Language;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onOpenAlertsPage?: () => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  groups,
  threshold,
  language = 'en',
  onSelectGroup,
  onOpenAlertsPage
}) => {
  const t = getTranslation(language);
  const alertGroups = groups.filter((g) => belowPlatforms(g, threshold).length > 0);

  return (
    <section className="rounded-2xl border-2 border-[#FF3B30]/20 bg-[#FFFFFF] dark:border-[#FF3B30]/30 dark:bg-[#1C1C1E] shadow-sm overflow-hidden">
      {/* Alert Center Header - High Priority Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-6 py-4 bg-[#FFF2F0]/80 dark:bg-[#3D1412]/60 border-b border-[#FF3B30]/15 dark:border-[#FF3B30]/25">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF3B30] text-white shadow-2xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <span>{t.alertCenterTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FF3B30] text-white tabular-nums">
                {alertGroups.length} {t.alertCritical}
              </span>
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {t.alertCenterSubtitle} {threshold.toFixed(1)}
            </p>
          </div>
        </div>

        {onOpenAlertsPage && (
          <button
            onClick={onOpenAlertsPage}
            className="flex items-center gap-1 text-xs font-semibold text-[#FF3B30] hover:text-[#D70015] dark:text-[#FF453A] dark:hover:text-[#FF6961] transition-colors"
          >
            <span>{t.alertViewAll}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Alert Items List */}
      <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
        {alertGroups.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-xs font-semibold text-[#34C759]">
              ✓ {t.alertCompliant}
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-1">
              {t.alertNoBreaches}
            </div>
          </div>
        ) : (
          alertGroups.map((g) => {
            const breachedPlats = belowPlatforms(g, threshold);

            // Find lowest rating and platform
            let lowestRating: number | null = null;
            let lowestPlat: PlatformCode | null = null;
            PLAT_ORDER.forEach((p) => {
              const sc = g.platforms[p];
              if (sc && sc.rating !== null && (lowestRating === null || sc.rating < lowestRating)) {
                lowestRating = sc.rating;
                lowestPlat = p;
              }
            });

            return (
              <div
                key={g.id}
                onClick={() => onSelectGroup(g)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-[#F5F5F7]/80 dark:hover:bg-[#2C2C2E]/60 transition-colors cursor-pointer group"
              >
                {/* Left: Product Name & Alert Badge */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-[#FF3B30] text-base font-bold select-none mt-0.5 shrink-0">
                    ⚠
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors truncate max-w-lg">
                        {g.name}
                      </span>
                    </div>

                    {/* Affected Channels Strip */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[#8E8E93] flex-wrap">
                      <span className="font-medium text-[#FF3B30]">
                        {t.alertBelowOn}
                      </span>
                      {breachedPlats.map((p) => {
                        const sc = g.platforms[p];
                        return (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#FF3B30] bg-[#FFF2F0] dark:bg-[#3D1412] px-2 py-0.5 rounded"
                          >
                            <span>{PLAT_LABEL[p]}</span>
                            <span>{sc?.rating?.toFixed(1)}</span>
                          </span>
                        );
                      })}
                      {g.upc && <span className="font-mono text-[11px]">· UPC: {g.upc}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Score Callout & Action */}
                <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[11px] text-[#8E8E93]">{t.alertLowest}</div>
                    <div className="text-xl font-bold text-[#FF3B30] tabular-nums leading-tight">
                      {lowestRating !== null ? (lowestRating as number).toFixed(1) : '—'}
                      {lowestPlat && (
                        <span className="text-[11px] font-normal text-[#8E8E93] ml-1">
                          {t.alertOn} {PLAT_LABEL[lowestPlat]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-8 w-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
