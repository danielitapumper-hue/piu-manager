import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';

@Component({
  selector: 'app-scores-page',
  imports: [SavedFilters, ImageSrcPipe, DecimalPipe],
  templateUrl: './scores-page.html',
})
export class ScoresPage {
  localStorageService = inject(LocalStorageService);

  private scoresList: ChartScore[] = [];

  scoresListByLetterGrade = signal<CategoryCharts[]>([]);

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.scoresList = this.localStorageService.getTierListByScoresFromLocalStorage(
        this.localStorageService.searchFiltersToChartTypeLevelKey(lastFilter)
      );
      this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade());
    }
  }

  searchSavedFilter(savedFilter: string) {
    this.scoresList = this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter);
    this.scoresListByLetterGrade.set(this.getScoresListByLetterGrade());
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
    return this.scoresList.filter(item => item.score &&
      (!songName || item.chart.song.name.toLowerCase().includes(songName.toLowerCase())));
  }

  private getScoreListByLetterGrade(letterGrade: string, filteredScoresList: ChartScore[]): ChartScore[] {
    return filteredScoresList.filter(item => item.score!.letterGrade === letterGrade);
  }
}
