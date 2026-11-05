import { ProductSession, SearchHistoryRecord } from '../types';
import {
  loadProductHistory,
  saveProductToHistory,
  deleteProductFromHistory,
  deleteMultipleProducts,
  clearAllProductHistory,
  deletePlatformFromProduct
} from './sessionService';

export {
  loadProductHistory,
  saveProductToHistory,
  deleteProductFromHistory,
  deleteMultipleProducts,
  clearAllProductHistory,
  deletePlatformFromProduct
};

/**
 * Backward compatibility wrapper for SearchHistoryRecord
 */
export async function loadSearchHistory(): Promise<SearchHistoryRecord[]> {
  const products = await loadProductHistory();
  return products.map(sessionToLegacyHistory);
}

export async function saveSearchRecord(record: SearchHistoryRecord): Promise<SearchHistoryRecord[]> {
  const current = await loadSearchHistory();
  return [record, ...current.filter((r) => r.id !== record.id)];
}

export async function deleteSearchRecord(recordId: string): Promise<SearchHistoryRecord[]> {
  await deleteProductFromHistory(recordId);
  return await loadSearchHistory();
}

export async function deleteMultipleHistoryRecords(recordIds: string[]): Promise<SearchHistoryRecord[]> {
  await deleteMultipleProducts(recordIds);
  return await loadSearchHistory();
}

export async function clearAllHistory(): Promise<SearchHistoryRecord[]> {
  await clearAllProductHistory();
  return [];
}

export function sessionToLegacyHistory(session: ProductSession): SearchHistoryRecord {
  const completedPlats = Object.keys(session.platformResults || {}) as import('../types').PlatformCode[];
  const allProds = completedPlats.flatMap((p) => session.platformResults[p]?.products || []);

  return {
    id: session.productId,
    keyword: session.searchKeyword || session.productName,
    platform: completedPlats.join(', ') || 'Multi-Platform',
    threshold: 4.0,
    maxResults: 50,
    includeReviews: true,
    queryTime: session.updatedAt || session.startedAt,
    itemsCount: allProds.length,
    alertCount: session.summary?.alertCount || 0,
    avgRating: session.summary?.avgRating ?? null,
    products: allProds,
    complaints: session.complaints || [],
    groups: [],
    deepResults: session.deepResults || [],
    keywordSummary: []
  };
}
