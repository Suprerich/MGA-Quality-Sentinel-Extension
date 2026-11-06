import { CrossPlatformGroup, PlatformCode, ProductItem, Complaint, WatchlistItem, Language } from '../types';
import { matchToWatchlist, sameProduct } from './skuCore';

export const PLAT_ORDER: PlatformCode[] = ['WMUS', 'WMCA', 'AMZUS', 'AMZCA', 'TARGET', 'COSTCOUS', 'COSTCOCA'];

export const PLAT_LABEL: Record<PlatformCode, string> = {
  WMUS: 'Walmart US',
  WMCA: 'Walmart CA',
  AMZUS: 'Amazon US',
  AMZCA: 'Amazon CA',
  TARGET: 'Target',
  COSTCOUS: 'Costco US',
  COSTCOCA: 'Costco CA'
};

export function platFromRetailer(r?: string): PlatformCode | null {
  const str = String(r || '').toLowerCase();
  if (str.includes('walmart') && (str.includes('canada') || str.includes('.ca'))) return 'WMCA';
  if (str.includes('walmart')) return 'WMUS';
  if (str.includes('amazon') && (str.includes('canada') || str.includes('.ca'))) return 'AMZCA';
  if (str.includes('amazon')) return 'AMZUS';
  if (str.includes('target')) return 'TARGET';
  if (str.includes('costco') && (str.includes('canada') || str.includes('.ca') || str.includes(' ca'))) return 'COSTCOCA';
  if (str.includes('costco')) return 'COSTCOUS';
  return null;
}

export function platFromUrl(u?: string): PlatformCode | null {
  const str = String(u || '').toLowerCase();
  if (str.includes('walmart.ca')) return 'WMCA';
  if (str.includes('walmart.com')) return 'WMUS';
  if (str.includes('amazon.ca')) return 'AMZCA';
  if (str.includes('amazon.com')) return 'AMZUS';
  if (str.includes('target.com')) return 'TARGET';
  if (str.includes('costco.ca')) return 'COSTCOCA';
  if (str.includes('costco.com')) return 'COSTCOUS';
  return null;
}

export function groupProducts(
  products: ProductItem[],
  watchlist: WatchlistItem[] = []
): CrossPlatformGroup[] {
  const groups: CrossPlatformGroup[] = [];

  function findGroup(rec: any): CrossPlatformGroup | null {
    if (watchlist && watchlist.length) {
      const m = matchToWatchlist(rec, watchlist);
      if (m) {
        for (let i = 0; i < groups.length; i++) {
          if (groups[i]._wl === m.item.name) return groups[i];
        }
      }
    }
    for (let j = 0; j < groups.length; j++) {
      if (groups[j]._wl) continue;
      if (sameProduct(rec, groups[j]._probe)) return groups[j];
    }
    return null;
  }

  products.forEach((p) => {
    const platform = p.platform || platFromRetailer(p.retailer) || platFromUrl(p.url);
    if (!platform || (!p.name && !p.url)) return;

    let g = findGroup(p);
    if (!g) {
      g = {
        id: `group-${groups.length + 1}`,
        name: p.name || '',
        upc: p.upcNumber || '',
        model: p.modelNumber || '',
        platforms: {},
        complaints: [],
        _seen: {},
        _probe: {
          name: p.name,
          upcNumber: p.upcNumber,
          modelNumber: p.modelNumber,
          walmartNumber: p.walmartNumber,
          targetNumber: p.targetNumber,
          amazonNumber: p.amazonNumber,
          costcoNumber: p.costcoNumber
        },
        _wl: null
      };

      if (watchlist && watchlist.length) {
        const m = matchToWatchlist(p, watchlist);
        if (m) {
          g._wl = m.item.name;
          g.name = m.item.name;
        }
      }
      groups.push(g);
    }

    if (p.upcNumber && !g.upc) g.upc = p.upcNumber;
    if (p.modelNumber && !g.model) g.model = p.modelNumber;
    if (!g._wl && p.name && p.name.length > g.name.length) g.name = p.name;

    if (p.rating !== null || !g.platforms[platform]) {
      g.platforms[platform] = {
        rating: p.rating,
        count: p.reviewCount,
        url: p.url || ''
      };
    }

    (p.complaints || []).forEach((c) => {
      if (!c.comment) return;
      const key = `${platform}|${String(c.comment).slice(0, 120)}`;
      if (g!._seen[key]) return;
      g!._seen[key] = 1;
      g!.complaints.push({ ...c, platform });
    });
  });

  return groups;
}

