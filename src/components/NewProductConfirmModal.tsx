import React from 'react';
import { HelpCircle, Save, X, ArrowRight, Layers } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';

interface NewProductConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentProductName: string;
  newProductName?: string;
  language: Language;
}

export const NewProductConfirmModal: React.FC<NewProductConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentProductName,
  newProductName,
  language
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.confirmNewProductTitle}
              </h2>
              <span className="text-[11px] text-[#8E8E93]">
                {t.switchProductPrompt || 'Product Switch Confirmation'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#1D1D1F] dark:text-[#F5F5F7] text-sm leading-relaxed">
            {t.confirmNewProductDesc}
          </p>

          <div className="p-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-2 border border-neutral-200/60 dark:border-neutral-700/60">
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>{language === 'en' ? 'Current Product (Saving to History):' : '当前产品（自动归档至历史）：'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Auto Save</span>
            </div>
            <div className="font-semibold text-xs text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
              {currentProductName || 'Active Product'}
            </div>

            {newProductName && (
              <>
                <div className="pt-1 border-t border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center gap-1.5 text-[11px] text-[#007AFF] font-medium">
                  <ArrowRight className="h-3 w-3" />
                  <span>{language === 'en' ? 'Next Product to Scan:' : '接下来查询的产品：'} {newProductName}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-[#8E8E93] leading-relaxed">
            {language === 'en'
              ? 'Watchlist, settings, and all past history will be preserved. You can re-open this product from History at any time.'
              : '关注产品库（Watchlist）、配置与全部历史记录均会妥善保存。您随时可以在“查询历史”中重新恢复并继续扫描该产品。'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/30 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-white hover:bg-[#F2F2F7] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-xl transition-colors cursor-pointer"
          >
            {t.btnCancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{t.btnSaveAndStartNew}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
