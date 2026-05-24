import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
import { Category, ChartType, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { PhoenixScoresResponse } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { SearchFilters } from '@piuscores/interfaces/search-filters';

const API_URL = 'https://piuscores.arroweclip.se/api';
const LOCAL_STORAGE_SAVED_FILTERS_KEY = 'savedFilters';

@Injectable({
  providedIn: 'root',
})
export class PiuscoresService {
  private http = inject(HttpClient);

  chartTypes = Object.values(ChartType);
  songTypes = Object.values(SongType);
  categories = Object.values(Category);

  savedFilters = signal<Map<string, TierListResponse[]>>(this.getSavedFiltersFromLocalStorage());

  getTierListByScores(searchFilters: SearchFilters): Observable<TierListResponse[]> {
    return this.http.get<TierListResponse[]>(`${API_URL}/tierlist/scores`, {
      params: {
        chartType: searchFilters.chartType,
        level: searchFilters.level
      }
    }).pipe(tap(resp => {
      if (searchFilters.saveFilter) {
        this.addFilterToLocalStorage(searchFilters, resp);
      }
    }));
  }

  getPhoenixScores(page: number): Observable<PhoenixScoresResponse> {
    return this.http.get<PhoenixScoresResponse>(`${API_URL}/phoenixScores`, {
      params: {
        page: page,
        count: 1000
      }
    });
  }

  getTierListByScoresFromLocalStorage(searchFilters: string): TierListResponse[] {
    const localStorageFilters = this.getSavedFiltersFromLocalStorage();
    return localStorageFilters.get(searchFilters) ?? [];
  }

  private addFilterToLocalStorage(searchFilters: SearchFilters, data: TierListResponse[]) {
    const filtersToString = this.searchFiltersToKey(searchFilters);
    const savedFilters = this.getSavedFiltersFromLocalStorage();

    savedFilters.set(filtersToString, data);
    this.savedFilters.set(savedFilters);

    localStorage.setItem(
      LOCAL_STORAGE_SAVED_FILTERS_KEY,
      JSON.stringify(Array.from(savedFilters.entries()))
    );
  }

  private getSavedFiltersFromLocalStorage(): Map<string, TierListResponse[]> {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_SAVED_FILTERS_KEY);

    if (!savedFilters)
      return new Map<string, TierListResponse[]>();

    const parsed = JSON.parse(savedFilters) as [string, TierListResponse[]][];
    return new Map(parsed);
  }

  private searchFiltersToKey(searchFilters: SearchFilters): string {
    return `${searchFilters.chartType}-${searchFilters.level}`;
  }
}
