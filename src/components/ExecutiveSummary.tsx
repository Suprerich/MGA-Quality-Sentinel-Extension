import React, { useState } from 'react';
import { Mail, Check, RefreshCw, Trash2 } from 'lucide-react';
import { CrossPlatformGroup, Language } from '../types';
import { buildKeyFindings } from '../services/summaryService';
import { getTranslation } from '../services/i18n';

interface ExecutiveSummaryProps {
  groups: CrossPlatformGroup[];
  threshold: number;
  onThresholdChange: (newVal: number) => void;
  focusOnly: boolean;
  onToggleFocusOnly: (val: boolean) => void;
  onCopyEmailTable: () => void;
  onRefresh: () => void;
  onClear: () => void;
  language?: Language;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  groups,
  threshold,
  onThresholdChange,
  focusOnly,
  onToggleFocusOnly,
  onCopyEmailTable,
  onRefresh,
  onClear,
  language = 'en'
}) => {
  const [copied, setCopied] = useState(false);
  const t = getTranslation(language);
  const bullets = buildKeyFindings(groups, threshold, focusOnly, language);

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
            <span>{t.findingsTitle}</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'en'
              ? 'Automated defect synthesis for QA bulletins, product review meetings, and executive reporting.'
              : '针对质量周报、产品评审会与管理层汇报的自动化缺陷归纳与关键结论。'}
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Threshold Selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="text-[11px] text-neutral-500">{t.ratingThreshold}:</span>
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
            <span className="text-[11px]">
              {language === 'en' ? `Focus < ${threshold.toFixed(1)} only` : `仅关注 < ${threshold.toFixed(1)}`}
            </span>
          </label>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" /> : <Mail className="h-3.5 w-3.5" />}
            <span>{copied ? (language === 'en' ? 'Copied to Clipboard' : '已复制到剪贴板') : t.btnCopyEmailTable}</span>
          </button>

          {/* Refresh & Clear */}
          <button
            onClick={onRefresh}
            title={language === 'en' ? 'Refresh summary from latest scans' : '刷新结论'}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClear}
            title={language === 'en' ? 'Clear tracked products summary' : '清空当前结论'}
            className="p-1.5 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
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
          {language === 'en'
            ? `${groups.length} total product families tracked across retail portals`
            : `当前追踪 ${groups.length} 个跨渠道商品系列`}
        </span>
        <span>
          {language === 'en'
            ? 'Format ready for direct paste into Outlook, Teams, or Gmail'
            : '格式已就绪，可直接粘贴至 Outlook、Teams 或 Gmail 邮件'}
        </span>
      </div>
    </div>
  );
};
