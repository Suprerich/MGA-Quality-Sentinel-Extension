import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Download,
  Calendar,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  AlertCircle
} from 'lucide-react';
import { ProductTrendEntry, TrendDatabase } from '../types';
import { calculateTrend, exportTrendCsv } from '../services/trendService';

interface TrendTrackingViewProps {
  trendDb: TrendDatabase;
  threshold: number;
  onRefresh: () => void;
  onClear: () => void;
}

export const TrendTrackingView: React.FC<TrendTrackingViewProps> = ({
  trendDb,
  threshold,
  onRefresh,
  onClear
}) => {
  const [timeWindow, setTimeWindow] = useState<'30d' | '90d'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendFilter, setTrendFilter] = useState<'all' | 'declining' | 'improving' | 'stable'>('all');

  const ids = Object.keys(trendDb);

  // Flatten entries by product and platform
  interface TrendFlatRow {
    id: string;
    productName: string;
    platform: string;
    snapshots: { d: string; rating: number; count?: number | null }[];
    delta: number | null;
    direction: 'improving' | 'declining' | 'stable' | 'unknown';
    first: number | null;
    latest: number | null;
    reviewGrowth: number;
  }

  const rows: TrendFlatRow[] = [];
  ids.forEach((id) => {
    const entry = trendDb[id];
    Object.keys(entry.plats).forEach((plat) => {
      const allSnaps = entry.plats[plat] || [];
      // Slice for 30d (approx 10 points) or 90d (up to 24 points)
      const snaps = timeWindow === '30d' ? allSnaps.slice(-10) : allSnaps.slice(-24);
      const { delta, direction, first, latest } = calculateTrend(snaps);
      const mappedDirection: 'improving' | 'declining' | 'stable' | 'unknown' =
        direction === 'worsening' ? 'declining' : direction;

      // Calculate review growth
      let reviewGrowth = 0;
      if (snaps.length > 1) {
        const startCount = snaps[0].count || 0;
        const endCount = snaps[snaps.length - 1].count || 0;
        reviewGrowth = endCount - startCount;
      }

      rows.push({
        id,
        productName: entry.name || id,
        platform: plat,
        snapshots: snaps,
        delta,
        direction: mappedDirection,
        first,
        latest,
        reviewGrowth
      });
    });
  });

  const filtered = rows.filter((r) => {
    if (trendFilter !== 'all' && r.direction !== trendFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.productName.toLowerCase().includes(q) && !r.platform.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const decliningCount = rows.filter((r) => r.direction === 'declining').length;
  const improvingCount = rows.filter((r) => r.direction === 'improving').length;
  const stableCount = rows.filter((r) => r.direction === 'stable').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Trend Tracking
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            Detect rating velocity, customer sentiment degradation, and review momentum across 30-day and 90-day inspection windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Window Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-xl">
            <button
              onClick={() => setTimeWindow('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeWindow === '30d'
                  ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                  : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              30 Day Trend
            </button>
            <button
              onClick={() => setTimeWindow('90d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeWindow === '90d'
                  ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                  : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              90 Day Trend
            </button>
          </div>

          <button
            onClick={() => exportTrendCsv(trendDb)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5EA] hover:bg-[#F2F2F7] dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:text-[#F5F5F7] rounded-xl transition-colors whitespace-nowrap shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Quick Trend Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setTrendFilter(trendFilter === 'declining' ? 'all' : 'declining')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            trendFilter === 'declining'
              ? 'border-[#FF3B30] bg-[#FFF2F0]/80 dark:bg-[#3D1412]'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#FF3B30]">
            <span className="text-xs font-semibold">↓ Declining (Worsening)</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="mt-2 text-[28px] font-bold text-[#FF3B30] tabular-nums leading-none">
            {decliningCount}
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-1">
            Ratings dropped by &ge; 0.2 points
          </div>
        </button>

        <button
          onClick={() => setTrendFilter(trendFilter === 'improving' ? 'all' : 'improving')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            trendFilter === 'improving'
              ? 'border-[#34C759] bg-[#EBF9F1] dark:bg-[#13381B]'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#34C759]">
            <span className="text-xs font-semibold">↑ Improving (Gaining)</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-2 text-[28px] font-bold text-[#34C759] tabular-nums leading-none">
            {improvingCount}
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-1">
            Ratings increased by &ge; 0.2 points
          </div>
        </button>

        <button
          onClick={() => setTrendFilter(trendFilter === 'stable' ? 'all' : 'stable')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            trendFilter === 'stable'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-semibold">→ Stable (Holding)</span>
            <Minus className="h-4 w-4" />
          </div>
          <div className="mt-2 text-[28px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none">
            {stableCount}
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-1">
            Ratings within &plusmn; 0.1 range
          </div>
        </button>
      </div>

      {/* Main Trend Data Table */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search product trend by name or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div className="text-xs text-[#8E8E93] font-mono tabular-nums">
            Showing {filtered.length} of {rows.length} product trajectories ({timeWindow.toUpperCase()})
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                <th className="py-3 px-4 min-w-[240px]">Product</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Platform</th>
                <th className="py-3 px-4 min-w-[320px]">Rating Progression ({timeWindow.toUpperCase()})</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Movement</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Review Growth</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8E8E93]">
                    No trend records matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const isBelow = r.latest !== null && r.latest < threshold;

                  return (
                    <tr key={idx} className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {r.productName}
                      </td>

                      <td className="py-3.5 px-3 text-center font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                        {r.platform}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs tabular-nums">
                          {r.snapshots.map((snap, sIdx) => {
                            const isSnapBelow = snap.rating < threshold;
                            const isLast = sIdx === r.snapshots.length - 1;

                            return (
                              <React.Fragment key={sIdx}>
                                <span
                                  title={`Date: ${snap.d} · Score: ${snap.rating}`}
                                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                                    isLast
                                      ? isSnapBelow
                                        ? 'bg-[#FFF2F0] text-[#FF3B30] font-bold border border-[#FF3B30]/30 dark:bg-[#3D1412]'
                                        : 'bg-[#F2F2F7] text-[#1D1D1F] font-bold dark:bg-[#2C2C2E] dark:text-white'
                                      : isSnapBelow
                                      ? 'text-[#FF3B30]'
                                      : 'text-[#8E8E93]'
                                  }`}
                                >
                                  {snap.rating.toFixed(1)}
                                </span>
                                {sIdx < r.snapshots.length - 1 && (
                                  <span className="text-[#C7C7CC] dark:text-[#48484A]">&rarr;</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center tabular-nums font-semibold">
                        {r.direction === 'declining' ? (
                          <span className="inline-flex items-center gap-1 text-[#FF3B30] font-bold">
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span>{r.delta} (↓ Declining)</span>
                          </span>
                        ) : r.direction === 'improving' ? (
                          <span className="inline-flex items-center gap-1 text-[#34C759] font-bold">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>+{r.delta} (↑ Improving)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#8E8E93]">
                            <Minus className="h-3 w-3" />
                            <span>{r.delta && r.delta > 0 ? `+${r.delta}` : r.delta || 0} (→ Stable)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-xs">
                        {r.reviewGrowth > 0 ? (
                          <span className="text-[#007AFF] font-medium">+{r.reviewGrowth} reviews</span>
                        ) : (
                          <span className="text-[#8E8E93]">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {isBelow ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF2F0] text-[#FF3B30] dark:bg-[#3D1412]">
                            &lt; {threshold.toFixed(1)} Alert
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium text-[#34C759] bg-[#EBF9F1] dark:bg-[#13381B]">
                            Compliant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