export function belowPlatforms(g: CrossPlatformGroup, threshold: number): PlatformCode[] {
  return PLAT_ORDER.filter((p) => {
    const c = g.platforms[p];
    return c && c.rating !== null && c.rating < threshold;
  });
}

const QUALITY_CATEGORIES = new Set([
  'Safety',
  'Function issue',
  'Missing parts',
  'Damage',
  'Quality',
  'Packaging',
  'Assembly / Instruction',
  'Size / Appearance mismatch'
]);

export function getQualityNegativeComplaints(g: CrossPlatformGroup): Complaint[] {
  return (g.complaints || []).filter((c) => {
    const star = typeof c.reviewRating === 'number' ? c.reviewRating : null;
    const lowStar = star !== null && star <= 2;
    const isQ = QUALITY_CATEGORIES.has(c.issueType);
    const neg = c.sentiment === 'NEGATIVE';
    return lowStar || ((isQ || neg) && star === null) || (isQ && neg);
  });
}

const ISSUE_PHRASE_EN: Record<string, string> = {
  'Function issue': 'function issues',
  Damage: 'broken parts',
  Quality: 'quality concerns',
  'Missing parts': 'missing parts',
  Safety: 'safety concerns',
  Packaging: 'packaging damage',
  'Assembly / Instruction': 'assembly difficulty',
  'Size / Appearance mismatch': 'items not as described',
  Delivery: 'delivery problems',
  Value: 'value-for-money concerns'
};

const ISSUE_PHRASE_ZH_CN: Record<string, string> = {
  'Function issue': '功能故障',
  Damage: '部件破损',
  Quality: '做工与材质问题',
  'Missing parts': '配件缺失',
  Safety: '安全隐患/气味',
  Packaging: '外包装破损',
  'Assembly / Instruction': '组装与说明书困难',
  'Size / Appearance mismatch': '实物与描述不符',
  Delivery: '物流配送问题',
  Value: '性价比不符'
};

const ISSUE_PHRASE_ZH_HANT: Record<string, string> = {
  'Function issue': '功能故障',
  Damage: '部件破損',
  Quality: '做工與材質問題',
  'Missing parts': '配件缺失',
  Safety: '安全隱患/氣味',
  Packaging: '外包裝破損',
  'Assembly / Instruction': '組裝與說明書困難',
  'Size / Appearance mismatch': '實物與描述不符',
  Delivery: '物流配送問題',
  Value: '性價比不符'
};

const ISSUE_SIGNAL: Record<string, string[]> = {
  'Function issue': ['not working', 'stopped working', "doesn't work", "won't turn on", 'turns off', 'curing'],
  Damage: ['broken', 'cracked', 'snapped'],
  Quality: ['cheap', 'flimsy', 'peeling', 'poor quality'],
  Safety: ['chemical smell', 'strong smell', 'toxic', 'burn', 'choking']
};

