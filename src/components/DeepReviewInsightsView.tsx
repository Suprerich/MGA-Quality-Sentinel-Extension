import React, { useState } from 'react';
import {
  SearchCode,
  AlertTriangle,
  Flame,
  Star,
  Quote,
  Clock,
  User,
  ExternalLink,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import { Complaint, ProductItem } from '../types';

interface DeepReviewInsightsViewProps {
  products: ProductItem[];
  threshold: number;
}

export const DeepReviewInsightsView: React.FC<DeepReviewInsightsViewProps> = ({
  products,
  threshold
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all complaints
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

  // Calculate top recurring issues
  const recurringMap: Record<string, number> = {};
  allReviews.forEach((r) => {
    recurringMap[r.issueType] = (recurringMap[r.issueType] || 0) + 1;
  });
  const topRecurring = Object.entries(recurringMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate top keywords
  const keywordMap: Record<string, number> = {};
  allReviews.forEach((r) => {
    (r.keywords || []).forEach((kw) => {
      keywordMap[kw] = (keywordMap[kw] || 0) + 1;
    });
  });
  const topKeywords = Object.entries(keywordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Filtered reviews
  const filtered = allReviews.filter((r) => {
    if (selectedProduct !== 'all' && r.productName !== selectedProduct) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.comment.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.userTag.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
          Deep Review Insights
        </h1>
        <p className="text-body text-[#8E8E93] mt-1">
          Verbatim consumer reviews, recurring defects, representative quotes, and actionable engineering risks.
        </p>
      </div>

      {/* Top 3 Analytical Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Potential Quality Risks */}
        <div className="rounded-2xl border border-[#FF3B30]/25 bg-[#FFF2F0]/60 p-5 dark:border-[#FF3B30]/30 dark:bg-[#3D1412]/50 shadow-2xs">
          <div className="flex items-center gap-2 text-[#FF3B30] mb-3">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="text-card-title">Potential Quality Risks</h2>
          </div>

          <ul className="space-y-3 text-xs leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7]">
            <li className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">1.</span>
              <div>
                <b>Miniverse Resin Fumes &amp; Curing:</b> Multiple customers report acute acrid odor during UV curing; recommend supplier inspection of monomer formula.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">2.</span>
              <div>
                <b>Little Tikes Chainsaw Battery Drain:</b> Pull-cord spring and parasitic power consumption causing DOA returns on Target within 48 hours.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">3.</span>
              <div>
                <b>Bratz 20th Neck Peg Brittleness:</b> Fragile plastic formulation causing clean neck fractures upon unboxing by collectors.
              </div>
            </li>
          </ul>
        </div>

        {/* 2. Top Recurring Issues */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs">
          <div className="flex items-center gap-2 text-[#1D1D1F] dark:text-[#F5F5F7] mb-3">
            <Flame className="h-4 w-4 text-[#FF9500]" />
            <h2 className="text-card-title">Top Recurring Issues</h2>
          </div>

          <div className="space-y-2.5">
            {topRecurring.map(([issue, count], i) => (
              <div key={issue} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[11px] text-[#8E8E93] w-4">{i + 1}.</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {issue}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-[#007AFF] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded">
                  {count} mentions
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Complaint Keywords */}
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-5 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs">
          <div className="flex items-center gap-2 text-[#1D1D1F] dark:text-[#F5F5F7] mb-3">
            <Tag className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-card-title">Complaint Keywords</h2>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {topKeywords.map(([kw, count]) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] text-[#1D1D1F] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] text-xs font-mono font-medium flex items-center gap-1.5"
              >
                <span>#{kw}</span>
                <span className="text-[10px] text-[#8E8E93] tabular-nums">({count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Representative Reviews Section */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search verbatim quotes or reviewers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] px-3 py-1.5 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7]"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#8E8E93] tabular-nums font-mono">
            Showing {filtered.length} representative quotes
          </div>
        </div>

        {/* Verbatim Reviews Cards */}
        <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#8E8E93]">
              No representative review quotes match your filter.
            </div>
          ) : (
            filtered.map((rev, idx) => (
              <div key={idx} className="p-5 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {rev.productName}
                    </span>
                    <span className="text-[#8E8E93]">·</span>
                    <span className="text-[#8E8E93]">{rev.retailer}</span>
                    <span className="text-[#8E8E93]">·</span>
                    <span className="font-semibold text-[#FF3B30] bg-[#FFF2F0] dark:bg-[#3D1412] px-2 py-0.5 rounded text-[11px]">
                      {rev.issueType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[#8E8E93] text-[11px] tabular-nums font-mono">
                    {rev.reviewRating && (
                      <div className="flex items-center gap-0.5 text-[#FF9500] font-bold">
                        <Star className="h-3 w-3 fill-[#FF9500]" />
                        <span>{rev.reviewRating}.0</span>
                      </div>
                    )}
                    <span>{rev.userTag}</span>
                    <span>·</span>
                    <span>{rev.reviewTime}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#8E8E93]">Keywords:</span>
                    {rev.keywords && rev.keywords.length > 0 ? (
                      rev.keywords.map((kw, i) => (
                        <span key={i} className="text-[#007AFF] font-mono">
                          #{kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8E8E93]">—</span>
                    )}
                  </div>

                  {rev.productUrl && (
                    <a
                      href={rev.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#007AFF] hover:underline"
                    >
                      <span>Retailer Page</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
