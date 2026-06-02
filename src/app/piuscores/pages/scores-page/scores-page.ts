import { Component, computed, inject, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';
import { SongTypesFilter } from "@piuscores/components/filters/song-types-filter/song-types-filter";
import { SearchByNameFilter } from "@piuscores/components/filters/search-by-name-filter/search-by-name-filter";
import { PiuscoresService } from '@piuscores/services/piuscores-service';

@Component({
  selector: 'app-scores-page',
  imports: [SavedFilters, ImageSrcPipe, DecimalPipe, SongTypesFilter, SearchByNameFilter],
  templateUrl: './scores-page.html',
})
export class ScoresPage {
  localStorageService = inject(LocalStorageService);
  piuScoresService = inject(PiuscoresService);

  private songTypesFilter: boolean[] = [];
  private scoresList: ChartScore[] = [];

  scoresListByLetterGrade = signal<CategoryCharts[]>([]);

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter = lastFilter.songTypes;
      this.scoresList = this.localStorageService.getTierListByScoresFromLocalStorage(
        this.localStorageService.searchFiltersToChartTypeLevelKey(lastFilter)
      );
      this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade());
    }
  }

  searchBySongTypes(songTypes: boolean[]) {
    this.songTypesFilter = songTypes;
    this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade());
    this.localStorageService.setLocalStorageLastSongTypesFilter(songTypes);
  }

  searchSavedFilter(savedFilter: string) {
    this.scoresList = this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter);
    this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade());
  }

  searchBySongName(songName: string) {
    this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade(songName));
  }

  private getScoresListByLetterGrade(songName?: string): CategoryCharts[] {
    if (this.scoresList.length === 0)
      return [];

    const scoresListByLetterGrade: CategoryCharts[] = [];
    const filteredScoresList = this.getFilteredScoresList(songName);
    const letterGrades = [...new Set(
      this.scoresList
        .filter(item => item.score)
        .map(item => item.score!.letterGrade)
        .sort((a, b) => a.localeCompare(b))
    )];

    for (const letterGrade of letterGrades) {
      scoresListByLetterGrade.push({
        category: letterGrade,
        charts: this.getScoreListByLetterGrade(letterGrade, filteredScoresList)
      });
    }

    return scoresListByLetterGrade;
  }

  private getFilteredScoresList(songName?: string): ChartScore[] {
    const songTypesFilter = this.piuScoresService.songTypes.filter((_, i) => this.songTypesFilter[i]);
    return this.scoresList.filter(item => item.score &&
      songTypesFilter.includes(item.chart.song.type) &&
      (!songName || item.chart.song.name.toLowerCase().includes(songName.toLowerCase())));
  }

  private getScoreListByLetterGrade(letterGrade: string, filteredScoresList: ChartScore[]): ChartScore[] {
    return filteredScoresList
      .filter(item => item.score!.letterGrade === letterGrade)
      .sort((a, b) => a.score!.score - b.score!.score);
  }
}
