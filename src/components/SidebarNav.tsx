import React from 'react';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { NavSection, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertCount: number;
  watchlistCount: number;
  historyCount?: number;
  language: Language;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  alertCount,
  watchlistCount,
  historyCount = 0,
  language
}) => {
  const t = getTranslation(language);

  // Simplified 5 core sections (Requirement 13)
  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      badge: alertCount > 0 ? alertCount : undefined,
      badgeColor: 'bg-[#FF3B30] text-white'
    },
    {
      id: 'search-scan',
      label: t.navSearchScan,
      icon: <Search className="h-4 w-4 shrink-0" />
    },
    {
      id: 'watchlist',
      label: t.navWatchlist,
      icon: <Bookmark className="h-4 w-4 shrink-0" />,
      badge: watchlistCount > 0 ? watchlistCount : undefined,
      badgeColor: 'bg-[#007AFF]/10 text-[#007AFF]'
    },
    {
      id: 'history',
      label: t.navHistory,
      icon: <Clock className="h-4 w-4 shrink-0" />,
      badge: historyCount > 0 ? historyCount : undefined,
      badgeColor: 'bg-[#8E8E93]/15 text-[#8E8E93]'
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: <Settings className="h-4 w-4 shrink-0" />
    }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-[#E5E5EA] bg-[#FFFFFF] dark:border-[#2C2C2E] dark:bg-[#1C1C1E] transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src="/assets/aistudio/MGA_LOGO_6f40ad1b.png"
            alt="MGA Entertainment"
            className={`${collapsed ? 'h-9 w-auto mx-auto' : 'h-11 w-auto -my-1.5'} object-contain shrink-0`}
          />
          {!collapsed && (
            <div className="truncate">
              <div className="text-xs font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] truncate flex items-center gap-1.5">
                <span>Sentinel</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF]">QA</span>
              </div>
              <div className="text-[10px] text-[#8E8E93] truncate font-medium">
                {t.appSubtitle}
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="rounded-lg p-1.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1D1D1F] dark:hover:bg-[#2C2C2E] dark:hover:text-[#F5F5F7] transition-colors"
          title={collapsed ? t.expandSidebar : t.collapseSidebar}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#007AFF] text-white font-semibold shadow-2xs'
                  : 'text-[#1D1D1F] hover:bg-[#F2F2F7] dark:text-[#F5F5F7] dark:hover:bg-[#2C2C2E]'
              }`}
            >
              <span
                className={`${
                  isActive
                    ? 'text-white'
                    : 'text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7]'
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span className="flex-1 truncate text-left">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-[#F2F2F7] text-[#8E8E93] dark:bg-[#2C2C2E]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Badge */}
      <div className="p-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
        {!collapsed ? (
          <div className="rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-2.5 text-[10px] text-[#8E8E93] space-y-0.5">
            <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              <span>Chromium MV3 Extension</span>
            </div>
            <div>WM US/CA · AMZ US/CA · Target</div>
          </div>
        ) : (
          <div className="flex justify-center" title="Chromium MV3 Extension">
            <span className="h-2 w-2 rounded-full bg-[#34C759]" />
          </div>
        )}
      </div>
    </aside>
  );
};
