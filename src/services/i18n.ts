import { Language } from '../types';
import enDict from '../locales/en.json';
import zhCnDict from '../locales/zh-CN.json';
import zhHantDict from '../locales/zh-Hant.json';

export type TranslationDictionary = typeof enDict & {
  // Backward compatibility keys
  kpiLowRating: string;
  kpiBelowThreshold: string;
  kpiPlatforms: string;
  kpiPlatformCoverage: string;
  kpiAlerts: string;
  kpiActiveExceptions: string;
  kpiWatchlist: string;
  kpiTrackedSkus: string;
  kpiTotalScanned: string;
  kpiTotalScannedSubtitle: string;
  lowRatedCountLabel: string;
  execSummaryTitle: string;
  execSummarySubtitle: string;
  alertCenterTitle: string;
  alertCenterSubtitle: string;
  alertCritical: string;
  alertViewAll: string;
  alertLowest: string;
  alertOn: string;
  alertCompliant: string;
  alertNoBreaches: string;
  alertBelowOn: string;
  thresholdLabel: string;
  focusBelowOnly: string;
  copyEmailTable: string;
  copiedClipboard: string;
  totalFamiliesTracked: string;
  formatReadyOutlook: string;
  searchPlaceholder: string;
  filterAll: string;
  filterBelow: string;
  filterCompliant: string;
  exportCsv: string;
  colProductIdent: string;
  colBreachedChannels: string;
  colStatus: string;
  colDetails: string;
  showingGroups: string;
  ofGroups: string;
  groupedLines: string;
  seriesGuardNotice: string;
  complaintAnalyticsTitle: string;
  complaintAnalyticsSubtitle: string;
  viewBarChart: string;
  viewPieChart: string;
  totalIssuesLogged: string;
  criticalDefects: string;
  topComplaintCategory: string;
  channelWithMostIssues: string;
  deepReviewTitle: string;
  deepReviewSubtitle: string;
  deepScanNote: string;
  showingReviewsFor: string;
  trendTrackingTitle: string;
  trendTrackingSubtitle: string;
  skuValidationTitle: string;
  skuValidationSubtitle: string;
  exportsCenterTitle: string;
  exportsCenterSubtitle: string;
  settingThreshold: string;
  settingSync: string;
  settingSyncProfile: string;
  settingSyncLocal: string;
  settingExportFormat: string;
  settingTheme: string;
  settingDensity: string;
  settingLanguage: string;
  densityComfortable: string;
  densityCompact: string;
  btnRestoreDefaults: string;
};

