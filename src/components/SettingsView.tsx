import React, { useState } from 'react';
import {
  Settings,
  Save,
  Check,
  RotateCcw,
  Sliders,
  Cloud,
  HardDrive,
  FileSpreadsheet,
  Palette,
  LayoutGrid,
  Globe,
  Trash2
} from 'lucide-react';
import { UserPreferences, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  onResetToDefaults: () => void;
  onClearAllLocalData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onResetToDefaults,
  onClearAllLocalData
}) => {
  const [form, setForm] = useState<UserPreferences>(preferences);
  const [saved, setSaved] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);
  const t = getTranslation(form.language || 'en');

  const handleSave = () => {
    onUpdatePreferences(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to delete all local scan data and history?')) {
      if (onClearAllLocalData) onClearAllLocalData();
      setClearedToast(true);
      setTimeout(() => setClearedToast(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-page-title text-[#1D1D1F] dark:text-[#F5F5F7]">
          {t.navSettings}
        </h1>
        <p className="text-body text-[#8E8E93] mt-1">
          {t.settingsSubtitle}
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] p-6 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] shadow-2xs space-y-6">
        {/* Section 1: Display Language Setting */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.langSelect} ({t.settingLanguage})
            </h2>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Select your preferred interface language. Changes persist across sessions in chrome.storage.sync.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { id: 'en' as Language, label: 'English', desc: 'English (US & International)' },
              { id: 'zh-CN' as Language, label: '简体中文', desc: '简体中文界面' },
              { id: 'zh-Hant' as Language, label: '繁體中文', desc: '繁體中文介面' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setForm({ ...form, language: item.id })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  form.language === item.id
                    ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                    : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {item.label}
                  </span>
                  {form.language === item.id && (
                    <Check className="h-3.5 w-3.5 text-[#007AFF]" />
                  )}
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Quality Threshold */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.settingThreshold}
            </h2>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Products whose rating drops below this value trigger automated ALERT flags across the matrix, email tables, and deep review crawlers.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="2.0"
              max="4.8"
              step="0.1"
              value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) })}
              className="w-64 accent-[#007AFF] cursor-pointer"
            />
            <span className="font-mono text-base font-bold text-[#FF3B30] tabular-nums">
              &lt; {form.threshold.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Section 3: Browser Storage Strategy */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.settingSync}
            </h2>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Lightweight preferences (language, benchmark threshold) synchronize via chrome.storage.sync across Chrome &amp; Edge profiles. High-volume review caches and history remain strictly private in chrome.storage.local.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                form.syncPreferences === 'sync_enabled'
                  ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                  : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
              }`}
            >
              <input
                type="radio"
                name="syncPref"
                checked={form.syncPreferences === 'sync_enabled'}
                onChange={() => setForm({ ...form, syncPreferences: 'sync_enabled' })}
                className="mt-0.5 accent-[#007AFF]"
              />
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t.settingSyncProfile}
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  Synchronizes settings &amp; watchlists across signed-in Chromium profiles.
                </div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                form.syncPreferences === 'local_only'
                  ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                  : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
              }`}
            >
              <input
                type="radio"
                name="syncPref"
                checked={form.syncPreferences === 'local_only'}
                onChange={() => setForm({ ...form, syncPreferences: 'local_only' })}
                className="mt-0.5 accent-[#007AFF]"
              />
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t.settingSyncLocal}
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  Keeps all configuration data isolated to this single browser instance.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Default Export Format */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.settingExportFormat}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'excel', label: 'Excel (.xls)', desc: 'Colored workbook' },
              { id: 'csv', label: 'CSV (.csv)', desc: 'Standard spreadsheet' },
              { id: 'email_html', label: 'Outlook HTML', desc: 'Direct paste table' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setForm({ ...form, defaultExportFormat: fmt.id as any })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.defaultExportFormat === fmt.id
                    ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                    : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
                }`}
              >
                <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {fmt.label}
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  {fmt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 5: Theme & Appearance */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.settingTheme}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'system', label: 'System Automatic' },
              { id: 'light', label: 'Apple Light (#F5F5F7)' },
              { id: 'dark', label: 'Dark Mode' }
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setForm({ ...form, theme: th.id as any })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.theme === th.id
                    ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                    : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
                }`}
              >
                <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {th.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 6: Density Mode */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#007AFF]" />
            <h2 className="text-module-title text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.settingDensity}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, densityMode: 'comfortable' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                form.densityMode === 'comfortable'
                  ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                  : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
              }`}
            >
              <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.densityComfortable}
              </div>
              <div className="text-[11px] text-[#8E8E93] mt-0.5">
                Generous Apple whitespace with 44px table rows.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, densityMode: 'compact' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                form.densityMode === 'compact'
                  ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10'
                  : 'border-[#E5E5EA] dark:border-[#2C2C2E]'
              }`}
            >
              <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.densityCompact}
              </div>
              <div className="text-[11px] text-[#8E8E93] mt-0.5">
                Higher information density with 36px table rows.
              </div>
            </button>
          </div>
        </div>

        {/* Section 7: Clear All Personal Local Storage (Requirement 11) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {form.language === 'en' ? 'Personal Local Storage Reset' : form.language === 'zh-Hant' ? '個人本機儲存空間重設' : '个人本地存储空间重置'}
              </div>
              <div className="text-[11px] text-[#8E8E93]">
                {form.language === 'en'
                  ? 'Permanently wipes all locally cached product scans and query history from chrome.storage.local on this browser.'
                  : form.language === 'zh-Hant'
                  ? '將永久清除本瀏覽器上的所有本機快取產品掃描和查詢歷史記錄。'
                  : '将永久清除本浏览器上的所有本地缓存产品扫描和查询历史记录。'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {clearedToast
                  ? (form.language === 'en' ? 'Local Data Cleared!' : '本地数据已清空！')
                  : (form.language === 'en' ? 'Clear All Local Data' : '清空全部本地数据')}
              </span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.btnRestoreDefaults}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saved ? (form.language === 'en' ? 'Saved!' : '已保存！') : t.btnSaveSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
