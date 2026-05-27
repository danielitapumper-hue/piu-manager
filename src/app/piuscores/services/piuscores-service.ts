import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
import { Category, ChartType, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { PhoenixScoresResponse, Result } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';

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

  getPhoenixScores(page: number, count: number): Observable<PhoenixScoresResponse> {
    return this.http.get<PhoenixScoresResponse>(`${API_URL}/phoenixScores`, {
      params: {
        page: page,
        count: count
      }
    });
  }

  getTierListWithScores(searchFilters: SearchFilters): Observable<TierListWithScore[]> {
    return this.getTierListByScores(searchFilters).pipe(
      switchMap(tierList => {
        const count = 100;

        // Obtener primera página para saber cuántas páginas hay
        return this.getPhoenixScores(1, count).pipe(
          switchMap(firstPage => {
            // Calcular total de páginas
            const totalPages = Math.ceil(firstPage.totalResults / count);

            // Crear array de Observables con todas las páginas
            const allPages = [of(firstPage)]; // Primera página ya obtenida
            for (let page = 2; page <= totalPages; page++) {
              allPages.push(this.getPhoenixScores(page, count));
            }

            // Combinar todas las páginas en paralelo
            return forkJoin(allPages).pipe(
              map(responses => {
                // Extraer y combinar todos los resultados
                const allScores = responses.flatMap(response => response.results);

                // Filtrar según tu lógica
                const filteredScores = allScores.filter(score => {
                  return searchFilters.chartType === score.chart.type && searchFilters.level === score.chart.level;
                });

                // Combinar tierList con los scores filtrados
                return this.combineResults(tierList, filteredScores);
              })
            );
          })
        )
      })
    );
  }

  private combineResults(tierList: TierListResponse[], scores: Result[]): TierListWithScore[] {
    // Tu lógica de combinación aquí
    return tierList.map(tier => ({
      ...tier,
      score: scores.find(score => score.chart.id === tier.chart.id)
    }));
  }
}
