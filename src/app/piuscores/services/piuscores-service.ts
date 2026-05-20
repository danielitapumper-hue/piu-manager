import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PhoenixScoresResponse } from '../interfaces/phoenix-scores-response';
import { Observable } from 'rxjs';
import { TierListResponse } from '../interfaces/tier-list-response';
import { ChartType } from '../interfaces/piuscores-interfaces';

const API_URL = 'https://piuscores.arroweclip.se/api';

@Injectable({
  providedIn: 'root',
})
export class PiuscoresService {
  private http = inject(HttpClient);

  getPhoenixScores(page: number): Observable<PhoenixScoresResponse> {
    return this.http.get<PhoenixScoresResponse>(`${API_URL}/phoenixScores`, {
      params: {
        page: page,
        count: 1000
      }
    });
  }

  getTierListByScores(chartType: ChartType, level: number): Observable<TierListResponse> {
    return this.http.get<TierListResponse>(`${API_URL}/tierlist/scores`, {
      params: {
        chartType: chartType,
        level: level
      }
    });
  }
}
