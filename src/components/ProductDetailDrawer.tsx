import React from 'react';
import {
  X,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Star,
  Store,
  Layers,
  Calendar,
  User,
  Quote
} from 'lucide-react';
import { CrossPlatformGroup, DefectSeverity, Language } from '../types';
import { PLAT_ORDER, PLAT_LABEL, belowPlatforms } from '../services/summaryService';
import { getIssueSeverity } from '../services/taxonomy';
import { getTranslation } from '../services/i18n';

interface ProductDetailDrawerProps {
  group: CrossPlatformGroup | null;
  threshold: number;
  onClose: () => void;
  language?: Language;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  group,
  threshold,
  onClose,
  language = 'en'
}) => {
  const t = getTranslation(language);
  if (!group) return null;

  const breached = belowPlatforms(group, threshold);
  const isAlert = breached.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-xl h-full bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col transform transition-transform duration-200 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              {isAlert ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {language === 'en' ? `ALERT: Rating < ${threshold.toFixed(1)}` : `预警：评分低于警戒值 ${threshold.toFixed(1)}`}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  <CheckCircle className="h-3 w-3" />
                  <span>{language === 'en' ? 'Compliant with Quality Target' : '符合质量目标基准'}</span>
                </span>
              )}
              {group._wl && (
                <span className="text-[11px] text-neutral-400">· {language === 'en' ? 'Watchlist Verified' : '关注库已认证'}</span>
              )}
            </div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug">
              {group.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
              {group.upc && <span>UPC: {group.upc}</span>}
              {group.upc && group.model && <span>·</span>}
              {group.model && <span>Model: {group.model}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Platform Performance Cards */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
              {language === 'en' ? 'Retail Channel Ratings' : '各渠道零售评级'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PLAT_ORDER.map((plat) => {
                const sc = group.platforms[plat];
                const isBelow = sc && sc.rating !== null && sc.rating < threshold;

                return (
                  <div
                    key={plat}
                    className={`p-3 rounded-lg border text-xs ${
                      isBelow
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20'
                        : 'border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                      <span>{PLAT_LABEL[plat]}</span>
                      {sc?.url && (
                        <a
                          href={sc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                          title={language === 'en' ? 'Open product page' : '打开商品页面'}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {sc && sc.rating !== null ? (
                      <div>
                        <div
                          className={`text-base font-bold tabular-nums ${
                            isBelow
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {sc.rating.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {sc.count !== null
                            ? `${sc.count.toLocaleString()} ${language === 'en' ? 'reviews' : '条评论'}`
                            : (language === 'en' ? 'Reviews captured' : '评论已抓取')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-neutral-400 text-xs py-1">
                        {t.statusNotScanned || (language === 'en' ? 'Not Listed' : '未查询')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Complaints Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {language === 'en'
                  ? `Captured Reviews & Defect Classifications (${group.complaints.length})`
                  : `已抓取评论与缺陷分类归纳 (${group.complaints.length})`}
              </h3>
            </div>

            {group.complaints.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-neutral-100 bg-neutral-50 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-400">
                {language === 'en'
                  ? 'No individual review quotes captured yet. Run Deep Analyze on this item to extract verbatim consumer comments.'
                  : '尚未抓取到具体评论摘录。可对该商品运行“深度分析”以提取真实顾客评价原话。'}
              </div>
            ) : (
              <div className="space-y-3">
                {group.complaints.map((c, i) => {
                  const severity = getIssueSeverity(c.issueType);
                  const isNeg = c.sentiment === 'NEGATIVE';

                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/40 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-semibold ${
                              isNeg ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'
                            }`}
                          >
                            {c.sentiment}
                          </span>
                          <span className="text-neutral-400">·</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {c.issueType}
                          </span>
                          <span className="text-neutral-400 font-mono">({severity})</span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 font-mono text-[11px]">
                          {c.reviewRating !== null && c.reviewRating !== undefined && (
                            <>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{c.reviewRating}.0</span>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed italic">
                        &ldquo;{c.comment}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <span>{c.userTag}</span>
                        <span>{c.reviewTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-400">
            MGA Quality Sentinel Core
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
          >
            {language === 'en' ? 'Close Drawer' : '关闭抽屉'}
          </button>
        </div>
      </div>
    </div>
  );
};