function hasText(comps: Complaint[], kw: string): boolean {
  for (let i = 0; i < comps.length; i++) {
    if (String(comps[i].comment || '').toLowerCase().includes(kw.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function joinPhrases(arr: string[], lang: Language = 'en'): string {
  const filtered = arr.filter((x, i) => Boolean(x) && arr.indexOf(x) === i);
  if (filtered.length <= 1) return filtered[0] || '';
  if (lang === 'zh-CN' || lang === 'zh-Hant') {
    return filtered.join('、');
  }
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')} and ${filtered[filtered.length - 1]}`;
}

export function buildComplaintPhrase(comps: Complaint[], lang: Language = 'en'): string {
  if (!comps.length) return '';
  const m: Record<string, number> = {};
  comps.forEach((c) => {
    if (c.issueType) m[c.issueType] = (m[c.issueType] || 0) + 1;
  });
  const order = Object.keys(m).sort((a, b) => m[b] - m[a]);
  const parts: string[] = [];

  const phraseMap = lang === 'zh-CN' ? ISSUE_PHRASE_ZH_CN : lang === 'zh-Hant' ? ISSUE_PHRASE_ZH_HANT : ISSUE_PHRASE_EN;

  order.forEach((iss) => {
    const phrase = phraseMap[iss] || String(iss).toLowerCase();
    parts.push(phrase);
    if (lang === 'en') {
      const sig = ISSUE_SIGNAL[iss];
      if (sig) {
        for (let i = 0; i < sig.length; i++) {
          if (hasText(comps, sig[i])) {
            parts.push(sig[i]);
            break;
          }
        }
      }
    }
  });

  return joinPhrases(parts.slice(0, 5), lang);
}

/**
 * Natural language executive Key Findings
 */
export function buildKeyFindings(
  groups: CrossPlatformGroup[],
  threshold: number,
  focusOnly = true,
  lang: Language = 'en'
): string[] {
  const rows = groups.filter((g) => (focusOnly ? belowPlatforms(g, threshold).length > 0 : true));
  const bullets: string[] = [];

  rows.forEach((g) => {
    const bp = belowPlatforms(g, threshold);
    if (focusOnly && !bp.length) return;

    let lowest: number | null = null;
    let lowP: PlatformCode | null = null;

    PLAT_ORDER.forEach((p) => {
      const c = g.platforms[p];
      if (c && c.rating !== null && (lowest === null || c.rating < lowest)) {
        lowest = c.rating;
        lowP = p;
      }
    });

    const qComps = getQualityNegativeComplaints(g);
    const phrase = buildComplaintPhrase(qComps, lang);

    if (bp.length) {
      if (lang === 'zh-CN') {
        let s = `${g.name} 在 ${bp.map((p) => PLAT_LABEL[p]).join('、')} 评分低于警戒值 ${threshold.toFixed(1)}`;
        if (lowest !== null && lowP) {
          s += `（${PLAT_LABEL[lowP]} 最低 ${lowest}）`;
        }
        s += '。';
        s += phrase
          ? `主要投诉集中在：${phrase}。`
          : '尚未抓取到具体负面评论文本，可运行深度分析以获取顾客评论。';
        bullets.push(s);
      } else if (lang === 'zh-Hant') {
        let s = `${g.name} 在 ${bp.map((p) => PLAT_LABEL[p]).join('、')} 評分低於警戒值 ${threshold.toFixed(1)}`;
        if (lowest !== null && lowP) {
          s += `（${PLAT_LABEL[lowP]} 最低 ${lowest}）`;
        }
        s += '。';
        s += phrase
          ? `主要投訴集中在：${phrase}。`
          : '尚未抓取到具體負面評論文本，可執行深度分析以獲取顧客評論。';
        bullets.push(s);
      } else {
        let s = `${g.name} is rated below ${threshold.toFixed(1)} on ${bp.map((p) => PLAT_LABEL[p]).join(', ')}`;
        if (lowest !== null && lowP) {
          s += ` (lowest ${lowest} on ${PLAT_LABEL[lowP]})`;
        }
        s += '. ';
        s += phrase
          ? `Main complaints are related to ${phrase}.`
          : 'No specific quality complaint text captured yet — run Deep Analyze to pull customer reviews.';
        bullets.push(s);
      }
    } else {
      if (lang === 'zh-CN') {
        bullets.push(`${g.name}：所有监控平台评分均达到或高于警戒值 ${threshold.toFixed(1)}（健康）。`);
      } else if (lang === 'zh-Hant') {
        bullets.push(`${g.name}：所有監控平台評分均達到或高於警戒值 ${threshold.toFixed(1)}（健康）。`);
      } else {
        bullets.push(`${g.name}: all monitored platforms maintain ratings at or above ${threshold.toFixed(1)} (Healthy).`);
      }
    }
  });

  if (!bullets.length) {
    if (lang === 'zh-CN') {
      bullets.push(`当前扫描中未发现评分低于 ${threshold.toFixed(1)} 的商品。所有监控产品均符合质量基准。`);
    } else if (lang === 'zh-Hant') {
      bullets.push(`當前掃描中未發現評分低於 ${threshold.toFixed(1)} 的商品。所有監控產品均符合質量基準。`);
    } else {
      bullets.push(
        `No items rated below ${threshold.toFixed(1)} detected in current scans. All monitored products are meeting quality benchmarks.`
      );
    }
  }

  return bullets;
}

export function buildEmailTableHtml(
  groups: CrossPlatformGroup[],
  threshold: number,
  focusOnly = true,
  lang: Language = 'en'
): string {
  const rows = groups.filter((g) => (focusOnly ? belowPlatforms(g, threshold).length > 0 : true));
  const productLabel = lang === 'zh-CN' ? '商品 / 规格' : lang === 'zh-Hant' ? '商品 / 規格' : 'Product Item';
  const belowColLabel = lang === 'zh-CN' ? `低于 ${threshold.toFixed(1)} 平台数` : lang === 'zh-Hant' ? `低於 ${threshold.toFixed(1)} 平台數` : `Below ${threshold.toFixed(1)} #`;
  const head = [productLabel, ...PLAT_ORDER.map((p) => PLAT_LABEL[p]), belowColLabel];

  let html = `<table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;width:100%;max-width:960px;">`;
  html += `<tr style="background:#0F172A;color:#FFFFFF;text-align:left;">${head.map((c, i) => `<th style="padding:8px 12px;${i > 0 ? 'text-align:center;' : ''}">${c}</th>`).join('')}</tr>`;

  rows.forEach((g) => {
    const bp = belowPlatforms(g, threshold);
    html += `<tr><td style="padding:8px 12px;font-weight:600;color:#0F172A;">${g.name}${g.upc ? `<div style="font-size:11px;color:#64748B;font-weight:normal;">UPC: ${g.upc}</div>` : ''}</td>`;
    PLAT_ORDER.forEach((p) => {
      const c = g.platforms[p];
      const below = c && c.rating !== null && c.rating < threshold;
      const text = c && c.rating !== null ? `${c.rating}${c.count !== null ? ` (${c.count.toLocaleString()})` : ''}` : 'N/A';
      html += `<td align="center" style="padding:8px 12px;${below ? 'color:#DC2626;font-weight:bold;background:#FEF2F2;' : 'color:#334155;'}">${text}</td>`;
    });
    html += `<td align="center" style="padding:8px 12px;font-weight:bold;${bp.length > 0 ? 'color:#DC2626;' : 'color:#16A34A;'}">${bp.length}</td></tr>`;
  });
  html += '</table>';

  const bullets = buildKeyFindings(groups, threshold, focusOnly, lang);
  const findingsTitle = lang === 'zh-CN'
    ? `管理层核心结论（警戒阈值 < ${threshold.toFixed(1)}）`
    : lang === 'zh-Hant'
    ? `管理層核心結論（警戒閾值 < ${threshold.toFixed(1)}）`
    : `Executive Key Findings (Focus: Ratings < ${threshold.toFixed(1)})`;
  const footerNote = lang === 'zh-CN'
    ? `由 MGA Quality Sentinel 自动生成 · 生成时间：${new Date().toLocaleString()} · 警戒阈值：< ${threshold.toFixed(1)}`
    : lang === 'zh-Hant'
    ? `由 MGA Quality Sentinel 自動生成 · 生成時間：${new Date().toLocaleString()} · 警戒閾值：< ${threshold.toFixed(1)}`
    : `Generated by MGA Quality Sentinel · Captured at: ${new Date().toLocaleString()} · Rating Threshold: < ${threshold.toFixed(1)}`;

  html += `<div style="margin-top:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><p style="font-size:14px;font-weight:bold;color:#0F172A;margin-bottom:8px;">${findingsTitle}</p><ul style="font-size:13px;color:#334155;line-height:1.6;margin:0 0 16px 20px;padding:0;">${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join('')}</ul><p style="font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:8px;">${footerNote}</p></div>`;

  return html;
}

export function buildEmailTablePlain(
  groups: CrossPlatformGroup[],
  threshold: number,
  focusOnly = true,
  lang: Language = 'en'
): string {
  const rows = groups.filter((g) => (focusOnly ? belowPlatforms(g, threshold).length > 0 : true));
  const productLabel = lang === 'zh-CN' ? '商品' : lang === 'zh-Hant' ? '商品' : 'Item';
  const belowColLabel = lang === 'zh-CN' ? `低于 ${threshold.toFixed(1)}` : lang === 'zh-Hant' ? `低於 ${threshold.toFixed(1)}` : `Below ${threshold.toFixed(1)}`;
  const head = [productLabel, ...PLAT_ORDER.map((p) => PLAT_LABEL[p]), belowColLabel];
  const lines = [head.join('\t')];

  rows.forEach((g) => {
    const r = [g.name];
    PLAT_ORDER.forEach((p) => {
      const c = g.platforms[p];
      r.push(c && c.rating !== null ? `${c.rating}${c.count !== null ? ` (${c.count})` : ''}` : 'N/A');
    });
    r.push(String(belowPlatforms(g, threshold).length));
    lines.push(r.join('\t'));
  });

  lines.push('');
  lines.push(lang === 'zh-CN' ? '核心质量结论：' : lang === 'zh-Hant' ? '核心質量結論：' : 'Executive Key Findings:');
  buildKeyFindings(groups, threshold, focusOnly, lang).forEach((b) => {
    lines.push(`• ${b}`);
  });
  lines.push('');
  lines.push(
    lang === 'zh-CN'
      ? `生成时间：${new Date().toLocaleString()} | 警戒阈值 < ${threshold.toFixed(1)}`
      : lang === 'zh-Hant'
      ? `生成時間：${new Date().toLocaleString()} | 警戒閾值 < ${threshold.toFixed(1)}`
      : `Captured: ${new Date().toLocaleString()} | Threshold < ${threshold.toFixed(1)}`
  );

  return lines.join('\n');
}
