import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { TrendDatabase } from '../types';
import { calculateTrend, exportTrendCsv } from '../services/trendService';

interface TrendTrackingSectionProps {
  trendDb: TrendDatabase;
  threshold: number;
  onRefresh: () => void;
  onClear: () => void;
}

const PLAT_DISPLAY_NAMES: Record<string, string> = {
  WMUS: 'Walmart US',
  WMCA: 'Walmart CA',
  AMZUS: 'Amazon US',
  AMZCA: 'Amazon CA',
  TARGET: 'Target',
  OTHER: 'Other'
};

export const TrendTrackingSection: React.FC<TrendTrackingSectionProps> = ({
  trendDb,
  threshold,
  onRefresh,
  onClear
}) => {
  const ids = Object.keys(trendDb);

  const handleExport = () => {
    exportTrendCsv(trendDb);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Historical Rating Trends &amp; Degradation Alerting
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Daily snapshots (one per product/channel/day). Detects downward trends (delta &le; -0.2) early so QA/QAE teams can intervene before products drop below the 4.0 threshold.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 shadow-2xs whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Trend CSV</span>
            </button>
            <button
              onClick={onRefresh}
              title="Refresh trend data"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClear}
              title="Clear all stored trend history"
              className="p-1.5 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trend Table */}
      <div className="rounded-xl border border-neutral-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/75 dark:border-neutral-800 dark:bg-neutral-800/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[240px]">Product</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Platform</th>
                <th className="py-3 px-4 min-w-[320px]">Rating Timeline (Oldest &rarr; Latest)</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Delta Trend</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Benchmark Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {ids.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                    No historical snapshots captured yet. As products are scanned, their rating trajectories will automatically record here.
                  </td>
                </tr>
              ) : (
                ids.map((id) => {
                  const entry = trendDb[id];
                  const platforms = Object.keys(entry.plats);

                  return platforms.map((plat, platIdx) => {
                    const snapshots = entry.plats[plat] || [];
                    const { delta, direction, latest } = calculateTrend(snapshots);
                    const isBelow = latest !== null && latest < threshold;

                    return (
                      <tr
                        key={`${id}-${plat}`}
                        className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        {/* Product Name (rowSpan for 1st platform) */}
                        {platIdx === 0 ? (
                          <td
                            rowSpan={platforms.length}
                            className="py-3.5 px-4 font-medium text-neutral-900 dark:text-white align-top border-r border-neutral-100 dark:border-neutral-800/60"
                          >
                            <div>{entry.name || id}</div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              ID: {id}
                            </div>
                          </td>
                        ) : null}

                        {/* Platform */}
                        <td className="py-3.5 px-3 text-center font-medium text-neutral-700 dark:text-neutral-300">
                          {PLAT_DISPLAY_NAMES[plat] || plat}
                        </td>

                        {/* Chronological points */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs tabular-nums">
                            {snapshots.map((snap, sIdx) => {
                              const isSnapBelow = snap.rating < threshold;
                              const isLast = sIdx === snapshots.length - 1;

                              return (
                                <React.Fragment key={snap.d}>
                                  <span
                                    title={`Date: ${snap.d} · Rating: ${snap.rating}${snap.count ? ` (${snap.count} reviews)` : ''}`}
                                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                                      isLast
                                        ? isSnapBelow
                                          ? 'bg-red-50 text-red-600 font-bold border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400'
                                          : 'bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-white'
                                        : isSnapBelow
                                        ? 'text-red-500'
                                        : 'text-neutral-600 dark:text-neutral-400'
                                    }`}
                                  >
                                    {snap.rating.toFixed(1)}
                                  </span>
                                  {sIdx < snapshots.length - 1 && (
                                    <span className="text-neutral-300 dark:text-neutral-600">&rarr;</span>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </td>

                        {/* Delta Trend Direction */}
                        <td className="py-3.5 px-3 text-center tabular-nums font-semibold">
                          {delta !== null ? (
                            direction === 'worsening' ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                                <TrendingDown className="h-3.5 w-3.5" />
                                <span>{delta > 0 ? `+${delta}` : delta}</span>
                              </span>
                            ) : direction === 'improving' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>+{delta}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                <Minus className="h-3 w-3" />
                                <span>{delta >= 0 ? `+${delta}` : delta}</span>
                              </span>
                            )
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        {/* Alert Status */}
                        <td className="py-3.5 px-3 text-center">
                          {isBelow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                              <AlertCircle className="h-3 w-3" />
                              <span>Below {threshold.toFixed(1)}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
