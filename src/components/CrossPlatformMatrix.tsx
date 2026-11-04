import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { CrossPlatformGroup, PlatformCode, ProductItem } from '../types';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms } from '../services/summaryService';
import { exportProductsCsv } from '../services/exportService';

interface CrossPlatformMatrixProps {
  groups: CrossPlatformGroup[];
  allProducts: ProductItem[];
  threshold: number;
  onSelectGroup: (group: CrossPlatformGroup) => void;
  onOpenExactUrl?: (url: string) => void;
}

export const CrossPlatformMatrix: React.FC<CrossPlatformMatrixProps> = ({
  groups,
  allProducts,
  threshold,
  onSelectGroup,
  onOpenExactUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'ok'>('all');

  const filteredGroups = groups.filter((g) => {
    // text search
    const query = searchTerm.toLowerCase().trim();
    const matchText =
      !query ||
      g.name.toLowerCase().includes(query) ||
      g.upc.toLowerCase().includes(query) ||
      g.model.toLowerCase().includes(query);

    if (!matchText) return false;

    // status filter
    const belowCount = belowPlatforms(g, threshold).length;
    if (statusFilter === 'alert') return belowCount > 0;
    if (statusFilter === 'ok') return belowCount === 0;
    return true;
  });

  const handleExportCsv = () => {
    exportProductsCsv(allProducts);
  };

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search product name, UPC, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 sm:w-80 rounded-md border border-neutral-200 bg-neutral-50/80 py-1.5 pl-8 pr-3 text-xs placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-neutral-400 dark:text-white"
            />
          </div>

          {/* Filter segment */}
          <div className="hidden sm:flex items-center gap-1 rounded-md bg-neutral-100 p-0.5 dark:bg-neutral-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All ({groups.length})
            </button>
            <button
              onClick={() => setStatusFilter('alert')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'alert'
                  ? 'bg-white text-red-600 shadow-xs dark:bg-neutral-700 dark:text-red-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Below Benchmark ({groups.filter((g) => belowPlatforms(g, threshold).length > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('ok')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'ok'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-neutral-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Compliant ({groups.filter((g) => belowPlatforms(g, threshold).length === 0).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            title="Download full rating dataset as CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200/80 bg-neutral-50/75 dark:border-neutral-800 dark:bg-neutral-800/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[260px]">Product Identification</th>
              {PLAT_ORDER.map((plat) => (
                <th key={plat} className="py-3 px-3 text-center min-w-[105px]">
                  {PLAT_LABEL[plat]}
                </th>
              ))}
              <th className="py-3 px-3 text-center min-w-[85px]">
                &lt; {threshold.toFixed(1)} Channels
              </th>
              <th className="py-3 px-3 text-center min-w-[90px]">Status</th>
              <th className="py-3 px-4 text-right min-w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                  No monitored products matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredGroups.map((g) => {
                const breached = belowPlatforms(g, threshold);
                const isAlert = breached.length > 0;

                return (
                  <tr
                    key={g.id}
                    onClick={() => onSelectGroup(g)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Product Identification */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {g.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {g.upc && <span>UPC: {g.upc}</span>}
                        {g.upc && g.model && <span>·</span>}
                        {g.model && <span>Model: {g.model}</span>}
                        {g._wl && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            · Watchlist Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 2 - 6: Platforms */}
                    {PLAT_ORDER.map((plat) => {
                      const score = g.platforms[plat];
                      if (!score || score.rating === null) {
                        return (
                          <td key={plat} className="py-3.5 px-3 text-center text-neutral-300 dark:text-neutral-600 tabular-nums">
                            —
                          </td>
                        );
                      }

                      const isLow = score.rating < threshold;

                      return (
                        <td
                          key={plat}
                          className={`py-3.5 px-3 text-center tabular-nums transition-colors ${
                            isLow
                              ? 'bg-red-50/40 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs">{score.rating.toFixed(1)}</span>
                            {score.count !== null && (
                              <span className="text-[10px] text-neutral-400 font-normal">
                                ({score.count >= 1000 ? `${(score.count / 1000).toFixed(1)}k` : score.count})
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Column 7: Breached Channels */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-semibold">
                      {breached.length > 0 ? (
                        <span className="text-red-600 dark:text-red-400">
                          {breached.length} / 5
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          0
                        </span>
                      )}
                    </td>

                    {/* Column 8: Health Status Tag */}
                    <td className="py-3.5 px-3 text-center">
                      {isAlert ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>ALERT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PASS</span>
                        </span>
                      )}
                    </td>

                    {/* Column 9: Action */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
        <div>
          Showing {filteredGroups.length} of {groups.length} grouped product lines
        </div>
        <div>
          Cross-platform series conflict prevention active · Ratings strictly checked against threshold &lt; {threshold.toFixed(1)}
        </div>
      </div>
    </div>
  );
};
