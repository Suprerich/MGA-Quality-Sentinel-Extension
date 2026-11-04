import React from 'react';
import { AlertTriangle, TrendingDown, Wrench, Store } from 'lucide-react';
import { CrossPlatformGroup, ProductItem, TrendDatabase } from '../types';
import { belowPlatforms } from '../services/summaryService';
import { calculateTrend } from '../services/trendService';

interface KpiMetricsProps {
  groups: CrossPlatformGroup[];
  products: ProductItem[];
  trendDb: TrendDatabase;
  threshold: number;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  groups,
  products,
  trendDb,
  threshold
}) => {
  // 1. Alert Products
  const alertGroups = groups.filter((g) => belowPlatforms(g, threshold).length > 0);

  // 2. Worsening Products
  let worseningCount = 0;
  Object.keys(trendDb).forEach((id) => {
    const entry = trendDb[id];
    let hasWorsening = false;
    Object.keys(entry.plats).forEach((p) => {
      const snap = entry.plats[p];
      const { direction } = calculateTrend(snap);
      if (direction === 'worsening') hasWorsening = true;
    });
    if (hasWorsening) worseningCount++;
  });

  // 3. Top defect category
  const defectCounts: Record<string, number> = {};
  let totalComplaints = 0;
  products.forEach((p) => {
    (p.complaints || []).forEach((c) => {
      defectCounts[c.issueType] = (defectCounts[c.issueType] || 0) + 1;
      totalComplaints++;
    });
  });

  const sortedDefects = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]);
  const topDefectName = sortedDefects.length ? sortedDefects[0][0] : 'Function issue';
  const topDefectCount = sortedDefects.length ? sortedDefects[0][1] : 0;
  const topDefectPercent = totalComplaints > 0 ? Math.round((topDefectCount / totalComplaints) * 100) : 0;

  // 4. Total Retailer Listings
  const totalListings = products.length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Products Below Alert Threshold */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-4.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Below 4.0 Benchmark
          </span>
          <span className={`p-1.5 rounded-md ${alertGroups.length > 0 ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
            <AlertTriangle className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {alertGroups.length}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            of {groups.length} tracked items
          </span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          {alertGroups.length > 0
            ? 'Immediate QA review required across retail listings'
            : 'All monitored products meet target rating threshold'}
        </div>
      </div>

      {/* KPI 2: Worsening Rating Trends */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-4.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Worsening Rating Curves
          </span>
          <span className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <TrendingDown className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {worseningCount}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            items declining (delta &le; -0.2)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Proactive signal: Catch degradation before ratings breach 4.0
        </div>
      </div>

      {/* KPI 3: Dominant Defect Vector */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-4.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Primary Quality Driver
          </span>
          <span className="p-1.5 rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Wrench className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate max-w-[170px]" title={topDefectName}>
            {topDefectName}
          </span>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums">
            {topDefectPercent}%
          </span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          {topDefectCount} classified complaints in latest batch
        </div>
      </div>

      {/* KPI 4: Multi-Channel Coverage */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-4.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Monitored Listings
          </span>
          <span className="p-1.5 rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Store className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {totalListings}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            across 5 retail channels
          </span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Walmart US/CA · Amazon US/CA · Target
        </div>
      </div>
    </div>
  );
};
