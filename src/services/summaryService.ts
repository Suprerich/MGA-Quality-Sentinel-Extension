import { CrossPlatformGroup, PlatformCode, ProductItem, Complaint, WatchlistItem } from '../types';
import { matchToWatchlist, sameProduct } from './skuCore';

export const PLAT_ORDER: PlatformCode[] = ['WMUS', 'WMCA', 'AMZUS', 'AMZCA', 'TARGET'];

export const PLAT_LABEL: Record<PlatformCode, string> = {
  WMUS: 'Walmart US',
  WMCA: 'Walmart CA',
  AMZUS: 'Amazon US',
  AMZCA: 'Amazon CA',
  TARGET: 'Target'
};

export function platFromRetailer(r?: string): PlatformCode | null {
  const str = String(r || '').toLowerCase();
  if (str.includes('walmart') && (str.includes('canada') || str.includes('.ca'))) return 'WMCA';
  if (str.includes('walmart')) return 'WMUS';
  if (str.includes('amazon') && (str.includes('canada') || str.includes('.ca'))) return 'AMZCA';
  if (str.includes('amazon')) return 'AMZUS';
  if (str.includes('target')) return 'TARGET';
  return null;
}

export function platFromUrl(u?: string): PlatformCode | null {
  const str = String(u || '').toLowerCase();
  if (str.includes('walmart.ca')) return 'WMCA';
  if (str.includes('walmart.com')) return 'WMUS';
  if (str.includes('amazon.ca')) return 'AMZCA';
  if (str.includes('amazon.com')) return 'AMZUS';
  if (str.includes('target.com')) return 'TARGET';
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
          amazonNumber: p.amazonNumber
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

const ISSUE_PHRASE: Record<string, string> = {
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

function joinAnd(arr: string[]): string {
  const filtered = arr.filter((x, i) => Boolean(x) && arr.indexOf(x) === i);
  if (filtered.length <= 1) return filtered[0] || '';
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')} and ${filtered[filtered.length - 1]}`;
}

export function buildComplaintPhrase(comps: Complaint[]): string {
  if (!comps.length) return '';
  const m: Record<string, number> = {};
  comps.forEach((c) => {
    if (c.issueType) m[c.issueType] = (m[c.issueType] || 0) + 1;
  });
  const order = Object.keys(m).sort((a, b) => m[b] - m[a]);
  const parts: string[] = [];

  order.forEach((iss) => {
    const phrase = ISSUE_PHRASE[iss] || String(iss).toLowerCase();
    parts.push(phrase);
    const sig = ISSUE_SIGNAL[iss];
    if (sig) {
      for (let i = 0; i < sig.length; i++) {
        if (hasText(comps, sig[i])) {
          parts.push(sig[i]);
          break;
        }
      }
    }
  });

  return joinAnd(parts.slice(0, 5));
}

/**
 * Natural language executive Key Findings (v1.4.0a style)
 */
export function buildKeyFindings(groups: CrossPlatformGroup[], threshold: number, focusOnly = true): string[] {
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
    const phrase = buildComplaintPhrase(qComps);

    if (bp.length) {
      let s = `${g.name} is rated below ${threshold.toFixed(1)} on ${bp.map((p) => PLAT_LABEL[p]).join(', ')}`;
      if (lowest !== null && lowP) {
        s += ` (lowest ${lowest} on ${PLAT_LABEL[lowP]})`;
      }
      s += '. ';
      s += phrase
        ? `Main complaints are related to ${phrase}.`
        : 'No specific quality complaint text captured yet — run Deep Analyze to pull customer reviews.';
      bullets.push(s);
    } else {
      bullets.push(`${g.name}: all monitored platforms maintain ratings at or above ${threshold.toFixed(1)} (Healthy).`);
    }
  });

  if (!bullets.length) {
    bullets.push(
      `No items rated below ${threshold.toFixed(1)} detected in current scans. All monitored products are meeting quality benchmarks.`
    );
  }

  return bullets;
}

export function buildEmailTableHtml(
  groups: CrossPlatformGroup[],
  threshold: number,
  focusOnly = true
): string {
  const rows = groups.filter((g) => (focusOnly ? belowPlatforms(g, threshold).length > 0 : true));
  const head = ['Product Item', ...PLAT_ORDER.map((p) => PLAT_LABEL[p]), `Below ${threshold.toFixed(1)} #`];

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

  const bullets = buildKeyFindings(groups, threshold, focusOnly);
  html += `<div style="margin-top:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><p style="font-size:14px;font-weight:bold;color:#0F172A;margin-bottom:8px;">Executive Key Findings (Focus: Ratings &lt; ${threshold.toFixed(1)})</p><ul style="font-size:13px;color:#334155;line-height:1.6;margin:0 0 16px 20px;padding:0;">${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join('')}</ul><p style="font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:8px;">Generated by MGA Quality Sentinel · Captured at: ${new Date().toLocaleString()} · Rating Threshold: &lt; ${threshold.toFixed(1)}</p></div>`;

  return html;
}

export function buildEmailTablePlain(
  groups: CrossPlatformGroup[],
  threshold: number,
  focusOnly = true
): string {
  const rows = groups.filter((g) => (focusOnly ? belowPlatforms(g, threshold).length > 0 : true));
  const head = ['Item', ...PLAT_ORDER.map((p) => PLAT_LABEL[p]), `Below ${threshold.toFixed(1)}`];
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
  lines.push('Executive Key Findings:');
  buildKeyFindings(groups, threshold, focusOnly).forEach((b) => {
    lines.push(`• ${b}`);
  });
  lines.push('');
  lines.push(`Captured: ${new Date().toLocaleString()} | Threshold < ${threshold.toFixed(1)}`);

  return lines.join('\n');
}
