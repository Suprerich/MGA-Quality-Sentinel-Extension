import { SearchHistoryRecord } from '../types';

const SEARCH_HISTORY_KEY = 'mga_search_history_v2';

function hasChromeLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).chrome?.storage?.local);
}

/**
 * Loads the user's private search history from chrome.storage.local.
 * Zero demo/fake data: starts completely empty for a fresh install.
 */
export async function loadSearchHistory(): Promise<SearchHistoryRecord[]> {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([SEARCH_HISTORY_KEY], (res: any) => {
        resolve(res?.[SEARCH_HISTORY_KEY] || []);
      });
    });
  }
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function saveAllHistory(records: SearchHistoryRecord[]): Promise<void> {
  if (hasChromeLocal()) {
    (window as any).chrome.storage.local.set({ [SEARCH_HISTORY_KEY]: records });
  }
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(records));
  } catch (e) {}
}

/**
 * Saves a full, recoverable search and scan session to local storage.
 */
export async function saveSearchRecord(
  record: SearchHistoryRecord
): Promise<SearchHistoryRecord[]> {
  const current = await loadSearchHistory();
  // Filter out any existing record with same ID, prepend new one
  const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 100);
  await saveAllHistory(updated);
  return updated;
}

/**
 * Deletes a single history record by ID.
 */
export async function deleteSearchRecord(recordId: string): Promise<SearchHistoryRecord[]> {
  const current = await loadSearchHistory();
  const updated = current.filter((r) => r.id !== recordId);
  await saveAllHistory(updated);
  return updated;
}

/**
 * Batch deletes multiple records by ID.
 */
export async function deleteMultipleHistoryRecords(
  recordIds: string[]
): Promise<SearchHistoryRecord[]> {
  const idSet = new Set(recordIds);
  const current = await loadSearchHistory();
  const updated = current.filter((r) => !idSet.has(r.id));
  await saveAllHistory(updated);
  return updated;
}

/**
 * Clears all personal search history records.
 */
export async function clearAllHistory(): Promise<SearchHistoryRecord[]> {
  await saveAllHistory([]);
  return [];
}
