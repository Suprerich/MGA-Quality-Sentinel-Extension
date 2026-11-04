import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Mail,
  Copy,
  Check,
  FileText,
  TrendingDown,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { CrossPlatformGroup, ProductItem, TrendDatabase } from '../types';
import {
  exportLowRatedExcel,
  exportProductsCsv,
  exportComplaintsCsv
} from '../services/exportService';
import { exportTrendCsv } from '../services/trendService';
import {
  buildEmailTableHtml,
  buildEmailTablePlain,
  buildKeyFindings
} from '../services/summaryService';
import { generateExtensionZip, downloadExtensionZip } from '../services/packagerService';

interface ExportsCenterViewProps {
  groups: CrossPlatformGroup[];
  products: ProductItem[];
  trendDb: TrendDatabase;
  threshold: number;
  lastScanTime: string;
}

export const ExportsCenterView: React.FC<ExportsCenterViewProps> = ({
  groups,
  products,
  trendDb,
  threshold,
  lastScanTime
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const notifyCopied = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 1. Export Excel Low Rated
  const handleExportExcelLowRated = () => {
    exportLowRatedExcel(products, threshold);
  };

  // 2. Export Products CSV
  const handleExportProductsCsv = () => {
    exportProductsCsv(products);
  };

  // 3. Export Low Rated CSV
  const handleExportLowRatedCsv = () => {
    const lowRated = products.filter((p) => p.rating !== null && p.rating < threshold);
    exportProductsCsv(lowRated);
  };

  // 4. Export Trend CSV
  const handleExportTrendCsv = () => {
    exportTrendCsv(trendDb);
  };

  // 5. Copy Email Table
  const handleCopyEmailTable = async () => {
    const html = buildEmailTableHtml(groups, threshold, false);
    const plain = buildEmailTablePlain(groups, threshold, false);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' })
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      notifyCopied('email_table');
    } catch (e) {
      await navigator.clipboard.writeText(plain);
      notifyCopied('email_table');
    }
  };

  // 6. Copy Summary Text
  const handleCopySummary = async () => {
    const bullets = buildKeyFindings(groups, threshold, false);
    const text = [
      `MGA Quality Sentinel - Executive Summary`,
      `Threshold: < ${threshold.toFixed(1)} | Generated: ${new Date().toLocaleString()}`,
      `----------------------------------------------------`,
      ...bullets.map((b) => `• ${b}`)
    ].join('\n');

    await navigator.clipboard.writeText(text);
    notifyCopied('summary');
  };

  // 7. Copy Dashboard Snapshot
  const handleCopySnapshot = async () => {
    const lowRatedCount = groups.filter((g) =>
      Object.values(g.platforms).some((s) => s?.rating !== null && s?.rating! < threshold)
    ).length;

    const snapshot = [
      `MGA QUALITY SENTINEL — DASHBOARD SNAPSHOT`,
      `Captured: ${new Date().toLocaleString()}`,
      `Last Scan: ${lastScanTime}`,
      `-----------------------------------------`,
      `Total Tracked SKUs: ${groups.length}`,
      `Active Low-Rating Alerts (< ${threshold.toFixed(1)}): ${lowRatedCount}`,
      `Monitored Retail Channels: Walmart US, Walmart CA, Amazon US, Amazon CA, Target`,
      `-----------------------------------------`,
      `Key Finding:`,
      ...buildKeyFindings(groups, threshold, true).map((b) => `• ${b}`)
    ].join('\n');

    await navigator.clipboard.writeText(snapshot);
    notifyCopied('snapshot');
  };

  // 8. Download Extension Zip
  const handleDownloadExtension = async () => {
    try {
      setDownloadingZip(true);
      const blob = await generateExtensionZip();
      downloadExtensionZip(blob);
      notifyCopied('extension_zip');
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
          Exports Center
        </h1>
        <p className="text-body text-[#8E8E93] mt-1">
          Unified command center for all data reporting, formatted email tables, Excel workbooks, and extension packaging.
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Item 1: Export Excel (Low Rated Analysis) */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#EBF9F1] dark:bg-[#13381B] text-[#34C759] flex items-center justify-center mb-3">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Export Low-Rated Excel (.xls)
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Full formatted workbook grouping low-rated products, alert status, QA issue breakdowns, and verbatim review quotes.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleExportExcelLowRated}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#34C759] hover:bg-[#2FB350] rounded-lg transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel Report</span>
            </button>
          </div>
        </div>

        {/* Item 2: Export CSV (All Products) */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#007AFF] flex items-center justify-center mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Export Products CSV
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Comprehensive spreadsheet of all active retail listings, UPC numbers, ratings, review counts, and country of origin.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleExportProductsCsv}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#007AFF]" />
              <span>Download Products CSV</span>
            </button>
          </div>
        </div>

        {/* Item 3: Export Low Rated CSV */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#FFF2F0] dark:bg-[#3D1412] text-[#FF3B30] flex items-center justify-center mb-3">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Export Low-Rated Only CSV
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Filtered CSV dataset strictly containing items below the {threshold.toFixed(1)} benchmark for targeted vendor corrective actions.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleExportLowRatedCsv}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FF3B30] bg-[#FFF2F0] hover:bg-[#FFE5E2] dark:bg-[#3D1412] dark:hover:bg-[#4D1A17] rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Low-Rated CSV</span>
            </button>
          </div>
        </div>

        {/* Item 4: Export Trend Data */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#007AFF] flex items-center justify-center mb-3">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Export Trend Tracking CSV
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Historical timeline snapshots (product, retailer, date, rating, review count) for longitudinal quality tracking.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleExportTrendCsv}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#007AFF]" />
              <span>Download Trend CSV</span>
            </button>
          </div>
        </div>

        {/* Item 5: Copy Email Table */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#EBF4FF] dark:bg-[#102A4C] text-[#007AFF] flex items-center justify-center mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Copy Email Table
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              HTML table formatted with navy headers and red alert callouts, designed to paste directly (Ctrl+V) into Microsoft Outlook or Gmail.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleCopyEmailTable}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-lg transition-colors shadow-2xs"
            >
              {copiedKey === 'email_table' ? (
                <Check className="h-3.5 w-3.5 text-white" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === 'email_table' ? 'Copied HTML Table!' : 'Copy Email Table'}</span>
            </button>
          </div>
        </div>

        {/* Item 6: Copy Executive Summary */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center mb-3">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Copy Executive Summary
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Natural-language bullet points synthesizing low-rated products with representative customer complaint keywords.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleCopySummary}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
            >
              {copiedKey === 'summary' ? (
                <Check className="h-3.5 w-3.5 text-[#34C759]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === 'summary' ? 'Copied Bullets!' : 'Copy Key Findings'}</span>
            </button>
          </div>
        </div>

        {/* Item 7: Copy Dashboard Snapshot */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center mb-3">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Copy Dashboard Snapshot
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Executive status text snippet with current KPI figures, active alert tallies, and last scan timestamp for quick Teams/Slack status updates.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleCopySnapshot}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
            >
              {copiedKey === 'snapshot' ? (
                <Check className="h-3.5 w-3.5 text-[#34C759]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === 'snapshot' ? 'Copied Snapshot!' : 'Copy Snapshot Text'}</span>
            </button>
          </div>
        </div>

        {/* Item 8: Download Full Extension Package */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 rounded-xl bg-[#007AFF] text-white flex items-center justify-center mb-3">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-card-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              Package Browser Extension (.zip)
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Directly generates the unpacked extension archive for Chrome &amp; Edge (Manifest V3) including manifest.json, background worker, and full dashboard.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              onClick={handleDownloadExtension}
              disabled={downloadingZip}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1D1D1F] hover:bg-[#000000] dark:bg-white dark:text-[#1D1D1F] dark:hover:bg-[#E5E5EA] rounded-lg transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloadingZip ? 'Packaging...' : 'Download Extension (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