function buildCompatibilityDict(base: typeof enDict, lang: Language): TranslationDictionary {
  const isZhCn = lang === 'zh-CN';
  const isZhHant = lang === 'zh-Hant';

  return {
    ...base,
    kpiLowRating: base.lowRatedItemsLabel,
    kpiBelowThreshold: base.belowThresholdLabel,
    kpiPlatforms: base.monitoredChannelsLabel,
    kpiPlatformCoverage: base.monitoredChannelsCoverage,
    kpiAlerts: base.lowestRatingLabel,
    kpiActiveExceptions: isZhCn ? '全渠道最低评分' : isZhHant ? '全通路最低評分' : 'Lowest Rating Across Channels',
    kpiWatchlist: isZhCn ? '关注产品' : isZhHant ? '關注產品' : 'Watchlist',
    kpiTrackedSkus: isZhCn ? '重点监控 SKU' : isZhHant ? '重點監控 SKU' : 'Tracked SKUs',
    kpiTotalScanned: base.totalScannedLabel,
    kpiTotalScannedSubtitle: base.totalScannedSubtitle,
    lowRatedCountLabel: base.belowThresholdLabel,

    execSummaryTitle: isZhCn ? '质量执行摘要与核心结论' : isZhHant ? '品質執行摘要與核心結論' : 'Executive Quality Summary & Key Findings',
    execSummarySubtitle: isZhCn ? '面向 QA 通报、产品评审会议与高层汇报的自动化缺陷归因总结。' : isZhHant ? '面向 QA 通報、產品評審會議與高層匯報的自動化缺陷歸因總結。' : 'Automated defect synthesis for QA bulletins, product review meetings, and executive reporting.',
    alertCenterTitle: isZhCn ? '预警中心 — 低于警戒值产品' : isZhHant ? '預警中心 — 低於警戒值產品' : 'Alert Center — Products Below Threshold',
    alertCenterSubtitle: isZhCn ? '需立即介入处理的质量异常 · 警戒基准线: <' : isZhHant ? '需立即介入處理的品質異常 · 警戒基準線: <' : 'Immediate QA action required · Benchmark threshold: <',
    alertCritical: isZhCn ? '紧急警戒' : isZhHant ? '緊急警戒' : 'Critical',
    alertViewAll: isZhCn ? '查看全部缺陷预警' : isZhHant ? '查看全部缺陷預警' : 'View All Defect Alerts',
    alertLowest: base.lowestRatingLabel,
    alertOn: isZhCn ? '在' : isZhHant ? '在' : 'on',
    alertCompliant: isZhCn ? '所有监控商品均达到或高于警戒基准线。' : isZhHant ? '所有監控商品均達到或高於警戒基準線。' : 'All monitored products meet or exceed the benchmark.',
    alertNoBreaches: isZhCn ? '所有已监控零售渠道未检测到低于警戒值的低分违规项。' : isZhHant ? '所有已監控零售通路未檢測到低於警戒值的低分違規項。' : 'No active quality breaches detected across monitored retail portals.',
    alertBelowOn: isZhCn ? '以下渠道低于警戒线:' : isZhHant ? '以下通路低於警戒線:' : 'Below threshold on:',

    thresholdLabel: isZhCn ? '警戒阈值:' : isZhHant ? '警戒閾值:' : 'Threshold:',
    focusBelowOnly: isZhCn ? '仅关注低于阈值产品' : isZhHant ? '僅關注低於閾值產品' : 'Focus < threshold only',
    copyEmailTable: base.btnCopyEmailTable,
    copiedClipboard: isZhCn ? '已复制到剪贴板！' : isZhHant ? '已複製到剪貼簿！' : 'Copied to Clipboard!',
    totalFamiliesTracked: isZhCn ? '个核心产品系列覆盖监控' : isZhHant ? '個核心產品系列覆蓋監控' : 'total product families tracked across retail portals',
    formatReadyOutlook: isZhCn ? '格式已优化，可直接粘贴 (Ctrl+V) 至 Outlook、Teams 或网页邮箱' : isZhHant ? '格式已優化，可直接貼上 (Ctrl+V) 至 Outlook、Teams 或網頁信箱' : 'Format ready for direct paste into Outlook, Teams, or Gmail',

    searchPlaceholder: isZhCn ? '搜索产品名称、UPC 或型号...' : isZhHant ? '搜尋產品名稱、UPC 或型號...' : 'Search product name, UPC, or model...',
    filterAll: isZhCn ? '全部商品' : isZhHant ? '全部商品' : 'All',
    filterBelow: isZhCn ? '低于基准线' : isZhHant ? '低於基準線' : 'Below Benchmark',
    filterCompliant: isZhCn ? '达标合格品' : isZhHant ? '達標合格品' : 'Compliant',
    exportCsv: base.btnExportCsv,
    colProductIdent: isZhCn ? '产品标识信息' : isZhHant ? '產品標識資訊' : 'Product Identification',
    colBreachedChannels: isZhCn ? '低于基准渠道' : isZhHant ? '低於基準通路' : 'Channels < Threshold',
    colStatus: base.colAlertStatus,
    colDetails: isZhCn ? '详情' : isZhHant ? '詳情' : 'Details',
    showingGroups: isZhCn ? '当前展示' : isZhHant ? '當前顯示' : 'Showing',
    ofGroups: isZhCn ? '共' : isZhHant ? '共' : 'of',
    groupedLines: isZhCn ? '组系列产品' : isZhHant ? '組系列產品' : 'grouped product lines',
    seriesGuardNotice: isZhCn ? '跨平台系列冲突防护已激活 · 评分严格对比阈值' : isZhHant ? '跨平台系列衝突防護已啟用 · 評分嚴格比對閾值' : 'Cross-platform series conflict prevention active · Ratings strictly checked against threshold',

    complaintAnalyticsTitle: isZhCn ? '消费者差评与缺陷分类' : isZhHant ? '消費者差評與缺陷分類' : 'Complaint Classification',
    complaintAnalyticsSubtitle: isZhCn ? '量化统计缺陷分布、占比权重及各电商通路的特定质量问题。' : isZhHant ? '量化統計缺陷分佈、佔比權重及各電商通路的特定品質問題。' : 'Defect distribution, weighting, and retailer-specific QA breakdowns.',
    viewBarChart: isZhCn ? '柱状图' : isZhHant ? '長條圖' : 'Bar Chart',
    viewPieChart: isZhCn ? '环形图' : isZhHant ? '圓形圖' : 'Pie Chart',
    totalIssuesLogged: isZhCn ? '归因缺陷总数' : isZhHant ? '歸因缺陷總數' : 'Total Issues Logged',
    criticalDefects: isZhCn ? '严重缺陷项' : isZhHant ? '嚴重缺陷項' : 'Critical Defects',
    topComplaintCategory: isZhCn ? '最高频问题分类' : isZhHant ? '最高頻問題分類' : 'Top Complaint Category',
    channelWithMostIssues: isZhCn ? '差评高发电商渠道' : isZhHant ? '差評高發電商通路' : 'Retailer with Most Issues',

    deepReviewTitle: isZhCn ? '深度差评洞察' : isZhHant ? '深度差評洞察' : 'Deep Review Insights',
    deepReviewSubtitle: isZhCn ? '抓取低分商品的原声买家评价，提炼高频痛点词汇。' : isZhHant ? '擷取低分商品的原聲買家評價，提煉高頻痛點詞彙。' : 'Natural customer feedback and recurring quality themes on low-rated items.',
    deepScanNote: isZhCn ? '针对低于警戒值的商品自动抓取真实买家评价。' : isZhHant ? '針對低於警戒值的商品自動擷取真實買家評價。' : 'Auto-crawled customer feedback for items below alert threshold.',
    showingReviewsFor: isZhCn ? '已分析评论：' : isZhHant ? '已分析評論：' : 'Showing reviews for:',

    trendTrackingTitle: isZhCn ? '质量评分趋势追踪' : isZhHant ? '品質評分趨勢追蹤' : 'Quality Trend Tracking',
    trendTrackingSubtitle: isZhCn ? '跟踪产品评分的时序变化，及时捕获批次质量滑坡。' : isZhHant ? '追蹤產品評分的時序變化，及時掌握批次品質滑坡。' : 'Historical rating trajectories across retail platforms.',

    skuValidationTitle: isZhCn ? 'SKU 识别与防误合并校验' : isZhHant ? 'SKU 識別與防誤合併校驗' : 'SKU Validation & Series Guard',
    skuValidationSubtitle: isZhCn ? '依托严格的系列隔离算法，杜绝跨平台产品数据误合并。' : isZhHant ? '依託嚴格的系列隔離演算法，杜絕跨通路產品資料誤合併。' : 'Cross-platform series conflict prevention and barcode verification.',

    exportsCenterTitle: isZhCn ? '数据导出与报告中心' : isZhHant ? '資料匯出與報告中心' : 'Exports & Reporting Center',
    exportsCenterSubtitle: isZhCn ? '集中导出质量分析 Excel 表格、CSV 及报告。' : isZhHant ? '集中匯出品質分析 Excel 表格、CSV 及報告。' : 'Unified download hub for quality workbooks, tables, and reports.',

    settingThreshold: isZhCn ? '质量警戒评分基准线' : isZhHant ? '品質警戒評分基準線' : 'Quality Alert Threshold Benchmark',
    settingSync: isZhCn ? '浏览器跨设备漫游同步 (chrome.storage.sync)' : isZhHant ? '瀏覽器跨裝置漫遊同步 (chrome.storage.sync)' : 'Browser Roaming Sync (chrome.storage.sync)',
    settingSyncProfile: isZhCn ? '浏览器账号自动同步 (推荐)' : isZhHant ? '瀏覽器帳號自動同步 (推薦)' : 'Browser Account Auto-Sync (Recommended)',
    settingSyncLocal: isZhCn ? '仅限本机独立保存 (隐私保护)' : isZhHant ? '僅限本機獨立儲存 (隱私保護)' : 'Local Storage Only (Maximum Privacy)',
    settingExportFormat: isZhCn ? '默认导出文件格式' : isZhHant ? '預設匯出檔案格式' : 'Default Export Format',
    settingTheme: isZhCn ? '界面主题外观' : isZhHant ? '介面主題外觀' : 'Appearance Theme',
    settingDensity: isZhCn ? '信息展示密度' : isZhHant ? '資訊展示密度' : 'Information Density',
    settingLanguage: isZhCn ? '界面显示语言' : isZhHant ? '介面顯示語言' : 'Interface Language',
    densityComfortable: isZhCn ? '标准舒适间距 (推荐)' : isZhHant ? '標準舒適間距 (推薦)' : 'Comfortable (Standard)',
    densityCompact: isZhCn ? '紧凑高密模式' : isZhHant ? '緊湊高密模式' : 'Compact (High Density)',
    btnRestoreDefaults: isZhCn ? '恢复默认设置' : isZhHant ? '恢復預設設定' : 'Reset Defaults'
  };
}

