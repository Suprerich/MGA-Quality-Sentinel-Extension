import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  HelpCircle,
  Search,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProductItem, SkuValidationStatus, WatchlistItem } from '../types';
import { matchToWatchlist, seriesConflict, overlap, tokens } from '../services/skuCore';

interface SkuValidationViewProps {
  products: ProductItem[];
  watchlist: WatchlistItem[];
  onUpdateProductStatus?: (productId: string, status: SkuValidationStatus) => void;
}

interface SkuValidationRow {
  product: ProductItem;
  status: SkuValidationStatus;
  matchedWatchItem?: WatchlistItem;
  matchReason: string;
  confidence: number;
}

export const SkuValidationView: React.FC<SkuValidationViewProps> = ({
  products,
  watchlist
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Classify each product into the 5 categories
  const rows: SkuValidationRow[] = products.map((p) => {
    // Check duplicate UPC
    const upcMatches = products.filter(
      (other) => p.upcNumber && other.upcNumber === p.upcNumber && other.url !== p.url
    );
    if (upcMatches.length > 0) {
      return {
        product: p,
        status: 'Duplicate SKU',
        matchReason: `Duplicate UPC ${p.upcNumber} detected across ${upcMatches.length + 1} distinct product listings`,
        confidence: 0.95
      };
    }

    // Match against watchlist
    const match = matchToWatchlist(p, watchlist);
    if (match) {
      return {
        product: p,
        status: 'Matched',
        matchedWatchItem: match.item,
        matchReason: `Exact match verified via ${match.by} with zero series conflict`,
        confidence: match.score
      };
    }

    // Check potential variant (tokens overlap but series conflict occurred)
    const pTokens = tokens(p.name);
    for (const w of watchlist) {
      const wTokens = w.tokens || tokens(w.name);
      if (seriesConflict(pTokens, wTokens)) {
        return {
          product: p,
          status: 'Potential Variant',
          matchedWatchItem: w,
          matchReason: `Detected series divergence with "${w.name}". Separated to prevent false-merge.`,
          confidence: 0.8
        };
      }
    }

    // Check if partial name overlap exists (needs manual review)
    for (const w of watchlist) {
      const wTokens = w.tokens || tokens(w.name);
      const ov = overlap(pTokens, wTokens);
      if (ov >= 0.35 && ov < 0.6) {
        return {
          product: p,
          status: 'Needs Manual Review',
          matchedWatchItem: w,
          matchReason: `Partial title overlap (${Math.round(ov * 100)}%) with "${w.name}". Requires manual confirmation.`,
          confidence: ov
        };
      }
    }

    return {
      product: p,
      status: 'Not Matched',
      matchReason: 'No matching UPC, Model, or ASIN in monitored watchlist catalog',
      confidence: 0
    };
  });

  const counts: Record<SkuValidationStatus, number> = {
    Matched: rows.filter((r) => r.status === 'Matched').length,
    'Not Matched': rows.filter((r) => r.status === 'Not Matched').length,
    'Potential Variant': rows.filter((r) => r.status === 'Potential Variant').length,
    'Duplicate SKU': rows.filter((r) => r.status === 'Duplicate SKU').length,
    'Needs Manual Review': rows.filter((r) => r.status === 'Needs Manual Review').length
  };

  const filteredRows = rows.filter((r) => {
    if (selectedFilter !== 'all' && r.status !== selectedFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.product.name.toLowerCase().includes(q) ||
        (r.product.upcNumber && r.product.upcNumber.toLowerCase().includes(q)) ||
        (r.product.modelNumber && r.product.modelNumber.toLowerCase().includes(q)) ||
        (r.matchedWatchItem && r.matchedWatchItem.name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
          SKU Validation
        </h1>
        <p className="text-body text-[#8E8E93] mt-1">
          Eliminate false-positives and variant confusion across multi-retailer catalogs with strict series isolation logic.
        </p>
      </div>

      {/* 5 Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Matched' ? 'all' : 'Matched')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedFilter === 'Matched'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#34C759]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-mono text-base font-bold tabular-nums">
              {counts.Matched}
            </span>
          </div>
          <div className="mt-2 text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Matched
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-0.5">
            Verified exact SKU link
          </div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Potential Variant' ? 'all' : 'Potential Variant')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedFilter === 'Potential Variant'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#FF9500]">
            <Layers className="h-4 w-4" />
            <span className="font-mono text-base font-bold tabular-nums">
              {counts['Potential Variant']}
            </span>
          </div>
          <div className="mt-2 text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Potential Variant
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-0.5">
            Isolated by series guard
          </div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Needs Manual Review' ? 'all' : 'Needs Manual Review')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedFilter === 'Needs Manual Review'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#FF3B30]">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-base font-bold tabular-nums">
              {counts['Needs Manual Review']}
            </span>
          </div>
          <div className="mt-2 text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Needs Review
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-0.5">
            Ambiguous title similarity
          </div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Duplicate SKU' ? 'all' : 'Duplicate SKU')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedFilter === 'Duplicate SKU'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8E8E93]">
            <Copy className="h-4 w-4" />
            <span className="font-mono text-base font-bold tabular-nums">
              {counts['Duplicate SKU']}
            </span>
          </div>
          <div className="mt-2 text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Duplicate SKU
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-0.5">
            Repeated barcode listings
          </div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Not Matched' ? 'all' : 'Not Matched')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedFilter === 'Not Matched'
              ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
              : 'border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8E8E93]">
            <XCircle className="h-4 w-4" />
            <span className="font-mono text-base font-bold tabular-nums">
              {counts['Not Matched']}
            </span>
          </div>
          <div className="mt-2 text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Not Matched
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-0.5">
            Outside target watchlist
          </div>
        </button>
      </div>

      {/* Validation Data Table */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Filter by product name, UPC, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div className="text-xs text-[#8E8E93] tabular-nums font-mono">
            Showing {filteredRows.length} of {rows.length} product listings
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                <th className="py-3 px-4 min-w-[240px]">Scanned Listing</th>
                <th className="py-3 px-3 min-w-[100px]">Retailer</th>
                <th className="py-3 px-3 min-w-[150px]">Validation Status</th>
                <th className="py-3 px-4 min-w-[240px]">Matched Watchlist SKU</th>
                <th className="py-3 px-4 min-w-[260px]">Verification Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8E8E93]">
                    No items match the selected SKU validation filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const statusColors: Record<SkuValidationStatus, string> = {
                    Matched: 'text-[#34C759] bg-[#EBF9F1] dark:bg-[#13381B]',
                    'Potential Variant': 'text-[#FF9500] bg-[#FFF8EB] dark:bg-[#3D2C12]',
                    'Needs Manual Review': 'text-[#FF3B30] bg-[#FFF2F0] dark:bg-[#3D1412]',
                    'Duplicate SKU': 'text-[#8E8E93] bg-[#F2F2F7] dark:bg-[#2C2C2E]',
                    'Not Matched': 'text-[#8E8E93] bg-[#F2F2F7] dark:bg-[#2C2C2E]'
                  };

                  return (
                    <tr key={idx} className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-1">
                          {r.product.name}
                        </div>
                        <div className="text-[11px] text-[#8E8E93] font-mono mt-0.5">
                          {r.product.upcNumber && `UPC: ${r.product.upcNumber}`}
                          {r.product.modelNumber && ` · Model: ${r.product.modelNumber}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[#1D1D1F] dark:text-[#E5E5EA] font-medium">
                        {r.product.retailer}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                            statusColors[r.status]
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {r.matchedWatchItem ? (
                          <div>
                            <div className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {r.matchedWatchItem.name}
                            </div>
                            <div className="text-[10px] text-[#8E8E93] font-mono">
                              UPC: {r.matchedWatchItem.upc || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#8E8E93]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#8E8E93] text-[11px] leading-relaxed">
                        {r.matchReason}
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
