import React, { useState } from 'react';
import { Mail, Check, RefreshCw, Trash2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { CrossPlatformGroup } from '../types';
import { buildKeyFindings } from '../services/summaryService';

interface ExecutiveSummaryProps {
  groups: CrossPlatformGroup[];
  threshold: number;
  onThresholdChange: (newVal: number) => void;
  focusOnly: boolean;
  onToggleFocusOnly: (val: boolean) => void;
  onCopyEmailTable: () => void;
  onRefresh: () => void;
  onClear: () => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  groups,
  threshold,
  onThresholdChange,
  focusOnly,
  onToggleFocusOnly,
  onCopyEmailTable,
  onRefresh,
  onClear
}) => {
  const [copied, setCopied] = useState(false);
  const bullets = buildKeyFindings(groups, threshold, focusOnly);

  const handleCopy = () => {
    onCopyEmailTable();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Executive Quality Summary &amp; Key Findings</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Automated defect synthesis for QA bulletins, product review meetings, and executive reporting.
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Threshold Selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="text-[11px] text-neutral-500">Threshold:</span>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value) || 4.0)}
              className="w-14 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-1 text-center font-mono text-xs tabular-nums dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Focus Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={focusOnly}
              onChange={(e) => onToggleFocusOnly(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <span className="text-[11px]">Focus &lt; {threshold.toFixed(1)} only</span>
          </label>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-2xs whitespace-nowrap"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" /> : <Mail className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy as Email Table'}</span>
          </button>

          {/* Refresh & Clear */}
          <button
            onClick={onRefresh}
            title="Refresh summary from latest scans"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClear}
            title="Clear tracked products summary"
            className="p-1.5 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bullets List */}
      <div className="mt-3.5">
        <ul className="space-y-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          {bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-[11px] text-neutral-400 dark:border-neutral-800">
        <span>
          {groups.length} total product families tracked across retail portals
        </span>
        <span>
          Format ready for direct paste into Outlook, Teams, or Gmail
        </span>
      </div>
    </div>
  );
};
