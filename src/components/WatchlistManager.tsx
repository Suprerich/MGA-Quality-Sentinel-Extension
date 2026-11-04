import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Search
} from 'lucide-react';
import { ProductItem, WatchlistItem } from '../types';
import {
  parseWatchlistText,
  watchlistToText,
  saveWatchlist,
  matchToWatchlist
} from '../services/skuCore';

interface WatchlistManagerProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (items: WatchlistItem[]) => void;
  products: ProductItem[];
  onReload: () => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  watchlist,
  onUpdateWatchlist,
  products,
  onReload
}) => {
  const [textValue, setTextValue] = useState(watchlistToText(watchlist));
  const [statusMessage, setStatusMessage] = useState('');
  const [directInput, setDirectInput] = useState('');
  const [directSite, setDirectSite] = useState<
    'target' | 'walmart_us' | 'walmart_ca' | 'amazon_us' | 'amazon_ca' | 'costco_us' | 'costco_ca'
  >('target');

  // Sync text when watchlist changes externally
  React.useEffect(() => {
    setTextValue(watchlistToText(watchlist));
  }, [watchlist]);

  const handleSave = async () => {
    const items = parseWatchlistText(textValue);
    await saveWatchlist(items);
    onUpdateWatchlist(items);
    setStatusMessage(`Saved ${items.length} monitored SKU(s) to local-first database.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleOpenDirect = () => {
    const raw = directInput.trim();
    if (!raw) return;

    let url = '';
    const id = raw.replace(/[^a-z0-9]/gi, '');

    if (/^https?:\/\//i.test(raw)) {
      url = raw;
    } else if (directSite === 'target') {
      url = `https://www.target.com/s?searchTerm=${encodeURIComponent(raw)}`;
    } else if (directSite === 'walmart_us') {
      url = /^\d{5,}$/.test(id)
        ? `https://www.walmart.com/reviews/product/${id}`
        : `https://www.walmart.com/search?q=${encodeURIComponent(raw)}`;
    } else if (directSite === 'walmart_ca') {
      url = /^\d{5,}$/.test(id)
        ? `https://www.walmart.ca/reviews/product/${id}`
        : `https://www.walmart.ca/en/search?q=${encodeURIComponent(raw)}`;
    } else if (directSite === 'amazon_us') {
      url = /^[A-Z0-9]{10}$/i.test(id)
        ? `https://www.amazon.com/product-reviews/${id}`
        : `https://www.amazon.com/s?k=${encodeURIComponent(raw)}`;
    } else if (directSite === 'amazon_ca') {
      url = /^[A-Z0-9]{10}$/i.test(id)
        ? `https://www.amazon.ca/product-reviews/${id}`
        : `https://www.amazon.ca/s?k=${encodeURIComponent(raw)}`;
    } else if (directSite === 'costco_us') {
      url = /^\d{5,}$/.test(id)
        ? `https://www.costco.com/.product.${id}.html`
        : `https://www.costco.com/CatalogSearch?dept=All&keyword=${encodeURIComponent(raw)}`;
    } else if (directSite === 'costco_ca') {
      url = /^\d{5,}$/.test(id)
        ? `https://www.costco.ca/.product.${id}.html`
        : `https://www.costco.ca/CatalogSearch?dept=All&keyword=${encodeURIComponent(raw)}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Find match results
  const matchResults: {
    watchItem: WatchlistItem;
    hits: { product: ProductItem; by: string }[];
  }[] = watchlist.map((w) => {
    const hits: { product: ProductItem; by: string }[] = [];
    products.forEach((p) => {
      const match = matchToWatchlist(p, [w]);
      if (match) {
        hits.push({ product: p, by: match.by });
      }
    });
    return { watchItem: w, hits };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>SKU Validation &amp; Monitored Watchlist</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Enforce strict cross-platform SKU matching priority: UPC &gt; Model &gt; Platform ID (WM#/TCIN/ASIN) &gt; Name overlap (&ge;0.60 with seriesConflict guard).
            </p>
          </div>

          {statusMessage && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Watchlist Editor (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-900 dark:text-white">
                My Tracked SKUs (One per line)
              </label>
              <span className="text-[11px] text-neutral-400">
                Supports Excel Tab, Pipe |, or Comma
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">
              Column sequence: <code className="font-mono text-neutral-700 dark:text-neutral-300">Name | UPC | Model | WM# | TCIN | ASIN</code>. (Only Name required; IDs provide 100% exact match).
            </p>

            <textarea
              rows={11}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Miniverse Make It Mini Lord of the Rings | 035051594238 | 594238 | 6000207908091 | 89984321 | B0D5B7M88X&#10;Little Tikes Power Cuts Chainsaw | 050743657382 | 657382 | 849302194 | 79841203 | B085B99Z1P"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-2xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Watchlist</span>
            </button>
            <button
              onClick={onReload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload</span>
            </button>
            <span className="text-[11px] text-neutral-400 ml-auto">
              {watchlist.length} SKUs defined
            </span>
          </div>
        </div>

        {/* Right Column: Direct Jump & Real-time Verification (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Exact Product Opener */}
          <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
              Open Exact Retailer Listing (By URL or ID)
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
              Paste a full product URL or direct identifier (UPC, TCIN, Walmart #, or Amazon ASIN) to jump directly to reviews.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. 89984321 or B0D5B7M88X or full URL"
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenDirect()}
                className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:outline-none"
              />
              <select
                value={directSite}
                onChange={(e: any) => setDirectSite(e.target.value)}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="target">Target (TCIN)</option>
                <option value="walmart_us">Walmart US (Item#)</option>
                <option value="walmart_ca">Walmart CA (Item#)</option>
                <option value="amazon_us">Amazon US (ASIN)</option>
                <option value="amazon_ca">Amazon CA (ASIN)</option>
                <option value="costco_us">Costco US (Item#)</option>
                <option value="costco_ca">Costco CA (Item#)</option>
              </select>
              <button
                onClick={handleOpenDirect}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap"
              >
                <span>Open Listing</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Real-time Match Inspector */}
          <div className="rounded-xl border border-neutral-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Live Watchlist Verification Matrix
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Matches verified against active catalog data with series isolation protection.
                </p>
              </div>
              <span className="text-xs text-neutral-500 font-mono tabular-nums">
                {matchResults.filter((m) => m.hits.length > 0).length} / {watchlist.length} Linked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-800/40 text-[11px] font-medium text-neutral-400">
                    <th className="py-2.5 px-4">Watchlist Item</th>
                    <th className="py-2.5 px-3">Match Method</th>
                    <th className="py-2.5 px-3">Linked Channels</th>
                    <th className="py-2.5 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {matchResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-neutral-400">
                        No watchlisted items configured yet.
                      </td>
                    </tr>
                  ) : (
                    matchResults.map((m, idx) => {
                      const hasHits = m.hits.length > 0;
                      return (
                        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {m.watchItem.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {m.watchItem.upc && `UPC: ${m.watchItem.upc}`}
                              {m.watchItem.model && ` · Model: ${m.watchItem.model}`}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {hasHits ? (
                              <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                                {Array.from(new Set(m.hits.map((h) => h.by))).join(', ')}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                            {hasHits ? `${m.hits.length} listings found` : 'Not detected in current scan'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {hasHits ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-400">
                                Pending Scan
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
      </div>
    </div>
  );
};
