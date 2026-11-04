import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { WatchlistItem, SkuValidationStatus } from '../types';

interface WatchlistViewProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (items: WatchlistItem[]) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  onUpdateWatchlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);

  // Filtered
  const filtered = watchlist.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.upc.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.wm.toLowerCase().includes(q) ||
      item.tcin.toLowerCase().includes(q) ||
      item.asin.toLowerCase().includes(q)
    );
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Product Name', 'UPC', 'Model', 'WM#', 'TCIN', 'ASIN', 'Status', 'Match Source'];
    const rows = [headers.join(',')];

    watchlist.forEach((w) => {
      rows.push(
        [
          `"${w.name.replace(/"/g, '""')}"`,
          `"${w.upc}"`,
          `"${w.model}"`,
          `"${w.wm}"`,
          `"${w.tcin}"`,
          `"${w.asin}"`,
          `"${w.status || 'Active'}"`,
          `"${w.matchSource || 'Internal QA'}"`
        ].join(',')
      );
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mga_watchlist_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import CSV / Text
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      handleParseAndAdd(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleParseAndAdd = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith('#'));
    const newItems: WatchlistItem[] = [];

    lines.forEach((line) => {
      let parts: string[] = [];
      if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes('|')) parts = line.split('|');
      else if (line.includes(',')) parts = line.split(',');
      else parts = [line];

      const p = parts.map((x) => x.replace(/^["']|["']$/g, '').trim());
      if (p[0]) {
        newItems.push({
          name: p[0],
          upc: p[1] || '',
          model: p[2] || '',
          wm: p[3] || '',
          tcin: p[4] || '',
          asin: p[5] || '',
          status: 'Matched',
          matchSource: 'Direct Import'
        });
      }
    });

    if (newItems.length > 0) {
      const updated = [...watchlist, ...newItems];
      onUpdateWatchlist(updated);
      setShowBulkAddModal(false);
      setBulkText('');
    }
  };

  const handleDelete = (index: number) => {
    const updated = watchlist.filter((_, i) => i !== index);
    onUpdateWatchlist(updated);
  };

  const handleStartEdit = (index: number, item: WatchlistItem) => {
    setEditingIndex(index);
    setEditItem({ ...item });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editItem) return;
    const updated = [...watchlist];
    updated[editingIndex] = editItem;
    onUpdateWatchlist(updated);
    setEditingIndex(null);
    setEditItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
            Watchlist Management
          </h1>
          <p className="text-body text-[#8E8E93] mt-1">
            Maintain critical product catalogs, cross-platform barcode references, and automated synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Add Button */}
          <button
            onClick={() => setShowBulkAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Bulk Add SKUs</span>
          </button>

          {/* Import CSV */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5EA] hover:bg-[#F2F2F7] dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:text-[#F5F5F7] rounded-xl transition-colors cursor-pointer whitespace-nowrap">
            <Upload className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>Import CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleImportFile} className="hidden" />
          </label>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#FFFFFF] border border-[#E5E5EA] hover:bg-[#F2F2F7] dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:text-[#F5F5F7] rounded-xl transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search watchlist by Name, UPC, Model, ASIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 sm:w-80 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7] py-1.5 pl-9 pr-3 text-xs dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div className="text-xs text-[#8E8E93] font-mono tabular-nums">
            Showing {filtered.length} of {watchlist.length} monitored SKUs
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] font-semibold text-[#8E8E93] uppercase">
                <th className="py-3 px-4 min-w-[220px]">Product Name</th>
                <th className="py-3 px-3 min-w-[130px]">UPC</th>
                <th className="py-3 px-3 min-w-[100px]">Model #</th>
                <th className="py-3 px-3 min-w-[110px]">Walmart #</th>
                <th className="py-3 px-3 min-w-[100px]">TCIN</th>
                <th className="py-3 px-3 min-w-[110px]">ASIN</th>
                <th className="py-3 px-3 min-w-[100px]">Status</th>
                <th className="py-3 px-3 min-w-[110px]">Match Source</th>
                <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8E8E93]">
                    No monitored SKUs match your query. Click &ldquo;Bulk Add SKUs&rdquo; or &ldquo;Import CSV&rdquo; to add products.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isEditing = editingIndex === idx;

                  if (isEditing && editItem) {
                    return (
                      <tr key={idx} className="bg-[#EBF4FF]/40 dark:bg-[#102A4C]/30">
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={editItem.name}
                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                            className="w-full p-1 border border-[#007AFF] rounded bg-white dark:bg-black text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editItem.upc}
                            onChange={(e) => setEditItem({ ...editItem, upc: e.target.value })}
                            className="w-full p-1 border rounded bg-white dark:bg-black font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editItem.model}
                            onChange={(e) => setEditItem({ ...editItem, model: e.target.value })}
                            className="w-full p-1 border rounded bg-white dark:bg-black font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editItem.wm}
                            onChange={(e) => setEditItem({ ...editItem, wm: e.target.value })}
                            className="w-full p-1 border rounded bg-white dark:bg-black font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editItem.tcin}
                            onChange={(e) => setEditItem({ ...editItem, tcin: e.target.value })}
                            className="w-full p-1 border rounded bg-white dark:bg-black font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editItem.asin}
                            onChange={(e) => setEditItem({ ...editItem, asin: e.target.value })}
                            className="w-full p-1 border rounded bg-white dark:bg-black font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-[#34C759] font-semibold">Active</td>
                        <td className="py-2.5 px-3 text-[#8E8E93]">Manual Edit</td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 rounded bg-[#34C759] text-white hover:bg-[#2FB350]"
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1 rounded bg-[#E5E5EA] text-[#1D1D1F] hover:bg-[#D1D1D6]"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx} className="hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#1D1D1F] dark:text-[#E5E5EA]">
                        {item.upc || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#8E8E93]">
                        {item.model || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#8E8E93]">
                        {item.wm || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#8E8E93]">
                        {item.tcin || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#8E8E93]">
                        {item.asin || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-[#34C759] bg-[#EBF9F1] dark:bg-[#13381B]">
                          {item.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[#8E8E93]">
                        {item.matchSource || 'Internal QAE'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(idx, item)}
                            className="p-1 text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#F2F2F7] rounded"
                            title="Edit SKU"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(idx)}
                            className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#F2F2F7] rounded"
                            title="Delete SKU"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-3">
              <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
                Bulk Add Monitored SKUs
              </h2>
              <button
                onClick={() => setShowBulkAddModal(false)}
                className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93] leading-relaxed">
              Paste lines directly from Excel or CSV. Format: <code className="font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">Name | UPC | Model | WM# | TCIN | ASIN</code>.
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Miniverse Make It Mini LOTR | 035051594238 | 594238 | 6000207908091 | 89984321 | B0D5B7M88X&#10;Rainbow High Fashion Doll | 035051569427 | 569427 | 392019482 | 82194820 | B0859V5R4L"
              className="w-full rounded-xl border border-[#E5E5EA] bg-[#F2F2F7] p-3 text-xs font-mono dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#8E8E93] hover:text-[#1D1D1F]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleParseAndAdd(bulkText)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs"
              >
                Add Items to Watchlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
