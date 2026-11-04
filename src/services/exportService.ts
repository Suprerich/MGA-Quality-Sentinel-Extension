import { ProductItem, Complaint } from '../types';

function escXml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function deepStars(n?: number | null): string {
  if (typeof n !== 'number' || isNaN(n)) return '';
  const f = Math.round(n);
  return '★'.repeat(f) + '☆'.repeat(Math.max(0, 5 - f)) + ` (${n})`;
}

/**
 * Generates styled Microsoft Excel (.xls) file for Deep Review Analysis
 */
export function exportLowRatedExcel(
  products: ProductItem[],
  threshold: number,
  generatedAt: string = new Date().toISOString()
): void {
  let html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>';
  html +=
    '<table border="1"><tr><td style="background:#0F172A;color:#FFFFFF;font-weight:bold;font-size:14px;">MGA Quality Sentinel - Low-Rated Product Deep Analysis Report</td></tr>';
  html += `<tr><td>Generated: ${escXml(generatedAt)} | Alert Threshold: &lt; ${threshold.toFixed(1)}</td></tr></table><br/>`;

  products.forEach((r) => {
    const name = r.name || r.url;
    const ac = r.alertStatus === 'ALERT' ? '#DC2626' : r.alertStatus === 'OK' ? '#16A34A' : '#D97706';

    html += `<table border="1"><tr><td colspan="2" style="background:#1E293B;color:#FFFFFF;font-weight:bold;font-size:13px;">${escXml(name)}</td></tr>`;
    const meta: [string, any][] = [
      ['Retailer', r.retailer],
      ['Avg Rating', r.rating ?? 'N/A'],
      ['Review Count', r.reviewCount ?? 'N/A'],
      ['Alert Threshold', `< ${threshold.toFixed(1)}`],
      ['Alert Status', r.alertStatus],
      ['Main QA Issue', r.mainIssue || 'N/A'],
      ['Issue Breakdown', r.issueBreakdownText || 'N/A'],
      ['Country of Origin', r.countryOfOrigin || 'UNKNOWN'],
      ['URL', r.url]
    ];

    meta.forEach(([k, v]) => {
      const stx = k === 'Alert Status' ? ` style="color:${ac};font-weight:bold"` : '';
      html += `<tr><td style="font-weight:bold;background:#F1F5F9;width:160px;">${escXml(k)}</td><td${stx}>${escXml(v)}</td></tr>`;
    });
    html += '</table>';

    // Reviews breakdown table
    html +=
      '<table border="1"><tr style="background:#F8FAFC;font-weight:bold;"><td>#</td><td>Review Rating</td><td>Sentiment</td><td>Issue Type</td><td>Keywords</td><td>User</td><td>Date</td><td>Complaint Content</td><td>Source URL</td><td>Captured At</td></tr>';

    const complaints = r.complaints || [];
    complaints.forEach((c, i) => {
      const sc = c.sentiment === 'NEGATIVE' ? '#DC2626' : c.sentiment === 'POSITIVE' ? '#16A34A' : '#D97706';
      html += `<tr><td>${i + 1}</td><td style="color:#D97706;font-weight:bold">${escXml(deepStars(c.reviewRating))}</td><td style="color:${sc};font-weight:bold">${escXml(c.sentiment)}</td><td>${escXml(c.issueType)}</td><td>${escXml((c.keywords || []).join(', '))}</td><td>${escXml(c.userTag)}</td><td>${escXml(c.reviewTime)}</td><td>${escXml(c.comment)}</td><td>${escXml(r.url)}</td><td>${escXml(generatedAt)}</td></tr>`;
    });
    html += '</table><br/><br/>';
  });

  html += '</body></html>';

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `low_rated_deep_analysis_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(v: any): string {
  const s = Array.isArray(v) ? v.join(' | ') : String(v ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

export const exportFullCsv = exportProductsCsv;
export function exportProductsCsv(products: ProductItem[]): void {
  const headers = [
    'retailer',
    'walmartNumber',
    'amazonNumber',
    'targetNumber',
    'costcoNumber',
    'upcNumber',
    'modelNumber',
    'alertStatus',
    'rating',
    'reviewCount',
    'countryOfOrigin',
    'mainIssue',
    'issueBreakdownText',
    'name',
    'url',
    'sourceSite',
    'checkedAt'
  ];

  const rows = [headers.join(',')];
  products.forEach((p) => {
    rows.push(headers.map((k) => csvEscape((p as any)[k])).join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mga_quality_rating_overview_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportComplaintsCsv(complaints: Complaint[], productMeta?: Partial<ProductItem>): void {
  const headers = [
    'retailer',
    'productName',
    'rating',
    'alertStatus',
    'complaintIndex',
    'sentiment',
    'issueType',
    'keywords',
    'userTag',
    'reviewTime',
    'comment',
    'sourceUrl',
    'checkedAt'
  ];

  const rows = [headers.join(',')];
  complaints.forEach((c, idx) => {
    const row = {
      retailer: productMeta?.retailer || '',
      productName: productMeta?.name || '',
      rating: productMeta?.rating ?? '',
      alertStatus: productMeta?.alertStatus || '',
      complaintIndex: idx + 1,
      sentiment: c.sentiment,
      issueType: c.issueType,
      keywords: c.keywords,
      userTag: c.userTag,
      reviewTime: c.reviewTime,
      comment: c.comment,
      sourceUrl: productMeta?.url || '',
      checkedAt: productMeta?.checkedAt || new Date().toISOString()
    };
    rows.push(headers.map((k) => csvEscape((row as any)[k])).join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mga_quality_complaints_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
