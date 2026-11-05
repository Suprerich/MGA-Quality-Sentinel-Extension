import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Trash2,
  RotateCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  ArrowUpDown,
  CheckSquare,
  Square,
  Layers,
  Star,
  Play,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { ProductSession, PlatformCode, Language } from '../types';
import { PLAT_ORDER, PLAT_LABEL } from '../services/summaryService';
import { getTranslation } from '../services/i18n';

interface HistoryViewProps {
  history: ProductSession[];
  currentSessionId?: string;
  onOpenProduct: (product: ProductSession) => void;
  onContinueNextPlatform: (product: ProductSession, nextPlatform: PlatformCode) => void;
  onRescanPlatform: (product: ProductSession, platform: PlatformCode) => void;
  onDeletePlatform: (productId: string, platform: PlatformCode) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts: (productIds: string[]) => void;
  onClearAllHistory: () => void;
  language: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  currentSessionId,
  onOpenProduct,
  onContinueNextPlatform,
  onRescanPlatform,
  onDeletePlatform,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onClearAllHistory,
  language
}) => {
  const t = getTranslation(language);

  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'platforms' | 'rating'>('newest');

  // Selected IDs for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm delete dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Expanded details per product card
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProductIds(next);
  };

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    let list = [...history];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter((r) => {
        const nameMatch = (r.productName || '').toLowerCase().includes(q);
        const keyMatch = (r.searchKeyword || '').toLowerCase().includes(q);
        const id = r.identifiers || {};
        const upcMatch = (id.upc || '').toLowerCase().includes(q);
        const modelMatch = (id.model || '').toLowerCase().includes(q);
        const wmMatch = (id.walmartNumber || '').toLowerCase().includes(q);
        const asinMatch = (id.amazonNumber || '').toLowerCase().includes(q);
        const tcinMatch = (id.targetNumber || '').toLowerCase().includes(q);
        const costcoMatch = (id.costcoNumber || '').toLowerCase().includes(q);
        return nameMatch || keyMatch || upcMatch || modelMatch || wmMatch || asinMatch || tcinMatch || costcoMatch;
      });
    }

    if (platformFilter !== 'ALL') {
      list = list.filter((r) => {
        const completedPlats = Object.keys(r.platformResults || {});
        return completedPlats.includes(platformFilter);
      });
    }

    list.sort((a, b) => {
      if (sortOption === 'newest') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      if (sortOption === 'oldest') return (a.updatedAt || '').localeCompare(b.updatedAt || '');
      if (sortOption === 'platforms') {
        const countA = Object.keys(a.platformResults || {}).length;
        const countB = Object.keys(b.platformResults || {}).length;
        return countB - countA;
      }
      if (sortOption === 'rating') {
        const rateA = a.summary?.avgRating ?? -1;
        const rateB = b.summary?.avgRating ?? -1;
        return rateB - rateA;
      }
      return 0;
    });

    return list;
  }, [history, searchFilter, platformFilter, sortOption]);

  const toggleSelectAll = () => {
    if (selectedIds.size === processedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedRecords.map((r) => r.productId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExecuteBatchDelete = () => {
    onDeleteMultipleProducts(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBatchConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            {t.historyTitle}
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            {language === 'en'
              ? 'Multi-platform quality sessions saved locally. Re-open any product, continue querying unfinished platforms, or manage channel snapshots.'
              : '多平台质量监控记录保存在本地。可随时恢复完整产品工作区、继续扫描未完成平台或管理各渠道快照。'}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setIsClearAllConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.btnClearAll}</span>
          </button>
        )}
      </div>

      {/* 2. Controls & Filter Bar */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E] flex flex-wrap items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={language === 'en' ? 'Search by product name, UPC, Model, ASIN, WM#...' : '按产品名称、UPC条码、型号、ASIN或货号搜索...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none rounded-xl outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Platform */}
            <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
              <Filter className="h-3.5 w-3.5" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs px-2.5 py-1.5 rounded-xl border-none outline-none font-medium cursor-pointer"
              >
                <option value="ALL">{t.allPlatforms}</option>
                {PLAT_ORDER.map((code) => (
                  <option key={code} value={code}>
                    {PLAT_LABEL[code]}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs px-2.5 py-1.5 rounded-xl border-none outline-none font-medium cursor-pointer"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="oldest">{t.sortOldest}</option>
                <option value="platforms">{language === 'en' ? 'Most Platforms Scanned' : '已完成平台最多'}</option>
                <option value="rating">{language === 'en' ? 'Highest Rating First' : '平均评分由高到低'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 px-4 py-2.5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#007AFF]">
            <CheckSquare className="h-4 w-4" />
            <span>
              {selectedIds.size} {t.selectedRecords}
            </span>
          </div>

          <button
            onClick={() => setIsBatchConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.btnDeleteSelected}</span>
          </button>
        </div>
      )}

      {/* 4. History Product Cards List */}
      {processedRecords.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-12 text-center dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-3">
          <Clock className="h-10 w-10 text-[#8E8E93] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {t.emptyHistoryTitle}
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            {t.emptyHistoryDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] font-medium"
            >
              {selectedIds.size === processedRecords.length ? (
                <CheckSquare className="h-4 w-4 text-[#007AFF]" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>{selectedIds.size === processedRecords.length ? 'Deselect All' : 'Select All'} ({processedRecords.length})</span>
            </button>
            <span>{language === 'en' ? 'Click card to view detailed channel matrix' : '点击产品展开各平台详细数据'}</span>
          </div>

          {processedRecords.map((record) => {
            const isCurrentActive = currentSessionId === record.productId;
            const completedPlats = Object.keys(record.platformResults || {}) as PlatformCode[];
            const uncompletedPlats = PLAT_ORDER.filter((p) => !completedPlats.includes(p));
            const isExpanded = expandedProductIds.has(record.productId);
            const isSelected = selectedIds.has(record.productId);

            return (
              <div
                key={record.productId}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCurrentActive
                    ? 'border-[#007AFF] bg-white dark:bg-[#1C1C1E] shadow-md ring-1 ring-[#007AFF]'
                    : 'border-[#E5E5EA] bg-white dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs hover:border-[#007AFF]/40'
                }`}
              >
                {/* Product Card Main Header */}
                <div className="p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSelectOne(record.productId)}
                        className="mt-0.5 text-[#8E8E93] hover:text-[#007AFF]"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#007AFF]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {record.productName}
                          </h2>

                          {isCurrentActive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                              {t.activeSessionBadge || 'Active Workspace'}
                            </span>
                          )}

                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {completedPlats.length} / {PLAT_ORDER.length} {language === 'en' ? 'Platforms' : '平台已查询'}
                          </span>
                        </div>

                        {/* Identifiers Chips */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E8E93] font-mono">
                          {record.identifiers?.upc && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              UPC: {record.identifiers.upc}
                            </span>
                          )}
                          {record.identifiers?.model && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              Model: {record.identifiers.model}
                            </span>
                          )}
                          {record.identifiers?.walmartNumber && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              WM#: {record.identifiers.walmartNumber}
                            </span>
                          )}
                          {record.identifiers?.amazonNumber && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              ASIN: {record.identifiers.amazonNumber}
                            </span>
                          )}
                          {record.identifiers?.targetNumber && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              TCIN: {record.identifiers.targetNumber}
                            </span>
                          )}
                          {record.identifiers?.costcoNumber && (
                            <span className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded">
                              Costco#: {record.identifiers.costcoNumber}
                            </span>
                          )}
                          <span>· {record.updatedAt || record.startedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Card Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onOpenProduct(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-all shadow-2xs cursor-pointer"
                        title={language === 'en' ? 'Restore full workspace' : '恢复此产品的全部多平台工作区'}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{t.btnRestoreProduct || 'Restore to Workspace'}</span>
                      </button>

                      {uncompletedPlats.length > 0 && (
                        <button
                          onClick={() => onContinueNextPlatform(record, uncompletedPlats[0])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] rounded-xl transition-colors cursor-pointer"
                          title={`${language === 'en' ? 'Scan next channel' : '继续扫描下一个未查询平台'}: ${PLAT_LABEL[uncompletedPlats[0]]}`}
                        >
                          <Play className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{t.btnContinueNextPlatform || 'Scan Next'} ({PLAT_LABEL[uncompletedPlats[0]]})</span>
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmId(record.productId)}
                        className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] rounded-lg transition-colors cursor-pointer"
                        title={t.btnDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Platforms Status Matrix Badges (All 7 Channels) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                    {PLAT_ORDER.map((pCode) => {
                      const res = record.platformResults?.[pCode];
                      const isScanned = !!res;

                      return (
                        <div
                          key={pCode}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                            isScanned
                              ? res.alertStatus === 'ALERT'
                                ? 'border-[#FF3B30]/30 bg-[#FF3B30]/5 text-[#FF3B30]'
                                : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                              : 'border-neutral-200 dark:border-neutral-800 bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/40 text-[#8E8E93]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[11px] truncate">
                              {PLAT_LABEL[pCode]}
                            </span>
                            {isScanned && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePlatform(record.productId, pCode);
                                }}
                                className="opacity-40 hover:opacity-100 hover:text-[#FF3B30]"
                                title={language === 'en' ? `Delete ${PLAT_LABEL[pCode]} data` : `删除 ${PLAT_LABEL[pCode]} 平台数据`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          <div className="mt-1 flex items-baseline justify-between">
                            {isScanned ? (
                              <>
                                <span className={`font-bold text-xs font-mono ${typeof res.rating === 'number' ? '' : 'text-[#8E8E93]'}`}>
                                  {typeof res.rating === 'number' ? `${res.rating.toFixed(1)}★` : (language === 'en' ? 'Not acquired' : '未获取')}
                                </span>
                                <span className="text-[10px] font-mono opacity-80">
                                  {typeof res.reviewCount === 'number' ? `${res.reviewCount} revs` : ''}
                                </span>
                              </>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[11px] text-[#8E8E93]">
                                  {t.statusNotScanned || '未查询'}
                                </span>
                                <button
                                  onClick={() => onContinueNextPlatform(record, pCode)}
                                  className="text-[10px] font-semibold text-[#007AFF] hover:underline"
                                >
                                  + Scan
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bar: Avg Rating, Total Reviews, Key Findings */}
                  {record.summary && (
                    <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-[#8E8E93]">{language === 'en' ? 'Average Rating:' : '多平台平均评分：'}</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono">
                            {record.summary.avgRating !== null ? `${record.summary.avgRating}★` : (language === 'en' ? 'N/A' : '暂无评分')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-[#8E8E93]">{language === 'en' ? 'Total Customer Reviews:' : '总抓取评论数：'}</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono">
                            {record.summary.totalReviews.toLocaleString()}
                          </span>
                        </div>

                        {record.summary.lowRatingPlatforms.length > 0 && (
                          <div className="flex items-center gap-1 text-[#FF3B30] font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>
                              {record.summary.lowRatingPlatforms.length} {language === 'en' ? 'platform(s) below threshold' : '个平台低于警戒阈值'}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(record.productId)}
                        className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? (language === 'en' ? 'Hide Details' : '收起详细') : (language === 'en' ? 'View Channel Trace & Findings' : '查看溯源信息与缺陷结论')}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  )}

                  {/* Expandable Key Findings, Channel Trace, & Complaints (Requirement 8) */}
                  {isExpanded && record.summary && (
                    <div className="mt-3 p-4 rounded-xl bg-[#F2F2F7]/70 dark:bg-[#2C2C2E]/50 space-y-3.5 text-xs border border-neutral-200/50 dark:border-neutral-700/50 animate-fade-in">
                      {/* Channel Traceability Matrix (Requirement 8: sourceUrl, tabId, scannedAt) */}
                      <div>
                        <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] block mb-1.5">
                          {language === 'en' ? 'Channel Verification & Source Traceability:' : '各平台抓取来源与页面追溯：'}
                        </span>
                        <div className="space-y-1.5">
                          {completedPlats.map((pCode) => {
                            const entry = record.platformResults[pCode];
                            if (!entry) return null;
                            const srcUrl = entry.sourceUrl || entry.url;
                            return (
                              <div
                                key={pCode}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#007AFF]">{PLAT_LABEL[pCode]}</span>
                                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                                    {typeof entry.rating === 'number' ? `${entry.rating}★` : (language === 'en' ? 'Not acquired' : '未获取')}
                                    {typeof entry.reviewCount === 'number' ? ` (${entry.reviewCount} revs)` : ''}
                                  </span>
                                  {entry.tabId != null && (
                                    <span className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500 font-mono">
                                      Tab #{entry.tabId}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-neutral-400">
                                    {entry.scannedAt ? new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                {srcUrl && (
                                  <a
                                    href={srcUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#007AFF] hover:underline flex items-center gap-1 font-mono text-[10px] truncate max-w-xs"
                                    title={srcUrl}
                                  >
                                    <span className="truncate">{srcUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 45)}...</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {language === 'en' ? 'Executive Key Findings:' : '跨平台综合质量结论：'}
                        </span>
                        <p className="text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                          {record.summary.keyFindings}
                        </p>
                      </div>

                      {record.summary.complaintBreakdown.length > 0 && (
                        <div>
                          <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {language === 'en' ? 'Complaint Category Breakdown:' : '消费者差评分类分布：'}
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {record.summary.complaintBreakdown.map((item) => (
                              <span
                                key={item.issue}
                                className="px-2 py-1 rounded-lg bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium"
                              >
                                {item.issue}: <b className="font-mono text-[#FF3B30]">{item.count}</b> ({item.percentage}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Single Product Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.confirmDeleteOne}
            </h3>
            <p className="text-xs text-[#8E8E93]">
              {language === 'en'
                ? 'All platform results, reviews, and cross-channel summaries for this product will be permanently removed from your private browser storage.'
                : '该产品的全部平台扫描数据、评论分析与汇总记录将从本地私有存储中永久删除。'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.confirmDeleteBatch}
            </h3>
            <p className="text-xs text-[#8E8E93]">
              {language === 'en'
                ? `You are about to delete ${selectedIds.size} selected products.`
                : `即将删除选中的 ${selectedIds.size} 条产品记录。`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={handleExecuteBatchDelete}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.confirmClearAll}
            </h3>
            <p className="text-xs text-[#8E8E93]">
              {language === 'en'
                ? 'This will wipe all locally stored product sessions and history. Watchlist and settings will not be affected.'
                : '这将清空全部本地保存的产品会话与历史记录。关注产品库和设置不受影响。'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={() => {
                  onClearAllHistory();
                  setIsClearAllConfirmOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
