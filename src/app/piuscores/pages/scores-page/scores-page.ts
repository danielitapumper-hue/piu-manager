import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';
import { SongTypesFilter } from "@piuscores/components/filters/song-types-filter/song-types-filter";
import { SongNameFilter } from "@piuscores/components/filters/song-name-filter/song-name-filter";
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { SearchFiltersForm } from "@piuscores/components/filters/search-filters-form/search-filters-form";
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { Dialog } from '@angular/cdk/dialog';
import { SongRandomizerDialog, SongRandomizerDialogData } from '@piuscores/components/songs/song-randomizer-dialog/song-randomizer-dialog';
import { Title } from "@piuscores/components/title/title";
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { LocalStorageService } from '@shared/services/local-storage-service';

@Component({
  selector: 'app-scores-page',
  imports: [SavedFilters, ImageSrcPipe, DecimalPipe, SongTypesFilter, SongNameFilter, SearchFiltersForm, Title],
  templateUrl: './scores-page.html',
})
export class ScoresPage {
  localStorageService = inject(LocalStorageService);
  piuScoresService = inject(PiuscoresService);
  dialog = inject(Dialog);

  private songTypesFilter = signal<boolean[]>([]);
  private songName = signal<string>('');
  private scoresList = signal<ChartScore[]>([]);

  isLoadingScores = signal<boolean>(false);
  lastFilter = computed<SearchFilters>(() => this.localStorageService.lastFilter());
  scoresListByLetterGrade = computed<CategoryCharts[]>(() => 
    PiuSongsUtils.getScoresListByLetterGrade(this.scoresList(), this.songTypesFilter(), this.songName())
  );

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter.set(lastFilter.songTypes);
      this.scoresList.set(this.localStorageService.getTierListByScoresFromLocalStorage(
        this.localStorageService.searchFiltersToChartTypeLevelKey(lastFilter)
      ));
    }
  }

  search(searchFilters: SearchFilters) {
    this.isLoadingScores.set(true);
    if (searchFilters.saveFilter) {
      this.piuScoresService.getTierListWithScores(searchFilters)
        .subscribe(resp => {
          this.scoresList.set(resp.map(item => ({
            chart: item.chart,
            score: item.score
          })));
          this.localStorageService.setLocalStorageLastFilter(searchFilters);
          this.localStorageService.setLocalStorageSavedFilters(
            this.localStorageService.searchFiltersToChartTypeLevelKey(searchFilters),
            resp
          );
          this.isLoadingScores.set(false);
        });
      return;
    }

    this.piuScoresService.getAllPhoenixScores()
      .subscribe(allScores => {
        const filteredScores = allScores.filter(score => {
          return searchFilters.chartType === score.chart.type && searchFilters.level === score.chart.level;
        });
        this.scoresList.set(filteredScores.map(score => ({
          chart: score.chart,
          score: {
            letterGrade: score.letterGrade,
            score: score.score,
            isBroken: score.isBroken,
            plate: score.plate
          }
        })));
        this.localStorageService.setLocalStorageLastFilter(searchFilters);
        this.isLoadingScores.set(false);
      });
  }

  searchBySongTypes(songTypes: boolean[]) {
    this.songTypesFilter.set(songTypes);
    this.localStorageService.setLocalStorageLastSongTypesFilter(songTypes);
  }

  searchSavedFilter(savedFilter: string) {
    this.scoresList.set(this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter));
  }

  searchBySongName(songName: string) {
    this.songName.set(songName);
  }

  openRandomizerDialog(category?: string) {
    let filter = `${this.lastFilter().chartType.slice(0, 1)}${this.lastFilter().level}`;

    if (category)
      filter = `${filter} - ${category}`;

    this.dialog.open<SongRandomizerDialogData>(SongRandomizerDialog, {
      data: {
        chartScoreList: this.scoresListByLetterGrade().find(item => item.category === category)?.charts ?? [],
        filter: filter
      },
      backdropClass: 'bg-base-100/90'
    });
  }
}