const TRANSLATIONS_MAP: Record<Language, TranslationDictionary> = {
  en: buildCompatibilityDict(enDict, 'en'),
  'zh-CN': buildCompatibilityDict(zhCnDict, 'zh-CN'),
  'zh-Hant': buildCompatibilityDict(zhHantDict, 'zh-Hant')
};

export function getTranslation(lang: Language = 'en'): TranslationDictionary {
  if (lang === 'zh-CN') return TRANSLATIONS_MAP['zh-CN'];
  if (lang === 'zh-Hant' || (lang as any) === 'zh-TW') return TRANSLATIONS_MAP['zh-Hant'];
  return TRANSLATIONS_MAP.en;
}

/**
 * Format dynamic summary findings into the user's selected language.
 * Guarantees that language switching re-renders this text immediately without re-scanning.
 */
export function formatDynamicFindings(params: {
  completedCount: number;
  totalScanned: number;
  totalLowRated: number;
  lowestRating: number | null;
  threshold: number;
  lang: Language;
}): string {
  const { completedCount, totalScanned, totalLowRated, lowestRating, threshold, lang } = params;

  if (completedCount === 0) {
    if (lang === 'zh-CN') return '未开始任何平台查询。';
    if (lang === 'zh-Hant') return '尚未開始任何平台查詢。';
    return 'No retail platform scans initiated yet.';
  }

  if (totalLowRated > 0 && lowestRating !== null) {
    if (lang === 'zh-CN') {
      return `在已查询的 ${completedCount} 个平台中共扫描 ${totalScanned} 个商品，发现 ${totalLowRated} 个低于警戒值 (${threshold.toFixed(1)}) 的低分商品，全网最低评分为 ${lowestRating.toFixed(1)}★。`;
    }
    if (lang === 'zh-Hant') {
      return `在已查詢的 ${completedCount} 個平台中共掃描 ${totalScanned} 個商品，發現 ${totalLowRated} 個低於警戒值 (${threshold.toFixed(1)}) 的低分商品，全通路最低評分為 ${lowestRating.toFixed(1)}★。`;
    }
    return `Scanned ${totalScanned} item(s) across ${completedCount} queried platform(s); detected ${totalLowRated} item(s) strictly below alert threshold (${threshold.toFixed(1)}), with lowest rating at ${lowestRating.toFixed(1)}★.`;
  }

  if (lang === 'zh-CN') {
    return `在已查询的 ${completedCount} 个平台中共扫描 ${totalScanned} 个商品，所有在售商品评分均达到或高于警戒基准线 (${threshold.toFixed(1)})，未发现低分商品。`;
  }
  if (lang === 'zh-Hant') {
    return `在已查詢的 ${completedCount} 個平台中共掃描 ${totalScanned} 個商品，所有在售商品評分均達到或高於警戒基準線 (${threshold.toFixed(1)})，未發現低分商品。`;
  }
  return `Scanned ${totalScanned} item(s) across ${completedCount} queried platform(s); all items meet or exceed quality threshold (${threshold.toFixed(1)}★). No low-rated breaches detected.`;
}

