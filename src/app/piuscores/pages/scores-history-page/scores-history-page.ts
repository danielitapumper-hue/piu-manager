import { Component, computed, inject, signal } from '@angular/core';
import { ScoresTable } from "@piuscores/components/scores/scores-table/scores-table";
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pagination } from "@piuscores/components/pagination/pagination";
import { SongNameFilter } from "@piuscores/components/filters/song-name-filter/song-name-filter";
import { Title } from "@piuscores/components/title/title";

@Component({
  selector: 'app-scores-history-page',
  imports: [ScoresTable, Pagination, SongNameFilter, Title],
  templateUrl: './scores-history-page.html',
})
export class ScoresHistoryPage {
  piuScoresService = inject(PiuscoresService);

  currentPage = signal<number>(1);
  scoresPerPage = signal<number>(10);
  searchTerm = signal<string>('');

  scoresResource = rxResource({
    stream: () => this.piuScoresService.getAllPhoenixScores(),
  });

  allScores = computed(() => this.scoresResource.value() ?? []);

  filteredScores = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const allScores = this.allScores();

    if (!term) {
      return allScores;
    }

    return allScores.filter(score =>
      score.chart.song.name.toLowerCase().includes(term) ||
      score.chart.shorthand.toLowerCase().includes(term)
    );
  });

  pagedScores = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.scoresPerPage();
    return this.filteredScores().slice(startIndex, startIndex + this.scoresPerPage());
  });

  totalPagesSignal = computed(() => {
    const totalItems = this.filteredScores().length;
    return Math.ceil(totalItems / this.scoresPerPage());
  });

  inputPageChanged(value: number): void {
    if (!Number.isNaN(value) && value >= 1 && value <= this.totalPagesSignal()) {
      this.currentPage.set(value);
    }
  }

  searchBySongName(songName: string) {
    this.searchTerm.set(songName);
    this.currentPage.set(1);
  }
}
