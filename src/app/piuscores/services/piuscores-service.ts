import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
import { Category, ChartType, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { PhoenixScoresResponse } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { SearchFilters } from '@piuscores/interfaces/search-filters';

const API_URL = 'https://piuscores.arroweclip.se/api';

@Injectable({
  providedIn: 'root',
})
export class PiuscoresService {
  private http = inject(HttpClient);

  chartTypes = Object.values(ChartType);
  songTypes = Object.values(SongType);
  categories = Object.values(Category);

  getTierListByScores(searchFilters: SearchFilters): Observable<TierListResponse[]> {
    return this.http.get<TierListResponse[]>(`${API_URL}/tierlist/scores`, {
      params: {
        chartType: searchFilters.chartType,
        level: searchFilters.level
      }
    });
  }

  getPhoenixScores(page: number): Observable<PhoenixScoresResponse> {
    return this.http.get<PhoenixScoresResponse>(`${API_URL}/phoenixScores`, {
      params: {
        page: page,
        count: 1000
      }
    });
  }
}
