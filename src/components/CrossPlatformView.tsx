import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Mail,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { CrossPlatformGroup, PlatformCode, ProductItem } from '../types';
import {
  PLAT_ORDER,
  PLAT_LABEL,
  belowPlatforms,
  buildComplaintPhrase,
  getQualityNegativeComplaints
} from '../services/summaryService';
import { exportProductsCsv } from '../services/exportService';

interface CrossPlatformViewProps {
  groups: CrossPlatformGroup[];
  allProducts: ProductItem[];
  threshold: number;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onCopyEmailTable: () => void;
}

export const CrossPlatformView: React.FC<CrossPlatformViewProps> = ({
  groups,
  allProducts,
  threshold,
  onSelectGroup,
  onCopyEmailTable
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'alert' | 'ok'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'avgRating' | 'reviewCount' | 'alertCount'>('alertCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute aggregate stats per group
  interface EnrichedGroup extends CrossPlatformGroup {
    averageRating: number | null;
    totalReviewCount: number;
    breachedCount: number;
    complaintBreakdown: string;
    keyFindingText: string;
  }

  const enriched: EnrichedGroup[] = groups.map((g) => {
    let sumRating = 0;
    let ratingCount = 0;
    let totalReviews = 0;

    PLAT_ORDER.forEach((plat) => {
      const sc = g.platforms[plat];
      if (sc && sc.rating !== null) {
        sumRating += sc.rating;
        ratingCount++;
      }
      if (sc && sc.count) {
        totalReviews += sc.count;
      }
    });

    const averageRating = ratingCount > 0 ? Number((sumRating / ratingCount).toFixed(2)) : null;
    const breached = belowPlatforms(g, threshold);

    // Complaint breakdown summary
    const defectMap: Record<string, number> = {};
    (g.complaints || []).forEach((c) => {
      defectMap[c.issueType] = (defectMap[c.issueType] || 0) + 1;
    });
    const breakdown = Object.entries(defectMap)
      .slice(0, 3)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');

    // Key Finding text
    const qNeg = getQualityNegativeComplaints(g);
    const phrase = buildComplaintPhrase(qNeg);
    let keyFindingText = '';
    if (breached.length > 0) {
      keyFindingText = `Below ${threshold.toFixed(1)} on ${breached.map((p) => PLAT_LABEL[p]).join(', ')}. ${phrase ? `Mainly: ${phrase}` : ''}`;
    } else {
      keyFindingText = `All ${ratingCount} retail channels compliant (&ge; ${threshold.toFixed(1)}).`;
    }

    return {
      ...g,
      averageRating,
      totalReviewCount: totalReviews,
      breachedCount: breached.length,
      complaintBreakdown: breakdown || 'No active defects',
      keyFindingText
    };
  });

  // Filter
  const filtered = enriched.filter((g) => {
    if (filterMode === 'alert' && g.breachedCount === 0) return false;
    if (filterMode === 'ok' && g.breachedCount > 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.upc.toLowerCase().includes(q) ||
        g.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'name') diff = a.name.localeCompare(b.name);
    else if (sortBy === 'avgRating') diff = (a.averageRating || 0) - (b.averageRating || 0);
    else if (sortBy === 'reviewCount') diff = a.totalReviewCount - b.totalReviewCount;
    else if (sortBy === 'alertCount') diff = a.breachedCount - b.breachedCount;
    return sortOrder === 'desc' ? -diff : diff;
  });

  const toggleSort = (col: 'name' | 'avgRating' | 'reviewCount' | 'alertCount') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Cross Platform Summary
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            Aggregated cross-retailer matrix comparing ratings, review volume, defect breakdowns, and key findings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportProductsCsv(allProducts)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5EA] hover:bg-[#F2F2F7] dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:text-[#F5F5F7] rounded-xl transition-colors shadow-2xs whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onCopyEmailTable}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors shadow-2xs whitespace-nowrap"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Copy Email Table</span>
          </button>
        </div>
      </div>

      {/* Primary Summary Table */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search products or barcodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            {/* Filter segments */}
            <div className="flex items-center gap-1 p-0.5 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-lg">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  filterMode === 'all'
                    ? 'bg-white text-[#1D1D1F] dark:bg-[#1C1C1E] dark:text-[#F5F5F7]'
                    : 'text-[#8E8E93]'
                }`}
              >
                All ({groups.length})
              </button>
              <button
                onClick={() => setFilterMode('alert')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  filterMode === 'alert'
                    ? 'bg-white text-[#FF3B30] dark:bg-[#1C1C1E]'
                    : 'text-[#8E8E93]'
                }`}
              >
                Below 4.0
              </button>
              <button
                onClick={() => setFilterMode('ok')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  filterMode === 'ok'
                    ? 'bg-white text-[#34C759] dark:bg-[#1C1C1E]'
                    : 'text-[#8E8E93]'
                }`}
              >
                Compliant
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8E8E93] font-mono tabular-nums">
            Showing {filtered.length} of {groups.length} grouped product lines
          </div>
        </div>

        {/* Data Grid with All Requested Fields */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 min-w-[220px] cursor-pointer hover:text-[#1D1D1F]"
                >
                  <div className="flex items-center gap-1">
                    <span>Product</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                {PLAT_ORDER.map((plat) => (
                  <th key={plat} className="py-3 px-3 text-center min-w-[95px]">
                    {PLAT_LABEL[plat]}
                  </th>
                ))}
                <th
                  onClick={() => toggleSort('avgRating')}
                  className="py-3 px-3 text-center min-w-[105px] cursor-pointer hover:text-[#1D1D1F]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Average Rating</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('reviewCount')}
                  className="py-3 px-3 text-center min-w-[100px] cursor-pointer hover:text-[#1D1D1F]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Review Count</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[180px]">Complaint Breakdown</th>
                <th className="py-3 px-4 min-w-[260px]">Key Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={PLAT_ORDER.length + 5} className="py-12 text-center text-[#8E8E93]">
                    No products match current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => onSelectGroup(g)}
                    className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40 transition-colors cursor-pointer group"
                  >
                    {/* Field 1: Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors line-clamp-1">
                        {g.name}
                      </div>
                      <div className="text-[10px] text-[#8E8E93] font-mono mt-0.5">
                        {g.upc && `UPC: ${g.upc}`}
                        {g.model && ` · Model: ${g.model}`}
                      </div>
                    </td>

                    {/* Fields 2-6: Individual Channel Ratings */}
                    {PLAT_ORDER.map((plat) => {
                      const sc = g.platforms[plat];
                      if (!sc || sc.rating === null) {
                        return (
                          <td key={plat} className="py-3.5 px-3 text-center text-[#C7C7CC] dark:text-[#48484A]">
                            —
                          </td>
                        );
                      }
                      const isLow = sc.rating < threshold;

                      return (
                        <td
                          key={plat}
                          className={`py-3.5 px-3 text-center font-mono tabular-nums ${
                            isLow
                              ? 'text-[#FF3B30] font-bold bg-[#FFF2F0]/60 dark:bg-[#3D1412]/40'
                              : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                          }`}
                        >
                          {sc.rating.toFixed(1)}
                        </td>
                      );
                    })}

                    {/* Field 7: Average Rating */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">
                      {g.averageRating !== null ? (
                        <span
                          className={
                            g.averageRating < threshold
                              ? 'text-[#FF3B30]'
                              : 'text-[#34C759]'
                          }
                        >
                          {g.averageRating.toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Field 8: Review Count */}
                    <td className="py-3.5 px-3 text-center font-mono tabular-nums text-[#8E8E93]">
                      {g.totalReviewCount.toLocaleString()}
                    </td>

                    {/* Field 9: Complaint Breakdown */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#1D1D1F] dark:text-[#E5E5EA]">
                      {g.complaintBreakdown}
                    </td>

                    {/* Field 10: Key Findings */}
                    <td className="py-3.5 px-4 text-[11px] text-[#8E8E93] leading-relaxed">
                      {g.keyFindingText}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
