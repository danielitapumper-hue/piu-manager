import { TierListResponse } from "@piuscores/interfaces/piuscores-services/tier-list-response";
import { SavedFilter } from "@piuscores/interfaces/saved-filter";
import { SearchFilters } from "@piuscores/interfaces/search-filters";

export class LocalStorageUtils {
  private static LOCAL_STORAGE_SAVED_FILTERS_KEY = 'savedFilters';
  private static LOCAL_STORAGE_LAST_FILTER_KEY = 'lastFilter';

  static getTierListByScoresFromLocalStorage(searchFilter: string): TierListResponse[] {
    const localStorageFilters = this.getSavedFiltersFromLocalStorage();
    localStorage.setItem(LocalStorageUtils.LOCAL_STORAGE_LAST_FILTER_KEY, searchFilter);
    return localStorageFilters.get(searchFilter) ?? [];
  }

  static addFilterToLocalStorage(searchFilters: SearchFilters, data: TierListResponse[]): Map<string, TierListResponse[]> {
    const filtersToString = this.searchFiltersToKey(searchFilters);
    const savedFilters = this.getSavedFiltersFromLocalStorage();

    savedFilters.set(filtersToString, data);
    localStorage.setItem(LocalStorageUtils.LOCAL_STORAGE_SAVED_FILTERS_KEY, JSON.stringify(Array.from(savedFilters.entries())));
    localStorage.setItem(LocalStorageUtils.LOCAL_STORAGE_LAST_FILTER_KEY, filtersToString);

    return savedFilters;
  }

  static getSavedFiltersFromLocalStorage(): Map<string, TierListResponse[]> {
    const savedFilters = localStorage.getItem(LocalStorageUtils.LOCAL_STORAGE_SAVED_FILTERS_KEY);

    if (!savedFilters)
      return new Map<string, TierListResponse[]>();

    const parsed = JSON.parse(savedFilters) as [string, TierListResponse[]][];
    return new Map(parsed);
  }

  static getLastFilter(): SavedFilter {
    const lastFilter = localStorage.getItem(this.LOCAL_STORAGE_LAST_FILTER_KEY);
    return LocalStorageUtils.filterStringToSavedFilter(lastFilter);
  }

  static filterStringToSavedFilter(filter: string | null): SavedFilter {
    const filterArray = filter?.split('-');
    const level = !filterArray || !filterArray.at(1) ? 2 : Number(filterArray.at(1));
    return {
      chartType: filterArray?.at(0) ?? 'Single',
      filter: filter ?? '',
      level: level
    };
  }

  private static searchFiltersToKey(searchFilters: SearchFilters): string {
    return `${searchFilters.chartType}-${searchFilters.level}`;
  }
}
