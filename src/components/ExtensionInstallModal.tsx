import React, { useState } from 'react';
import { X, Download, Check, Chrome, Shield, Terminal, ArrowRight, Loader2 } from 'lucide-react';
import { generateExtensionZip, downloadExtensionZip } from '../services/packagerService';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';

interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  language = 'en'
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const t = getTranslation(language);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const zipBlob = await generateExtensionZip();
      downloadExtensionZip(zipBlob);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to generate extension zip', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/MGA_LOGO_6f40ad1b.png"
              alt="MGA Entertainment"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {language === 'en'
                  ? 'Chrome & Microsoft Edge Extension Installation'
                  : 'Chrome 与 Edge 浏览器插件快速安装'}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Manifest V3 · 100% Local-First Architecture · Shared Chromium Core
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Download CTA Box */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">
                {language === 'en'
                  ? 'Download Unpacked Extension Package (.zip)'
                  : '下载插件安装包 (.zip)'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {language === 'en'
                  ? 'Contains manifest.json, background worker, scanner scripts, and dashboard.'
                  : '包含完整 manifest.json、后台服务脚本、抓取解析引擎与控制台。'}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{downloadSuccess ? (language === 'en' ? 'Downloaded!' : '下载成功！') : (language === 'en' ? 'Download .zip' : '下载安装包 .zip')}</span>
            </button>
          </div>

          {/* 30-Second Installation Steps */}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
              {language === 'en' ? 'Installation Steps (Takes 30 seconds):' : '安装步骤（仅需30秒）：'}
            </h3>

            <ol className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  1
                </span>
                <div>
                  {language === 'en' ? (
                    <>
                      <b>Extract the zip archive</b> to a permanent folder on your computer (e.g. <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[11px]">C:\MGA_Sentinel</code> or <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[11px]">~/Documents/MGA_Sentinel</code>).
                    </>
                  ) : (
                    <>
                      <b>解压下载的 zip 文件</b>到电脑本地固定文件夹（如 <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[11px]">D:\MGA_Sentinel</code> 或“文档”目录）。
                    </>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  2
                </span>
                <div>
                  {language === 'en' ? 'Open your browser extensions manager:' : '在浏览器地址栏打开扩展管理页面：'}
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
                      Chrome: chrome://extensions
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
                      Edge: edge://extensions
                    </span>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  3
                </span>
                <div>
                  {language === 'en' ? (
                    <>Toggle ON <b>&ldquo;Developer mode&rdquo;</b> (top right switch).</>
                  ) : (
                    <>开启右上角的<b>“开发者模式”</b>开关。</>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  4
                </span>
                <div>
                  {language === 'en' ? (
                    <>Click <b>&ldquo;Load unpacked&rdquo;</b> (top left) and select the extracted folder.</>
                  ) : (
                    <>点击左上角<b>“加载已解压的扩展程序”</b>，选择第1步解压的文件夹。</>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  5
                </span>
                <div>
                  {language === 'en' ? (
                    <><b>Done!</b> Pin MGA Quality Sentinel to your browser toolbar. Click the extension icon and select <b>&ldquo;📊 Open Full Quality Dashboard ↗&rdquo;</b> to open this full-screen dashboard with native browser automation!</>
                  ) : (
                    <><b>安装完成！</b>在浏览器工具栏固定插件图标。点击图标并点击<b>“📊 Open Full Quality Dashboard ↗”</b>即可打开全屏控制台开始跨平台监控！</>
                  )}
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-400">
            {language === 'en' ? 'No IT approval or server setup required' : '无需IT审批，无需配置服务器'}
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 rounded-md border border-neutral-200 dark:border-neutral-700 cursor-pointer"
          >
            {t.btnCancel || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
