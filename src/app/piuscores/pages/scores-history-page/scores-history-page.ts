import { Component, computed, inject, signal } from '@angular/core';
import { ScoresTable } from "@piuscores/components/scores/scores-table/scores-table";
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pagination } from "@piuscores/components/pagination/pagination";
import { SongNameFilter } from "@piuscores/components/filters/song-name-filter/song-name-filter";

@Component({
  selector: 'app-scores-history-page',
  imports: [ScoresTable, Pagination, SongNameFilter],
  templateUrl: './scores-history-page.html',
})
export class ScoresHistoryPage {
  piuScoresService = inject(PiuscoresService);

  currentPage = signal<number>(1);
  scoresPerPage = signal<number>(10);

  scoresResource = rxResource({
    stream: () => this.piuScoresService.getAllPhoenixScores(),
  });

  pagedScores = computed(() => {
    const allScores = this.scoresResource.value() ?? [];
    const startIndex = (this.currentPage() - 1) * this.scoresPerPage();

    return allScores.slice(startIndex, startIndex + this.scoresPerPage());
  });

  totalPagesSignal = computed(() => {
    const totalItems = this.scoresResource.value()?.length ?? 0;
    return Math.ceil(totalItems / this.scoresPerPage());
  });

  inputPageChanged(value: number): void {
    if (!isNaN(value) && value >= 1 && value <= this.totalPagesSignal()) {
      this.currentPage.set(value);
    }
  }

  searchBySongName(songName: string) {
    // this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade(songName));
  }
}
