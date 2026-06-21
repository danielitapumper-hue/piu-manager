import { Injectable, signal } from '@angular/core';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';

const LOCAL_STORAGE_SAVED_FILTERS_KEY = 'savedFilters';
const LOCAL_STORAGE_LAST_FILTER_KEY = 'lastFilter';
const LOCAL_STORAGE_GEMINI_API_KEY = 'gemini_api_key';

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

    //Uso la key de searchFilters completa
    this.setLocalStorageLastFilter(this.searchFiltersToKey(this.lastFilter()));

    //Uso charTypeLevelKey porque los filtros guardados tienen chartType-level, sin los songTypes.
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

  setLocalStorageLastFilter(searchFiltersKey: string) {
    this.lastFilter.set(this.filterStringToSearchFilter(searchFiltersKey));
    localStorage.setItem(LOCAL_STORAGE_LAST_FILTER_KEY, searchFiltersKey);
  }

  setLocalStorageLastSongTypesFilter(songTypes: boolean[]) {
    this.lastFilter.update(currentValue => ({ ...currentValue, songTypes: songTypes }));
    localStorage.setItem(LOCAL_STORAGE_LAST_FILTER_KEY, this.searchFiltersToKey(this.lastFilter()));
  }

  setLocalStorageLastStagePassFilter(stagePass: boolean | null) {
    this.lastFilter.update(currentValue => ({ ...currentValue, stagePass: stagePass }));
    localStorage.setItem(LOCAL_STORAGE_LAST_FILTER_KEY, this.searchFiltersToKey(this.lastFilter()));
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
  filterStringToSearchFilter(filter: string | null): SearchFilters {
    const filterArray = filter?.split('-');

    if (!filterArray || filterArray.length === 0) {
      //Filtro por defecto
      return {
        chartType: 'Single',
        filter: '',
        level: 2,
        songTypes: [true],
        stagePass: null
      };
    }

    const level = Number(filterArray.at(1));
    const songTypes = filterArray.at(2) ?? 'true';
    const songTypesArray = songTypes.split(',').map((item) => item === 'true');
    const stagePass = filterArray.at(3);
    const stagePassFilter = !stagePass ? null : stagePass === 'true';

    return {
      chartType: filterArray.at(0)!,
      filter: filter ?? '',
      level: level,
      songTypes: songTypesArray,
      stagePass: stagePassFilter
    };
  }

  charTypeLevelKeyToSearchFilter(charTypeLevelKey: string): SearchFilters {
    const filterArray = charTypeLevelKey.split('-');
    const chartType = filterArray.at(0)!;
    const level = Number(filterArray.at(1));
    const isLastFilter = this.lastFilter().chartType === chartType && this.lastFilter().level === level;

    return {
      chartType: filterArray.at(0)!,
      filter: charTypeLevelKey,
      isLastFilter: isLastFilter,
      level: level,
      songTypes: [true], //valor por defecto
      stagePass: null //valor por defecto
    };
  }

  //Este sirve para guardar el último filtro completo
  searchFiltersToKey(searchFilters: SearchFilters): string {
    const key = `${searchFilters.chartType}-${searchFilters.level}-${searchFilters.songTypes}`;
    return searchFilters.stagePass === null ? key : `${key}-${searchFilters.stagePass}`;
  }

  //Este sirve para guardar los filtros de chartType y level nada más
  searchFiltersToChartTypeLevelKey(searchFilters: SearchFilters): string {
    return `${searchFilters.chartType}-${searchFilters.level}`;
  }

  /* PRIVATE */
  private getSavedFiltersFromLocalStorage(): Map<string, TierListWithScore[]> {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_SAVED_FILTERS_KEY);

    if (!savedFilters)
      return new Map<string, TierListWithScore[]>();

    const parsed = JSON.parse(savedFilters) as [string, TierListWithScore[]][];
    return new Map(parsed);
  }

  private getLastFilter(): SearchFilters {
    const lastFilter = localStorage.getItem(LOCAL_STORAGE_LAST_FILTER_KEY);
    return this.filterStringToSearchFilter(lastFilter);
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