/**
 * Dynamic localized label for QA status badges.
 */
export function getStatusLabel(status: string, lang: Language): string {
  const s = String(status || '').toUpperCase();
  if (s === 'ALERT') {
    if (lang === 'zh-CN') return '警戒 (ALERT)';
    if (lang === 'zh-Hant') return '警戒 (ALERT)';
    return 'ALERT';
  }
  if (s === 'OK' || s === 'PASS') {
    if (lang === 'zh-CN') return '合格 (PASS)';
    if (lang === 'zh-Hant') return '合格 (PASS)';
    return 'PASS';
  }
  if (s.includes('MANUAL') || s.includes('CHECK') || s.includes('REVIEW')) {
    if (lang === 'zh-CN') return '需人工核对';
    if (lang === 'zh-Hant') return '需人工核對';
    return 'MANUAL CHECK';
  }
  return status;
}

/**
 * Dynamic localized label for defect category.
 */
export function getDefectCategoryLabel(issue: string, lang: Language): string {
  const issueLower = String(issue || '').toLowerCase();
  if (issueLower.includes('function')) {
    if (lang === 'zh-CN') return '功能故障';
    if (lang === 'zh-Hant') return '功能故障';
    return 'Function issue';
  }
  if (issueLower.includes('damage') || issueLower.includes('broken')) {
    if (lang === 'zh-CN') return '破损碎裂';
    if (lang === 'zh-Hant') return '破損碎裂';
    return 'Damage';
  }
  if (issueLower.includes('missing')) {
    if (lang === 'zh-CN') return '缺少配件';
    if (lang === 'zh-Hant') return '缺少配件';
    return 'Missing parts';
  }
  if (issueLower.includes('safety') || issueLower.includes('smell') || issueLower.includes('toxic')) {
    if (lang === 'zh-CN') return '安全隐患 / 异味';
    if (lang === 'zh-Hant') return '安全隱患 / 異味';
    return 'Safety concern';
  }
  if (issueLower.includes('packaging')) {
    if (lang === 'zh-CN') return '包装破损';
    if (lang === 'zh-Hant') return '包裝破損';
    return 'Packaging damage';
  }
  if (issueLower.includes('assembly') || issueLower.includes('instruction')) {
    if (lang === 'zh-CN') return '组装与说明困难';
    if (lang === 'zh-Hant') return '組裝與說明困難';
    return 'Assembly / Instruction';
  }
  if (issueLower.includes('mismatch') || issueLower.includes('appearance')) {
    if (lang === 'zh-CN') return '实物与描述不符';
    if (lang === 'zh-Hant') return '實物與描述不符';
    return 'Appearance mismatch';
  }
  if (issueLower.includes('quality')) {
    if (lang === 'zh-CN') return '做工材质欠佳';
    if (lang === 'zh-Hant') return '做工材質欠佳';
    return 'Quality';
  }
  return issue;
}
