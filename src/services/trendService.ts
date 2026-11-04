import { ProductTrendEntry, TrendDatabase } from '../types';

const TREND_KEY = 'qc_trend_v1';

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function calculateTrend(snapshots: { d: string; rating: number }[]): {
  delta: number | null;
  direction: 'worsening' | 'improving' | 'stable' | 'unknown';
  first: number | null;
  latest: number | null;
} {
  if (!snapshots || snapshots.length === 0) {
    return { delta: null, direction: 'unknown', first: null, latest: null };
  }
  const first = snapshots[0].rating;
  const latest = snapshots[snapshots.length - 1].rating;
  if (snapshots.length === 1) {
    return { delta: 0, direction: 'stable', first, latest };
  }
  const delta = Number((latest - first).toFixed(2));
  let direction: 'worsening' | 'improving' | 'stable' = 'stable';
  if (delta <= -0.2) direction = 'worsening';
  else if (delta >= 0.2) direction = 'improving';
  return { delta, direction, first, latest };
}

export async function loadTrendDb(): Promise<TrendDatabase> {
  try {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      return new Promise((resolve) => {
        (window as any).chrome.storage.local.get([TREND_KEY], (res: any) => {
          resolve(res?.[TREND_KEY] || {});
        });
      });
    }
  } catch (e) {
    // fallback
  }

  try {
    const raw = localStorage.getItem(TREND_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  return {};
}

export async function saveTrendDb(db: TrendDatabase): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      (window as any).chrome.storage.local.set({ [TREND_KEY]: db });
    }
  } catch (e) {
    // fallback
  }

  try {
    localStorage.setItem(TREND_KEY, JSON.stringify(db));
  } catch (e) {
    // ignore
  }
}

export async function recordTrendSnapshot(
  id: string,
  name: string,
  platform: string,
  rating: number,
  count?: number | null
): Promise<TrendDatabase> {
  if (rating === null || isNaN(rating)) return loadTrendDb();

  const db = await loadTrendDb();
  const entry: ProductTrendEntry = db[id] || { name, plats: {} };
  if (name && name.length > String(entry.name || '').length) {
    entry.name = name;
  }

  const arr = entry.plats[platform] || [];
  const currentDate = today();
  const filtered = arr.filter((x) => x.d !== currentDate);
  filtered.push({ d: currentDate, rating: Number(rating.toFixed(2)), count: count ?? null });
  filtered.sort((a, b) => (a.d < b.d ? -1 : 1));

  // Cap at 24 historical points
  entry.plats[platform] = filtered.slice(-24);
  db[id] = entry;

  await saveTrendDb(db);
  return db;
}

export function exportTrendCsv(db: TrendDatabase): void {
  const rows: (string | number)[][] = [['Product', 'Platform', 'Date', 'Rating', 'ReviewCount']];

  Object.keys(db).forEach((id) => {
    const e = db[id];
    Object.keys(e.plats).forEach((p) => {
      e.plats[p].forEach((x) => {
        rows.push([e.name || id, p, x.d, x.rating, x.count ?? '']);
      });
    });
  });

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rating_trend_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
