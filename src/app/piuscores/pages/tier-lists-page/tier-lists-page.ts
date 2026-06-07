import { Component, computed, inject, signal } from '@angular/core';
import { SongCard } from '@piuscores/components/songs/song-card/song-card';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Filters } from '@piuscores/components/filters/filters';
import { Dialog } from '@angular/cdk/dialog';
import { SongRandomizerDialog, SongRandomizerDialogData } from '@piuscores/components/songs/song-randomizer-dialog/song-randomizer-dialog';

@Component({
  selector: 'app-tier-lists-page',
  imports: [SongCard, Filters],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  localStorageService = inject(LocalStorageService);
  piuScoresService = inject(PiuscoresService);
  dialog = inject(Dialog);

  private songTypesFilter = signal<boolean[]>([]);
  private stagePassFilter = signal<boolean | null>(null);
  private tierList = signal<TierListWithScore[]>([]);
  private songName = signal<string>('');

  isLoadingTierList = signal<boolean>(false);
  lastFilter = computed<SearchFilters>(() => this.localStorageService.lastFilter());
  filteredTierList = computed<TierListWithScore[]>(() => this.getFilteredTierList());
  tierListByCategories = computed<CategoryCharts[]>(() => this.getTierListByCategories());

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter.set(lastFilter.songTypes);
      this.stagePassFilter.set(lastFilter.stagePass);
      this.tierList.set(this.localStorageService.getTierListByScoresFromLocalStorage(
        this.localStorageService.searchFiltersToChartTypeLevelKey(lastFilter)
      ));
    }
  }

  search(searchFilters: SearchFilters) {
    this.isLoadingTierList.set(true);
    this.piuScoresService.getTierListWithScores(searchFilters)
      .subscribe(resp => {
        this.tierList.set(resp);
        this.localStorageService.setLocalStorageLastFilter(this.localStorageService.searchFiltersToKey(searchFilters));
        if (searchFilters.saveFilter) {
          this.localStorageService.setLocalStorageSavedFilters(
            this.localStorageService.searchFiltersToChartTypeLevelKey(searchFilters),
            resp
          );
        }
        this.isLoadingTierList.set(false);
      });
  }

  searchBySongTypes(songTypes: boolean[]) {
    this.songTypesFilter.set(songTypes);
    this.localStorageService.setLocalStorageLastSongTypesFilter(songTypes);
  }

  searchByStagePass(stagePass: boolean | null) {
    this.stagePassFilter.set(stagePass);
    this.localStorageService.setLocalStorageLastStagePassFilter(stagePass);
  }

  searchSavedFilter(savedFilter: string) {
    this.tierList.set(this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter));
  }

  searchBySongName(songName: string) {
    this.songName.set(songName);
  }

  handleChartScoreUpdated(updatedChartScore: ChartScore) {
    this.tierList.update(list =>
      list.map(item =>
        item.chart.id === updatedChartScore.chart.id
          ? { ...item, score: updatedChartScore.score }
          : item
      )
    );

    this.localStorageService.setLocalStorageSavedFilters(
      this.localStorageService.searchFiltersToChartTypeLevelKey(this.localStorageService.lastFilter()),
      this.tierList(),
      true
    );
  }

  getTierListForRandomizer(category?: string) {
    return category
      ? this.tierListByCategories().find(item => item.category === category)?.charts ?? []
      : this.filteredTierList().map(item => ({
        chart: item.chart,
        score: item.score,
      }));
  }

  openRandomizerDialog(category?: string) {
    this.dialog.open<SongRandomizerDialogData>(SongRandomizerDialog, {
      data: {
        chartScoreList: this.getTierListForRandomizer(category),
        category: category,
        lastFilter: this.lastFilter()
      },
      backdropClass: 'bg-base-100/90'
    });
  }

  private getTierListByCategories(): CategoryCharts[] {
    if (this.tierList().length === 0)
      return [];

    const tierListByCategories: CategoryCharts[] = [];

    for (const category of this.piuScoresService.categories) {
      tierListByCategories.push({
        category: category.val,
        charts: this.getTierListByCategory(category.key)
      });
    }

    return tierListByCategories;
  }

  private getFilteredTierList(): TierListWithScore[] {
    const songTypesFilter = this.piuScoresService.songTypes.filter((_, i) => this.songTypesFilter()[i]);
    return this.tierList().filter(item => songTypesFilter.includes(item.chart.song.type) &&
      (this.stagePassFilter() && item.score && !item.score.isBroken ||
        this.stagePassFilter() === false && (!item.score || item.score.isBroken) ||
        this.stagePassFilter() === null) &&
      (this.songName().length === 0 || item.chart.song.name.toLowerCase().includes(this.songName().toLowerCase())));
  }

  private getTierListByCategory(category: string): ChartScore[] {
    return this.filteredTierList()
      .filter(item => item.category === category)
      .map(item => {
        return {
          chart: item.chart,
          score: item.score
        };
      });
  }
}
