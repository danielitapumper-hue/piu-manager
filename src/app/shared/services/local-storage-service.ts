import { Injectable, signal } from '@angular/core';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';

const LOCAL_STORAGE_SAVED_FILTERS_KEY = 'savedFilters';
const LOCAL_STORAGE_LAST_FILTER_KEY = 'lastFilter';
const LOCAL_STORAGE_GEMINI_API_KEY = 'gemini_api_key';

const DEFAULT_FILTER: SearchFilters = {
  chartType: 'Single',
  filter: '',
  level: 2,
  songTypes: [true],
  stagePass: null
};

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  lastFilter = signal<SearchFilters>(this.getLastFilter());
  savedFilters = signal<Map<string, TierListWithScore[]>>(this.getSavedFiltersFromLocalStorage());
  geminiApiKey = signal<string>(this.getLocalStorageGeminiApiKey());

  /* GET */
  getTierListByScoresFromLocalStorage(charTypeLevelKey: string): TierListWithScore[] {
    const charTypeLevelFilter = this.charTypeLevelKeyToSearchFilter(charTypeLevelKey);
    this.lastFilter.update(currentValue => ({
      ...currentValue,
      chartType: charTypeLevelFilter.chartType,
      level: charTypeLevelFilter.level
    }));

    // Persiste el lastFilter actualizado como JSON
    this.persistLastFilter(this.lastFilter());

    // charTypeLevelKey es la key del Map de savedFilters (formato chartType-level)
    return this.savedFilters().get(charTypeLevelKey) ?? [];
  }

  /* SET */
  setLocalStorageSavedFilters(charTypeLevelKey: string, data: TierListWithScore[], onlyUpdate?: boolean) {
    if (onlyUpdate && !this.savedFilters().get(charTypeLevelKey))
      return;

    this.savedFilters.update(currentValue => {
      const updatedFilters = new Map(currentValue);
      updatedFilters.set(charTypeLevelKey, data);
      return updatedFilters;
    });

    localStorage.setItem(LOCAL_STORAGE_SAVED_FILTERS_KEY, JSON.stringify(Array.from(this.savedFilters().entries())));
  }

  setLocalStorageLastFilter(searchFilters: SearchFilters) {
    this.lastFilter.set(searchFilters);
    this.persistLastFilter(searchFilters);
  }

  setLocalStorageLastSongTypesFilter(songTypes: boolean[]) {
    this.lastFilter.update(currentValue => ({ ...currentValue, songTypes }));
    this.persistLastFilter(this.lastFilter());
  }

  setLocalStorageLastStagePassFilter(stagePass: boolean | null) {
    this.lastFilter.update(currentValue => ({ ...currentValue, stagePass }));
    this.persistLastFilter(this.lastFilter());
  }

  setLocalStorageGeminiApiKey(key: string) {
    this.geminiApiKey.set(key);
    localStorage.setItem(LOCAL_STORAGE_GEMINI_API_KEY, key);
  }

  /* DELETE */
  deleteLocalStorageSavedFilter(charTypeLevelKey: string) {
    this.savedFilters.update(currentValue => {
      const updatedFilters = new Map(currentValue);
      updatedFilters.delete(charTypeLevelKey);
      return updatedFilters;
    });

    localStorage.setItem(LOCAL_STORAGE_SAVED_FILTERS_KEY, JSON.stringify(Array.from(this.savedFilters().entries())));
  }

  /* UTILS */
  charTypeLevelKeyToSearchFilter(charTypeLevelKey: string): SearchFilters {
    const filterArray = charTypeLevelKey.split('-');
    const chartType = filterArray.at(0)!;
    const level = Number(filterArray.at(1));
    const isLastFilter = this.lastFilter().chartType === chartType && this.lastFilter().level === level;

    return {
      chartType,
      filter: charTypeLevelKey,
      isLastFilter,
      level,
      songTypes: [true], // valor por defecto
      stagePass: null    // valor por defecto
    };
  }

  // Genera la key del Map de savedFilters (no es serialización, es un identificador)
  searchFiltersToChartTypeLevelKey(searchFilters: SearchFilters): string {
    return `${searchFilters.chartType}-${searchFilters.level}`;
  }

  /* PRIVATE */
  private persistLastFilter(filter: SearchFilters): void {
    localStorage.setItem(LOCAL_STORAGE_LAST_FILTER_KEY, JSON.stringify(filter));
  }

  private getLastFilter(): SearchFilters {
    const raw = localStorage.getItem(LOCAL_STORAGE_LAST_FILTER_KEY);
    if (!raw) return { ...DEFAULT_FILTER };

    try {
      const parsed = JSON.parse(raw) as SearchFilters;
      // Validación mínima: si tiene chartType y level, es un objeto válido
      if (parsed && typeof parsed.chartType === 'string' && typeof parsed.level === 'number') {
        return {
          ...DEFAULT_FILTER,
          ...parsed,
          // Sanitizar campos que podrían no estar presentes en datos migrados
          songTypes: Array.isArray(parsed.songTypes) ? parsed.songTypes : DEFAULT_FILTER.songTypes,
          stagePass: parsed.stagePass === undefined ? null : parsed.stagePass
        };
      }
    } catch {
      // Si el JSON falla, el dato era del formato antiguo (string con guiones); se ignora y usa el default
    }

    // Fallback transparente: limpiar el dato viejo y usar el default
    localStorage.removeItem(LOCAL_STORAGE_LAST_FILTER_KEY);
    return { ...DEFAULT_FILTER };
  }

  private getSavedFiltersFromLocalStorage(): Map<string, TierListWithScore[]> {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_SAVED_FILTERS_KEY);

    if (!savedFilters)
      return new Map<string, TierListWithScore[]>();

    const parsed = JSON.parse(savedFilters) as [string, TierListWithScore[]][];
    return new Map(parsed);
  }

  private getLocalStorageGeminiApiKey() {
    return localStorage.getItem(LOCAL_STORAGE_GEMINI_API_KEY) ?? '';
  }

  /**
   * Returns per-key and total sizes (in bytes) of current localStorage entries.
   */
  getLocalStorageSizes(): { entries: { key: string; keyBytes: number; valueBytes: number; totalBytes: number }[]; totalBytes: number } {
    const entries: { key: string; keyBytes: number; valueBytes: number; totalBytes: number }[] = [];
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string;
      const value = localStorage.getItem(key) ?? '';
      const keyBytes = this.byteSize(key);
      const valueBytes = this.byteSize(value);
      const totalBytes = keyBytes + valueBytes;
      entries.push({ key, keyBytes, valueBytes, totalBytes });
      total += totalBytes;
    }

    return { entries, totalBytes: total };
  }

  private byteSize(str: string): number {
    try {
      if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(str).length;
      }
    } catch (e) {
      // fall through to fallback
    }
    // Fallback approximation for older browsers
    return encodeURIComponent(str).replace(/%[A-F\d]{2}/g, 'U').length;
  }
}
