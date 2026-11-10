export const COMPARE_STORAGE_KEY = 'compareProducts';
export const COMPARE_EVENT = 'compare:change';
export const COMPARE_MAX = 4;

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(COMPARE_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function getCompareIds(): string[] {
  return readIds();
}

export function isInCompare(id: string): boolean {
  return readIds().includes(id);
}

export interface ToggleCompareResult {
  ids: string[];
  added: boolean;
  /** True when the list is already full and the product was not added. */
  full: boolean;
}

export function toggleCompare(id: string): ToggleCompareResult {
  const ids = readIds();
  if (ids.includes(id)) {
    const next = ids.filter((entry) => entry !== id);
    writeIds(next);
    return { ids: next, added: false, full: false };
  }
  if (ids.length >= COMPARE_MAX) {
    return { ids, added: false, full: true };
  }
  const next = [...ids, id];
  writeIds(next);
  return { ids: next, added: true, full: false };
}

export function removeFromCompare(id: string): string[] {
  const next = readIds().filter((entry) => entry !== id);
  writeIds(next);
  return next;
}

export function clearCompare(): void {
  writeIds([]);
}

/** Subscribe to compare-list changes from this tab or other tabs. */
export function subscribeCompare(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === COMPARE_STORAGE_KEY) listener();
  };
  window.addEventListener(COMPARE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(COMPARE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
