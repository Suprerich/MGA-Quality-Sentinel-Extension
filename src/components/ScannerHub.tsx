import React, { useState } from 'react';
import {
  Search,
  Scan,
  Compass,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileCode,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { ProductItem, ScanSettings } from '../types';
import { buildSearchUrl, isExtensionEnvironment } from '../services/extensionBridge';

interface ScannerHubProps {
  settings: ScanSettings;
  onUpdateSettings: (newSettings: ScanSettings) => void;
  onScanCurrentPage: () => Promise<void>;
  onSearchAndScan: (platform: string, keyword: string) => Promise<void>;
  onDeepAnalyze: () => Promise<void>;
  onLoadSampleData: () => void;
  isScanning: boolean;
  statusText: string;
  deepStatusText: string;
  isDeepScanning: boolean;
}

export const ScannerHub: React.FC<ScannerHubProps> = ({
  settings,
  onUpdateSettings,
  onScanCurrentPage,
  onSearchAndScan,
  onDeepAnalyze,
  onLoadSampleData,
  isScanning,
  statusText,
  deepStatusText,
  isDeepScanning
}) => {
  const [platform, setPlatform] = useState<string>('walmart_us');
  const [keyword, setKeyword] = useState<string>('MGA Entertainment');
  const isExt = isExtensionEnvironment();

  const handleSearchScan = () => {
    onSearchAndScan(platform, keyword);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
          Quality Scanner &amp; Deep Crawl Console
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Orchestrates client-side DOM &amp; embedded JSON (__NEXT_DATA__, __TGT_DATA__, ld+json) extraction directly within your Chromium browser session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Scan Controls (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
            1. Search &amp; Auto-Scan Portal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Retail Channel
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:outline-none"
              >
                <option value="walmart_us">Walmart US (walmart.com)</option>
                <option value="walmart_ca">Walmart Canada (walmart.ca)</option>
                <option value="amazon_us">Amazon US (amazon.com)</option>
                <option value="amazon_ca">Amazon Canada (amazon.ca)</option>
                <option value="target">Target (target.com)</option>
                <option value="costco_us">Costco US (costco.com)</option>
                <option value="costco_ca">Costco Canada (costco.ca)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. MGA Entertainment or Miniverse"
                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleSearchScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
            >
              {isScanning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span>{isScanning ? 'Scanning in Progress...' : 'Launch Search & Auto-Scan'}</span>
            </button>

            <button
              onClick={onScanCurrentPage}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <Scan className="h-3.5 w-3.5 text-neutral-500" />
              <span>Scan Active Tab</span>
            </button>
          </div>

          {/* Status Box */}
          <div className="mt-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 text-xs">
            <div className="font-semibold text-neutral-900 dark:text-white mb-0.5 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-neutral-400" />
              <span>Scanner Activity Status</span>
            </div>
            <div className="text-neutral-600 dark:text-neutral-300 font-mono text-[11px] leading-relaxed">
              {statusText || 'Ready. Click Search & Auto-Scan or Scan Active Tab to begin.'}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Crawler & Inspection Settings (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
            2. Deep Review Crawler (Low-Rated Products)
          </h3>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Automatically cycles through all products flagged with <b className="text-red-600 dark:text-red-400">ALERT (&lt; {settings.threshold.toFixed(1)})</b>, mounts review widgets in the foreground tab, and extracts verbatim customer complaints.
          </p>

          <button
            onClick={onDeepAnalyze}
            disabled={isDeepScanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
          >
            {isDeepScanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            <span>{isDeepScanning ? 'Running Deep Crawler...' : 'Run Deep Analyze on ALERT Products'}</span>
          </button>

          {/* Deep Status */}
          {deepStatusText && (
            <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-200/70 text-[11px] text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 font-mono">
              {deepStatusText}
            </div>
          )}

          {/* Settings Section */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Extraction Filters
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analyzeVisibleText}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, analyzeVisibleText: e.target.checked })
                }
                className="rounded border-neutral-300 text-neutral-900 dark:bg-neutral-800"
              />
              <span>Analyze visible review texts</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.lowRatingOnly}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, lowRatingOnly: e.target.checked })
                }
                className="rounded border-neutral-300 text-neutral-900 dark:bg-neutral-800"
              />
              <span>Filter search overview to rating &lt; {settings.threshold.toFixed(1)} only</span>
            </label>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={onLoadSampleData}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline cursor-pointer"
              >
                Reset to Reference MGA QA Data
              </button>
              <span className="text-[10px] text-neutral-400 font-mono">
                Manifest V3 Chromium
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
