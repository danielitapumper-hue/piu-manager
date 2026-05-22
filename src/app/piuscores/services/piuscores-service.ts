import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TierListResponse } from '@piuscores/interfaces/tier-list-response';
import { Category, ChartType, SongType } from '@piuscores/interfaces/piuscores-interfaces';
import { PhoenixScoresResponse } from '@piuscores/interfaces/phoenix-scores-response';

const API_URL = 'https://piuscores.arroweclip.se/api';

@Injectable({
  providedIn: 'root',
})
export class PiuscoresService {
  private http = inject(HttpClient);

  chartTypes = Object.values(ChartType);
  songTypes = Object.values(SongType);
  categories = Object.values(Category);

  getPhoenixScores(page: number): Observable<PhoenixScoresResponse> {
    return this.http.get<PhoenixScoresResponse>(`${API_URL}/phoenixScores`, {
      params: {
        page: page,
        count: 1000
      }
    });
  }

  getTierListByScores(chartType: string, level: number): Observable<TierListResponse[]> {
    return this.http.get<TierListResponse[]>(`${API_URL}/tierlist/scores`, {
      params: {
        chartType: chartType,
        level: level
      }
    });
  }
}
