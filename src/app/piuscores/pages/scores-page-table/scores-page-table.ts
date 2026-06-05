import { Component, computed, inject, signal } from '@angular/core';
import { ScoresTable } from "@piuscores/components/scores/scores-table/scores-table";
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pagination } from "@piuscores/components/pagination/pagination";

@Component({
  selector: 'app-scores-page-table',
  imports: [ScoresTable, Pagination],
  templateUrl: './scores-page-table.html',
})
export class ScoresPageTable {
  piuScoresService = inject(PiuscoresService);

  private totalPages = 0;

  currentPage = signal<number>(1);
  scoresPerPage = signal<number>(10);

  totalPagesSignal = computed(() => {
    if (!this.scoresResource.value()) {
      return this.totalPages;
    }
    this.totalPages = Math.ceil(this.scoresResource.value()!.totalResults / this.scoresPerPage());
    return this.totalPages;
  });

  scoresResource = rxResource({
    params: () => ({
      page: this.currentPage(),
      count: this.scoresPerPage(),
    }),
    stream: ({ params }) => {
      return this.piuScoresService.getPhoenixScores(params.page, params.count);
    }
  });
}
