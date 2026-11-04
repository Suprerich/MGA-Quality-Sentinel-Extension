import React from 'react';
import {
  ShieldAlert,
  Download,
  Mail,
  Sun,
  Moon,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export type ActiveTab = 'matrix' | 'complaints' | 'trends' | 'watchlist' | 'scanner';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  alertCount: number;
  totalProducts: number;
  onCopyEmailTable: () => void;
  onOpenInstallModal: () => void;
  isExtension: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  alertCount,
  totalProducts,
  onCopyEmailTable,
  onOpenInstallModal,
  isExtension
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90 transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity (Apple Minimalist) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                MGA Quality Sentinel
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                · QA/QAE Monitoring Hub
              </span>
            </div>
          </div>
        </div>

        {/* Center: Segmented Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800/80">
          <button
            onClick={() => onTabChange('matrix')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'matrix'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Cross-Platform Matrix
          </button>
          <button
            onClick={() => onTabChange('complaints')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'complaints'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Deep Complaints
          </button>
          <button
            onClick={() => onTabChange('trends')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'trends'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Rating Trends
          </button>
          <button
            onClick={() => onTabChange('watchlist')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'watchlist'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            SKU Watchlist
          </button>
          <button
            onClick={() => onTabChange('scanner')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'scanner'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Scanner Hub
          </button>
        </nav>

        {/* Right: Quick Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Environment Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isExtension ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
            <span>{isExtension ? 'Extension Connected' : 'Local-First Mode'}</span>
          </div>

          {/* Copy Email Table */}
          <button
            onClick={onCopyEmailTable}
            title="Copy formatted summary table for Outlook/Gmail"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 whitespace-nowrap"
          >
            <Mail className="h-3.5 w-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Email Table</span>
          </button>

          {/* Install / Download Extension Package */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-xs whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install Extension</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 gap-1 scrollbar-none">
        <button
          onClick={() => onTabChange('matrix')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Cross-Platform Matrix
        </button>
        <button
          onClick={() => onTabChange('complaints')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'complaints'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Deep Complaints
        </button>
        <button
          onClick={() => onTabChange('trends')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'trends'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Rating Trends
        </button>
        <button
          onClick={() => onTabChange('watchlist')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          SKU Watchlist
        </button>
        <button
          onClick={() => onTabChange('scanner')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'scanner'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Scanner Hub
        </button>
      </div>
    </header>
  );
};
