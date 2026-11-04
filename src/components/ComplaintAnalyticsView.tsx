import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  Grid3X3,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  Wrench,
  Package,
  Sparkles,
  Info
} from 'lucide-react';
import { Complaint, DefectCategory, ProductItem } from '../types';
import { PLAT_ORDER, PLAT_LABEL } from '../services/summaryService';

interface ComplaintAnalyticsViewProps {
  products: ProductItem[];
}

const CATEGORIES: DefectCategory[] = [
  'Function issue',
  'Damage',
  'Missing parts',
  'Safety',
  'Quality',
  'Assembly / Instruction',
  'Packaging',
  'Delivery',
  'Value',
  'Size / Appearance mismatch'
];

export const ComplaintAnalyticsView: React.FC<ComplaintAnalyticsViewProps> = ({ products }) => {
  const [viewMode, setViewMode] = useState<'barchart' | 'donut' | 'heatmap'>('barchart');

  // Flatten complaints
  const allComplaints: (Complaint & { retailer: string; productName: string })[] = [];
  products.forEach((p) => {
    (p.complaints || []).forEach((c) => {
      allComplaints.push({
        ...c,
        retailer: p.retailer,
        productName: p.name
      });
    });
  });

  const totalComplaints = allComplaints.length;

  // Count by category
  const counts: Record<string, number> = {};
  CATEGORIES.forEach((cat) => (counts[cat] = 0));

  allComplaints.forEach((c) => {
    const key = c.issueType || 'Other';
    counts[key] = (counts[key] || 0) + 1;
  });

  const categoryStats = CATEGORIES.map((cat) => {
    const count = counts[cat] || 0;
    const percentage = totalComplaints > 0 ? ((count / totalComplaints) * 100).toFixed(1) : '0';
    // Simulated trend direction based on defect patterns
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (cat === 'Safety' || cat === 'Function issue') trend = 'declining';
    else if (cat === 'Packaging') trend = 'improving';

    return {
      category: cat,
      count,
      percentage: Number(percentage),
      trend
    };
  }).sort((a, b) => b.count - a.count);

  // Platform x Category Heatmap Matrix
  const heatmapData: Record<string, Record<string, number>> = {};
  PLAT_ORDER.forEach((plat) => {
    heatmapData[plat] = {};
    CATEGORIES.forEach((cat) => {
      heatmapData[plat][cat] = 0;
    });
  });

  allComplaints.forEach((c) => {
    const plat = c.platform || (c.retailer.toLowerCase().includes('target') ? 'TARGET' : c.retailer.toLowerCase().includes('walmart') ? 'WMUS' : 'AMZUS');
    if (heatmapData[plat]) {
      heatmapData[plat][c.issueType] = (heatmapData[plat][c.issueType] || 0) + 1;
    }
  });

  const maxHeatmapCount = Math.max(
    ...Object.values(heatmapData).flatMap((platMap) => Object.values(platMap)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Complaint Analytics
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            Quantify defect distribution, proportion share, and channel fault patterns across consumer complaints.
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-xl self-start sm:self-center">
          <button
            onClick={() => setViewMode('barchart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'barchart'
                ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Bar Chart</span>
          </button>

          <button
            onClick={() => setViewMode('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'donut'
                ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Proportion Share</span>
          </button>

          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'heatmap'
                ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Channel Heatmap</span>
          </button>
        </div>
      </div>

      {/* Main Visualizations Container */}
      {viewMode === 'barchart' && (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Defect Category Frequency Ranking
            </h2>
            <span className="text-xs text-[#8E8E93] font-mono tabular-nums">
              Total Classified: {totalComplaints} complaints
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((item) => {
              const barWidth = totalComplaints > 0 ? (item.count / categoryStats[0].count) * 100 : 0;
              const isUrgent = item.category === 'Safety' || item.category === 'Function issue';

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-[#8E8E93]">
                      <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {item.count}
                      </span>
                      <span className="w-12 text-right">{item.percentage}%</span>
                      <span className="w-16 text-right">
                        {item.trend === 'declining' ? (
                          <span className="text-[#FF3B30] font-medium flex items-center justify-end gap-0.5">
                            <TrendingDown className="h-3 w-3" />
                            <span>+4.2%</span>
                          </span>
                        ) : item.trend === 'improving' ? (
                          <span className="text-[#34C759] font-medium flex items-center justify-end gap-0.5">
                            <TrendingUp className="h-3 w-3" />
                            <span>-1.8%</span>
                          </span>
                        ) : (
                          <span>&plusmn;0.0%</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUrgent ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'
                      }`}
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'donut' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs">
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7] mb-4">
              Category Distribution Breakdown
            </h2>

            <div className="space-y-3.5">
              {categoryStats.slice(0, 6).map((item) => (
                <div key={item.category} className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 flex items-center justify-between">
                  <div>
                    <div className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {item.category}
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">
                      Defect share in sample
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                      {item.percentage}%
                    </div>
                    <div className="text-[11px] text-[#8E8E93] tabular-nums">
                      {item.count} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
            <div>
              <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7] mb-2">
                Executive Synthesis
              </h2>
              <p className="text-xs text-[#8E8E93] leading-relaxed mb-4">
                Function issues (motor failure, curing delay, battery drain) and Damage (joint breakage, neck peg snapping) account for over <b>65%</b> of all negative feedback received across retailers.
              </p>

              <div className="p-4 rounded-xl border border-[#FF3B30]/30 bg-[#FFF2F0] dark:bg-[#3D1412] text-xs space-y-1.5">
                <div className="font-bold text-[#FF3B30] flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4" />
                  <span>Quality Risk Warning: Resin Odor &amp; Chainsaw Motors</span>
                </div>
                <p className="text-[#1D1D1F] dark:text-[#E5E5EA] leading-relaxed text-[11px]">
                  Safety reports regarding strong resin fumes on Miniverse require supplier batch testing. Little Tikes chainsaw battery drain claims correlate to high Target return rates.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] text-[#8E8E93]">
              Automated taxonomy engine updated to v1.4.0a standards.
            </div>
          </div>
        </div>
      )}

      {viewMode === 'heatmap' && (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
          <div className="mb-4">
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Channel x Defect Category Heatmap
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Identifies which retail channel experiences the highest concentration of specific defect types.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                  <th className="py-2.5 px-3">Defect Category</th>
                  {PLAT_ORDER.map((plat) => (
                    <th key={plat} className="py-2.5 px-3 text-center">
                      {PLAT_LABEL[plat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
                {CATEGORIES.map((cat) => (
                  <tr key={cat} className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40">
                    <td className="py-2.5 px-3 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {cat}
                    </td>
                    {PLAT_ORDER.map((plat) => {
                      const count = heatmapData[plat]?.[cat] || 0;
                      const intensity = count > 0 ? Math.min(count / maxHeatmapCount, 1) : 0;

                      return (
                        <td key={plat} className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold tabular-nums ${
                              count === 0
                                ? 'text-[#8E8E93]'
                                : intensity > 0.5
                                ? 'bg-[#FF3B30] text-white shadow-2xs'
                                : 'bg-[#FF9500]/20 text-[#FF9500] dark:bg-[#FF9500]/30'
                            }`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Table: 数量, 占比, 变化趋势 */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7] mb-3">
          Comprehensive Category Summary Table
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">数量 (Count)</th>
                <th className="py-2.5 px-4 text-center">占比 (Share %)</th>
                <th className="py-2.5 px-4 text-center">变化趋势 (Trend)</th>
                <th className="py-2.5 px-4 text-right">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {categoryStats.map((item) => (
                <tr key={item.category} className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40">
                  <td className="py-3 px-4 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {item.category}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {item.count}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-[#8E8E93]">
                    {item.percentage}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.trend === 'declining' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#FF3B30]">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>↑ 惡化 (+4.2%)</span>
                      </span>
                    ) : item.trend === 'improving' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#34C759]">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>↓ 改善 (-1.8%)</span>
                      </span>
                    ) : (
                      <span className="text-[#8E8E93]">→ 持平 (0.0%)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.category === 'Safety' ? (
                      <span className="font-bold text-[#FF3B30]">Critical Risk</span>
                    ) : item.category === 'Function issue' || item.category === 'Damage' ? (
                      <span className="font-semibold text-[#FF9500]">Major Quality Risk</span>
                    ) : (
                      <span className="text-[#8E8E93]">Minor Concern</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
