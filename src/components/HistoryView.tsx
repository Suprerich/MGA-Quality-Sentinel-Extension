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
  Calendar,
  Layers,
  Star
} from 'lucide-react';
import { SearchHistoryRecord, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface HistoryViewProps {
  history: SearchHistoryRecord[];
  onOpenRecord: (record: SearchHistoryRecord) => void;
  onRescanRecord: (record: SearchHistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteMultipleRecords: (ids: string[]) => void;
  onClearAllHistory: () => void;
  language: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onOpenRecord,
  onRescanRecord,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onClearAllHistory,
  language
}) => {
  const t = getTranslation(language);

  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'items' | 'rating'>('newest');

  // Selected IDs for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm delete dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    let list = [...history];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.keyword.toLowerCase().includes(q) ||
          r.platform.toLowerCase().includes(q) ||
          (r.products || []).some((p) => p.name.toLowerCase().includes(q))
      );
    }

    if (platformFilter !== 'ALL') {
      list = list.filter((r) => r.platform.toLowerCase().includes(platformFilter.toLowerCase()));
    }

    list.sort((a, b) => {
      if (sortOption === 'newest') return (b.queryTime || '').localeCompare(a.queryTime || '');
      if (sortOption === 'oldest') return (a.queryTime || '').localeCompare(b.queryTime || '');
      if (sortOption === 'items') return (b.itemsCount || 0) - (a.itemsCount || 0);
      if (sortOption === 'rating') return (a.avgRating || 0) - (b.avgRating || 0);
      return 0;
    });

    return list;
  }, [history, searchFilter, platformFilter, sortOption]);

  const toggleSelectAll = () => {
    if (selectedIds.size === processedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedRecords.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExecuteBatchDelete = () => {
    onDeleteMultipleRecords(Array.from(selectedIds));
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
            {t.historySubtitle}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setIsClearAllConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.btnClearAll}</span>
          </button>
        )}
      </div>

      {/* 2. Controls & Search Bar Card */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-4 shadow-2xs dark:border-[#2C2C2E] dark:bg-[#1C1C1E] flex flex-wrap items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t.searchHistoryPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none rounded-xl outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Platform Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8E8E93]">{t.filterByPlatform}:</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2.5 py-1.5 rounded-lg border-none outline-none font-medium cursor-pointer"
              >
                <option value="ALL">All Platforms</option>
                <option value="Walmart US">Walmart US</option>
                <option value="Walmart Canada">Walmart CA</option>
                <option value="Amazon US">Amazon US</option>
                <option value="Amazon Canada">Amazon CA</option>
                <option value="Target">Target</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#8E8E93]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2.5 py-1.5 rounded-lg border-none outline-none font-medium cursor-pointer"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="oldest">{t.sortOldest}</option>
                <option value="items">{t.sortItemsHigh}</option>
                <option value="rating">{t.sortRatingLow}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Batch Action Bar (Visible when items selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-between text-xs animate-fade-in">
          <span className="font-semibold text-[#007AFF]">
            {selectedIds.size} {t.selectedRecords}
          </span>
          <button
            onClick={() => setIsBatchConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF3B30] text-white font-medium hover:bg-[#D70015] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.btnDeleteSelected}</span>
          </button>
        </div>
      )}

      {/* 4. Empty State when no history records */}
      {history.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#FFFFFF]/50 dark:bg-[#1C1C1E]/50 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8E8E93]/10 text-[#8E8E93]">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {t.emptyHistoryTitle}
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            {t.emptyHistoryDesc}
          </p>
        </div>
      )}

      {/* 5. Records List */}
      {processedRecords.length > 0 && (
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] overflow-hidden shadow-2xs divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
          {/* List Header with Select All */}
          <div className="bg-[#FAFAFC] dark:bg-[#18181A] px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[#8E8E93] hover:text-[#007AFF]"
              >
                {selectedIds.size === processedRecords.length && processedRecords.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-[#007AFF]" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span>Query &amp; Platform</span>
            </div>
            <span>Summary &amp; Actions</span>
          </div>

          {processedRecords.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isConfirming = deleteConfirmId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected ? 'bg-[#007AFF]/5 dark:bg-[#007AFF]/10' : 'hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/40'
                }`}
              >
                {/* Left: Checkbox, Keyword, Platform, Timestamp */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(item.id)}
                    className="mt-0.5 text-[#8E8E93] hover:text-[#007AFF]"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-[#007AFF]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {item.keyword}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {item.platform}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E8E93] font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.queryTime}</span>
                      </span>
                      <span>·</span>
                      <span>{item.itemsCount} products</span>
                      {item.alertCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#FF3B30] font-semibold">
                            {item.alertCount} below threshold
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Action Buttons */}
                <div className="flex items-center gap-4 self-end md:self-auto">
                  {/* Rating Tag */}
                  {item.avgRating !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-[#FF9500] text-[#FF9500]" />
                      <span className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                        {item.avgRating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {isConfirming ? (
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs">
                      <span className="text-[#FF3B30] font-medium">{t.confirmDeleteOne}</span>
                      <button
                        onClick={() => {
                          onDeleteRecord(item.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-0.5 bg-[#FF3B30] text-white rounded font-medium hover:bg-[#D70015]"
                      >
                        {t.btnConfirmDelete}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-medium"
                      >
                        {t.btnCancel}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Open Full Analysis Result */}
                      <button
                        onClick={() => onOpenRecord(item)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 rounded-lg transition-colors"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{t.btnOpenResult}</span>
                      </button>

                      {/* Rescan Button */}
                      <button
                        onClick={() => onRescanRecord(item)}
                        title={t.btnRescan}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.btnRescan}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        title={t.btnDelete}
                        className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Batch Delete */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="rounded-2xl bg-white p-6 dark:bg-[#1C1C1E] max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#FF3B30]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.btnDeleteSelected}
              </h3>
            </div>
            <p className="text-xs text-[#8E8E93] leading-relaxed">
              {t.confirmDeleteBatch} ({selectedIds.size} {t.selectedRecords})
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={handleExecuteBatchDelete}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FF3B30] text-white hover:bg-[#D70015]"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All History */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="rounded-2xl bg-white p-6 dark:bg-[#1C1C1E] max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#FF3B30]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.btnClearAll}
              </h3>
            </div>
            <p className="text-xs text-[#8E8E93] leading-relaxed">
              {t.confirmClearAll}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={() => {
                  onClearAllHistory();
                  setIsClearAllConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FF3B30] text-white hover:bg-[#D70015]"
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
