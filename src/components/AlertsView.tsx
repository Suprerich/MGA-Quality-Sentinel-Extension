import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Search,
  FileSpreadsheet,
  Mail,
  Flame,
  ShieldAlert,
  Star
} from 'lucide-react';
import { CrossPlatformGroup, ProductItem } from '../types';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms, buildKeyFindings } from '../services/summaryService';
import { exportLowRatedExcel } from '../services/exportService';

interface AlertsViewProps {
  groups: CrossPlatformGroup[];
  products: ProductItem[];
  threshold: number;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onCopyEmailTable: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  groups,
  products,
  threshold,
  onSelectGroup,
  onCopyEmailTable
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const alertGroups = groups.filter((g) => belowPlatforms(g, threshold).length > 0);

  const filtered = alertGroups.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.upc.toLowerCase().includes(q) ||
      g.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Active Quality Alerts
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            Real-time alert register for products with average ratings under {threshold.toFixed(1)} across retail portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLowRatedExcel(products, threshold)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-xl transition-colors shadow-2xs whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export Alert Report (.xls)</span>
          </button>
          <button
            onClick={onCopyEmailTable}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5EA] hover:bg-[#F2F2F7] dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:text-[#F5F5F7] rounded-xl transition-colors whitespace-nowrap"
          >
            <Mail className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>Copy Email Alert</span>
          </button>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search alert items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div className="text-xs text-[#FF3B30] font-semibold font-mono tabular-nums">
            {filtered.length} Active Alerts
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#8E8E93]">
              No active alerts matching your search. All monitored products are performing above benchmark.
            </div>
          ) : (
            filtered.map((g) => {
              const breached = belowPlatforms(g, threshold);

              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g)}
                  className="p-5 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/50 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#FF3B30] font-bold">⚠</span>
                        <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors">
                          {g.name}
                        </h3>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-[#8E8E93] font-mono tabular-nums">
                        {g.upc && <span>UPC: {g.upc}</span>}
                        {g.model && <span>Model: {g.model}</span>}
                        <span className="text-[#FF3B30] font-semibold">
                          Breached {breached.length} of 5 channels
                        </span>
                      </div>

                      {/* Channel Ratings */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {PLAT_ORDER.map((plat) => {
                          const sc = g.platforms[plat];
                          if (!sc || sc.rating === null) return null;
                          const isLow = sc.rating < threshold;

                          return (
                            <div
                              key={plat}
                              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tabular-nums flex items-center gap-1.5 ${
                                isLow
                                  ? 'bg-[#FFF2F0] text-[#FF3B30] border border-[#FF3B30]/30 dark:bg-[#3D1412]'
                                  : 'bg-[#F2F2F7] text-[#1D1D1F] dark:bg-[#2C2C2E] dark:text-[#F5F5F7]'
                              }`}
                            >
                              <span className="font-sans font-normal text-[10px] text-[#8E8E93]">
                                {PLAT_LABEL[plat]}:
                              </span>
                              <span>{sc.rating.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recent Complaint Preview if any */}
                      {g.complaints && g.complaints.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 text-xs text-[#1D1D1F] dark:text-[#E5E5EA]">
                          <div className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                            Primary QA Issue · {g.complaints[0].issueType}
                          </div>
                          <div className="italic text-[11px] text-[#8E8E93] line-clamp-2">
                            &ldquo;{g.complaints[0].comment}&rdquo;
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold text-[#007AFF] group-hover:underline">
                        Investigate
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#8E8E93] group-hover:text-[#007AFF] transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
