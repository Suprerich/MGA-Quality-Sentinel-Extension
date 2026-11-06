import React, { useState } from 'react';
import {
  Scan,
  Search,
  Zap,
  RotateCw,
  Clock,
  Download,
  Moon,
  Sun,
  Globe,
  Check,
  ChevronDown,
  Loader2,
  Plus
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';
import { isExtensionRuntime } from '../services/realSearchScanService';

interface TopHeaderProps {
  lastScanTime: string;
  onNewProductSearch: () => void;
  onScanCurrentPage: () => void;
  onOpenSearchScan: () => void;
  onDeepAnalyze: () => void;
  onRefreshDashboard: () => void;
  onOpenInstallModal: () => void;
  isScanning: boolean;
  isDeepScanning: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  lastScanTime,
  onNewProductSearch,
  onScanCurrentPage,
  onOpenSearchScan,
  onDeepAnalyze,
  onRefreshDashboard,
  onOpenInstallModal,
  isScanning,
  isDeepScanning,
  darkMode,
  onToggleDarkMode,
  language,
  onLanguageChange
}) => {
  const t = getTranslation(language);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages: { id: Language; label: string; short: string }[] = [
    { id: 'en', label: 'English', short: 'EN' },
    { id: 'zh-CN', label: '简体中文', short: '简' },
    { id: 'zh-Hant', label: '繁體中文', short: '繁' }
  ];

  const localizedScanTime =
    lastScanTime === 'Not scanned yet'
      ? t.notScannedYet
      : lastScanTime.replace('Today', language === 'en' ? 'Today' : '今日');

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#E5E5EA] bg-[#FFFFFF]/95 backdrop-blur-md dark:border-[#2C2C2E] dark:bg-[#1C1C1E]/95 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-3.5">
        {/* Brand & Last Scan Time */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/MGA_LOGO_6f40ad1b.png"
            alt="MGA Entertainment"
            className="h-11 w-auto object-contain shrink-0 -my-1.5"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.appName}
              </h1>
              <span className="text-xs text-[#8E8E93] hidden lg:inline">
                · {t.appSubtitle}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isExtensionRuntime()
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20'
                }`}
                title={
                  isExtensionRuntime()
                    ? 'Chromium MV3 Extension Runtime'
                    : 'Web Engine Mode'
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isExtensionRuntime() ? 'bg-emerald-500 animate-pulse' : 'bg-[#007AFF]'}`} />
                {isExtensionRuntime() ? t.extensionMode : t.webMode}
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8E8E93] font-mono">
              <Clock className="h-3 w-3 text-[#8E8E93]" />
              <span>{t.lastScan}: {localizedScanTime}</span>
            </div>
          </div>
        </div>

        {/* Top Actions & Language Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 0: New Product Search (Prominent) */}
          <button
            onClick={onNewProductSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-lg transition-all shadow-2xs whitespace-nowrap"
            title={t.btnNewProductSearch}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.btnNewProductSearch}</span>
          </button>

          {/* Action 1: Scan Current Page */}
          <button
            onClick={onScanCurrentPage}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors whitespace-nowrap"
          >
            {isScanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#007AFF]" />
            ) : (
              <Scan className="h-3.5 w-3.5 text-[#007AFF]" />
            )}
            <span>{t.btnScanCurrent}</span>
          </button>

          {/* Action 2: Search & Scan */}
          <button
            onClick={onOpenSearchScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors whitespace-nowrap"
          >
            <Search className="h-3.5 w-3.5 text-[#007AFF]" />
            <span>{t.btnSearchScan}</span>
          </button>

          {/* Action 3: Deep Analyze */}
          <button
            onClick={onDeepAnalyze}
            disabled={isDeepScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            {isDeepScanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            <span>{t.btnDeepAnalyze}</span>
          </button>

          {/* Action 4: Refresh Dashboard */}
          <button
            onClick={onRefreshDashboard}
            title={t.btnRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.btnRefresh}</span>
          </button>

          <div className="h-4 w-px bg-[#E5E5EA] dark:bg-[#3A3A3C] mx-1" />

          {/* Language Selector (Dropdown & Segmented) */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#E5E5EA] dark:border-[#3A3A3C] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-[#007AFF]" />
              <span className="font-sans">
                {languages.find((l) => l.id === language)?.label || 'Language'}
              </span>
              <ChevronDown className="h-3 w-3 text-[#8E8E93]" />
            </button>

            {langMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-xl p-1 z-50 text-xs animate-fade-in"
                onClick={() => setLangMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  {t.langSelect}
                </div>
                {languages.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onLanguageChange(item.id);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      language === item.id
                        ? 'bg-[#007AFF] text-white'
                        : 'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {language === item.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Install Extension Package */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#E5E5EA] dark:border-[#3A3A3C] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#007AFF]" />
            <span className="hidden lg:inline">{t.btnInstallExt}</span>
          </button>

          {/* Theme Switch */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] rounded-lg hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
