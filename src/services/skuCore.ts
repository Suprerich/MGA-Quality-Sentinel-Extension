import { WatchlistItem } from '../types';

const STORE_KEY = 'qc_watchlist_v1';

const STOP = new Set(
  (
    'the a an of for and with to in on at set pack piece pieces toy toys kids kid child ' +
    'children year years age ages plus new official brand edition series exclusive by amp inch cm ' +
    'assorted style styles color colors mga surprise make it mini doll dolls'
  ).split(' ')
);

export function norm(n: string): string {
  return String(n || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(n: string): Set<string> {
  return new Set(
    norm(n)
      .split(' ')
      .filter((w) => w.length >= 3 && !STOP.has(w))
  );
}

export function overlap(a: Set<string>, b: Set<string>): number {
  if (!a || !b || !a.size || !b.size) return 0;
  let i = 0;
  a.forEach((x) => {
    if (b.has(x)) i++;
  });
  return i / Math.min(a.size, b.size);
}

export function distinctive(tks: Set<string>): Set<string> {
  const out = new Set<string>();
  tks.forEach((w) => {
    if (/\d/.test(w) || w.length >= 4) out.add(w);
  });
  return out;
}

export function seriesConflict(a: Set<string>, b: Set<string>): boolean {
  const da = distinctive(a);
  const db = distinctive(b);
  if (!da.size || !db.size) return false;
  let aOnly = false;
  let bOnly = false;
  da.forEach((x) => {
    if (!db.has(x)) aOnly = true;
  });
  db.forEach((x) => {
    if (!da.has(x)) bOnly = true;
  });
  return aOnly && bOnly;
}

export function normId(s?: string): string {
  return String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export interface RecIdentity {
  upc: string;
  model: string;
  wm: string;
  tcin: string;
  asin: string;
  name: string;
  tokens: Set<string>;
}

export function recIdentity(rec: {
  upcNumber?: string;
  upc?: string;
  modelNumber?: string;
  model?: string;
  walmartNumber?: string;
  wm?: string;
  targetNumber?: string;
  tcin?: string;
  amazonNumber?: string;
  asin?: string;
  name?: string;
  productName?: string;
}): RecIdentity {
  const name = rec.name || rec.productName || '';
  return {
    upc: normId(rec.upcNumber || rec.upc),
    model: normId(rec.modelNumber || rec.model),
    wm: normId(rec.walmartNumber || rec.wm),
    tcin: normId(rec.targetNumber || rec.tcin),
    asin: normId(rec.amazonNumber || rec.asin),
    name,
    tokens: tokens(name)
  };
}

/**
 * Parses user input for Watchlist.
 * Supports pipe '|', comma ',', Chinese comma '，', or TAB (copied from Excel).
 * Expected format: Name | UPC | Model | WM# | TCIN | ASIN
 */
export function parseWatchlistText(text: string): WatchlistItem[] {
  const items: WatchlistItem[] = [];
  String(text || '')
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;

      let parts: string[] = [];
      if (t.includes('\t')) {
        parts = t.split('\t');
      } else if (t.includes('|')) {
        parts = t.split('|');
      } else if (t.includes('，')) {
        parts = t.split('，');
      } else if (t.includes(',')) {
        parts = t.split(',');
      } else {
        parts = [t];
      }

      const p = parts.map((x) => x.trim());
      const it: WatchlistItem = {
        name: p[0] || '',
        upc: normId(p[1]),
        model: normId(p[2]),
        wm: normId(p[3]),
        tcin: normId(p[4]),
        asin: normId(p[5])
      };

      if (it.name || it.upc || it.model || it.wm || it.tcin || it.asin) {
        it.tokens = tokens(it.name);
        items.push(it);
      }
    });
  return items;
}

export function watchlistToText(items: WatchlistItem[]): string {
  return (items || [])
    .map((i) => {
      return [i.name || '', i.upc || '', i.model || '', i.wm || '', i.tcin || '', i.asin || '']
        .join(' | ')
        .replace(/(\s*\|\s*)+$/, '');
    })
    .join('\n');
}

export function matchToWatchlist(
  rec: any,
  watchlist: WatchlistItem[]
): { item: WatchlistItem; score: number; by: 'UPC' | 'Model' | 'WM#' | 'TCIN' | 'ASIN' | 'Name' } | null {
  const id = recIdentity(rec);
  if (!watchlist || !watchlist.length) return null;

  for (let i = 0; i < watchlist.length; i++) {
    const w = watchlist[i];
    if (id.upc && w.upc && id.upc === w.upc) return { item: w, score: 1, by: 'UPC' };
  }

  for (let i = 0; i < watchlist.length; i++) {
    const w = watchlist[i];
    if (id.model && w.model && id.model === w.model) return { item: w, score: 1, by: 'Model' };
  }

  for (let i = 0; i < watchlist.length; i++) {
    const w = watchlist[i];
    if (id.wm && w.wm && id.wm === w.wm) return { item: w, score: 1, by: 'WM#' };
    if (id.tcin && w.tcin && id.tcin === w.tcin) return { item: w, score: 1, by: 'TCIN' };
    if (id.asin && w.asin && id.asin === w.asin) return { item: w, score: 1, by: 'ASIN' };
  }

  let best: WatchlistItem | null = null;
  let bestScore = 0;
  for (let i = 0; i < watchlist.length; i++) {
    const w = watchlist[i];
    const wTokens = w.tokens || tokens(w.name);
    if (!wTokens || !wTokens.size) continue;
    if (seriesConflict(id.tokens, wTokens)) continue;
    const ov = overlap(id.tokens, wTokens);
    if (ov > bestScore) {
      bestScore = ov;
      best = w;
    }
  }

  if (best && bestScore >= 0.6) {
    return { item: best, score: bestScore, by: 'Name' };
  }

  return null;
}

export function sameProduct(a: any, b: any): boolean {
  const ia = recIdentity(a);
  const ib = recIdentity(b);

  if (ia.upc && ib.upc) return ia.upc === ib.upc;
  if (ia.model && ib.model) return ia.model === ib.model;
  if (ia.tcin && ib.tcin) return ia.tcin === ib.tcin;
  if (ia.wm && ib.wm) return ia.wm === ib.wm;
  if (ia.asin && ib.asin) return ia.asin === ib.asin;

  if (seriesConflict(ia.tokens, ib.tokens)) return false;
  return overlap(ia.tokens, ib.tokens) >= 0.6;
}

export async function loadWatchlist(): Promise<WatchlistItem[]> {
  try {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      return new Promise((resolve) => {
        (window as any).chrome.storage.local.get([STORE_KEY], (res: any) => {
          const list: WatchlistItem[] = res?.[STORE_KEY] || [];
          resolve(list.map((i) => ({ ...i, tokens: tokens(i.name) })));
        });
      });
    }
  } catch (e) {
    // fallback
  }

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const list: WatchlistItem[] = JSON.parse(raw);
      return list.map((i) => ({ ...i, tokens: tokens(i.name) }));
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function saveWatchlist(items: WatchlistItem[]): Promise<void> {
  const plain = (items || []).map((i) => ({
    name: i.name,
    upc: i.upc,
    model: i.model,
    wm: i.wm,
    tcin: i.tcin,
    asin: i.asin
  }));

  try {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      (window as any).chrome.storage.local.set({ [STORE_KEY]: plain });
    }
  } catch (e) {
    // fallback
  }

  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(plain));
  } catch (e) {
    // ignore
  }
}
