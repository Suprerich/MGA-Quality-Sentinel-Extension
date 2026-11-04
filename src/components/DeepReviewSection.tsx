import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  AlertTriangle,
  Star,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { Complaint, DefectCategory, DefectSeverity, ProductItem, Sentiment } from '../types';
import { TAXONOMY, getIssueSeverity } from '../services/taxonomy';
import { exportLowRatedExcel, exportComplaintsCsv } from '../services/exportService';

interface DeepReviewSectionProps {
  products: ProductItem[];
  threshold: number;
}

export const DeepReviewSection: React.FC<DeepReviewSectionProps> = ({
  products,
  threshold
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all complaints flattened with product context
  const allReviews: (Complaint & { productName: string; retailer: string; productUrl: string })[] = [];
  products.forEach((p) => {
    (p.complaints || []).forEach((c) => {
      allReviews.push({
        ...c,
        productName: p.name,
        retailer: p.retailer,
        productUrl: p.url
      });
    });
  });

  // Calculate breakdown stats
  const defectCounts: Record<string, number> = {};
  allReviews.forEach((r) => {
    defectCounts[r.issueType] = (defectCounts[r.issueType] || 0) + 1;
  });

  // Filtered reviews
  const filteredReviews = allReviews.filter((r) => {
    if (selectedCategory !== 'all' && r.issueType !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && getIssueSeverity(r.issueType) !== selectedSeverity) return false;
    if (selectedSentiment !== 'all' && r.sentiment !== selectedSentiment) return false;
    if (selectedRetailer !== 'all' && !r.retailer.toLowerCase().includes(selectedRetailer.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.comment.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.keywords || []).some((k) => k.toLowerCase().includes(q)) ||
        r.userTag.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportExcel = () => {
    exportLowRatedExcel(products, threshold);
  };

  const handleExportCsv = () => {
    exportComplaintsCsv(allReviews);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Defect Taxonomy Overview */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Standardized Defect Taxonomy &amp; Quality Complaints
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Scored multi-keyword classification mapped against QA severity hierarchy (Critical &gt; Major &gt; Minor).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-2xs whitespace-nowrap"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Low-Rated Excel (.xls)</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category distribution grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
          {TAXONOMY.map((item) => {
            const count = defectCounts[item.issue] || 0;
            const isSelected = selectedCategory === item.issue;
            const severityColor =
              item.severity === 'Critical'
                ? 'text-red-600 dark:text-red-400'
                : item.severity === 'Major'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-neutral-500 dark:text-neutral-400';

            return (
              <button
                key={item.issue}
                onClick={() => setSelectedCategory(isSelected ? 'all' : item.issue)}
                className={`p-3 text-left rounded-lg border transition-all text-xs ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800 shadow-xs'
                    : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${severityColor}`}>
                    {item.severity}
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
                    {count}
                  </span>
                </div>
                <div className="mt-1 font-medium text-neutral-900 dark:text-white truncate" title={item.issue}>
                  {item.issue}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Review List & Filter Card */}
      <div className="rounded-xl border border-neutral-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs overflow-hidden">
        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search complaint text, reviewer, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-72 rounded-md border border-neutral-200 bg-neutral-50/80 py-1.5 pl-8 pr-3 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:outline-none"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Major">Major Only</option>
              <option value="Minor">Minor Only</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="all">All Sentiments</option>
              <option value="NEGATIVE">Negative</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="POSITIVE">Positive</option>
            </select>

            {/* Retailer Filter */}
            <select
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="all">All Retailers</option>
              <option value="target">Target</option>
              <option value="walmart">Walmart</option>
              <option value="amazon">Amazon</option>
            </select>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline cursor-pointer"
              >
                Clear Category Filter
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            Showing {filteredReviews.length} of {allReviews.length} reviews
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 dark:text-neutral-400 text-xs">
              No complaint records matched the current filter combination.
            </div>
          ) : (
            filteredReviews.map((rev, idx) => {
              const severity = getIssueSeverity(rev.issueType);
              const severityBadge =
                severity === 'Critical'
                  ? 'text-red-700 dark:text-red-400'
                  : severity === 'Major'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-neutral-600 dark:text-neutral-400';

              const sentimentColor =
                rev.sentiment === 'NEGATIVE'
                  ? 'text-red-600 dark:text-red-400'
                  : rev.sentiment === 'POSITIVE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400';

              return (
                <div key={idx} className="p-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {/* Left: Product & Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {rev.productName}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-neutral-600 dark:text-neutral-400">{rev.retailer}</span>
                      <span className="text-neutral-400">·</span>
                      <span className={`font-semibold ${sentimentColor}`}>
                        {rev.sentiment}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className={`font-medium ${severityBadge}`}>
                        {rev.issueType} ({severity})
                      </span>
                    </div>

                    {/* Right: Stars & User Date */}
                    <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 text-[11px] tabular-nums">
                      {rev.reviewRating !== null && rev.reviewRating !== undefined && (
                        <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{rev.reviewRating}.0</span>
                        </div>
                      )}
                      <span>{rev.userTag}</span>
                      <span>·</span>
                      <span>{rev.reviewTime}</span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div className="mt-2 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal">
                    &ldquo;{rev.comment}&rdquo;
                  </div>

                  {/* Keywords and direct link */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-neutral-400">Keywords:</span>
                      {rev.keywords && rev.keywords.length > 0 ? (
                        rev.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300"
                          >
                            #{kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </div>

                    {rev.productUrl && (
                      <a
                        href={rev.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>View on Retailer</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
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
