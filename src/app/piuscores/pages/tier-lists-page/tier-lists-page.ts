import { Component, inject, signal } from '@angular/core';
import { SongCard } from '@piuscores/components/songs/song-card/song-card';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { Category, Chart, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Filters } from '@piuscores/components/filters/filters';

@Component({
  selector: 'app-tier-lists-page',
  imports: [SongCard, Filters],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  localStorageService = inject(LocalStorageService);
  piuScoresService = inject(PiuscoresService);

  private songTypesFilter: boolean[] = [];
  private stagePassFilter: boolean | null = null;
  private tierList: TierListWithScore[] = [];

  isLoadingTierList = signal<boolean>(false);
  tierListByCategories = signal<CategoryCharts[]>([]);

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter = lastFilter.songTypes;
      this.stagePassFilter = lastFilter.stagePass;
      this.tierList = this.localStorageService.getTierListByScoresFromLocalStorage(
        this.localStorageService.searchFiltersToChartTypeLevelKey(lastFilter)
      );
      this.tierListByCategories.set(this.getTierListByCategories());
    }
  }

  search(searchFilters: SearchFilters) {
    this.isLoadingTierList.set(true);
    this.piuScoresService.getTierListWithScores(searchFilters)
      .subscribe(resp => {
        this.songTypesFilter = searchFilters.songTypes;
        this.stagePassFilter = searchFilters.stagePass;
        this.tierList = resp;
        this.tierListByCategories.set(this.getTierListByCategories());
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
    this.songTypesFilter = songTypes;
    this.tierListByCategories.set(this.getTierListByCategories());
    this.localStorageService.setLocalStorageLastSongTypesFilter(songTypes);
  }

  searchByStagePass(stagePass: boolean | null) {
    this.stagePassFilter = stagePass;
    this.tierListByCategories.set(this.getTierListByCategories());
    this.localStorageService.setLocalStorageLastStagePassFilter(stagePass);
  }

  searchSavedFilter(savedFilter: string) {
    this.tierList = this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter);
    this.tierListByCategories.set(this.getTierListByCategories());
  }

  searchBySongName(songName: string) {
    this.tierListByCategories.set(this.getTierListByCategories(songName));
  }

  handleChartScoreUpdated(updatedChartScore: ChartScore) {
    //Actualizo la tierlist con el nuevo score
    this.tierList = this.tierList.map(item =>
      item.chart.id === updatedChartScore.chart.id
        ? {
          ...item,
          score: updatedChartScore.score,
        }
        : item
    );
    //Actualizo la pantalla
    this.tierListByCategories.set(this.getTierListByCategories());

    //Actualizo el localStorage
    this.localStorageService.setLocalStorageSavedFilters(
      this.localStorageService.searchFiltersToChartTypeLevelKey(
        this.localStorageService.lastFilter()
      ), this.tierList, true
    );
  }

  private getTierListByCategories(songName?: string): CategoryCharts[] {
    if (this.tierList.length === 0)
      return [];

    const tierListByCategories: CategoryCharts[] = [];
    const filteredTierList = this.getFilteredTierList(songName);

    for (const category of this.piuScoresService.categories) {
      tierListByCategories.push({
        category: category.val,
        charts: this.getTierListByCategory(category.key, filteredTierList)
      });
    }

    return tierListByCategories;
  }

  private getFilteredTierList(songName?: string): TierListWithScore[] {
    const songTypesFilter = this.piuScoresService.songTypes.filter((_, i) => this.songTypesFilter[i]);
    return this.tierList.filter(item => songTypesFilter.includes(item.chart.song.type) &&
      (this.stagePassFilter && item.score && !item.score.isBroken ||
        this.stagePassFilter === false && (!item.score || item.score.isBroken) ||
        this.stagePassFilter === null) &&
      (!songName || item.chart.song.name.toLowerCase().includes(songName.toLowerCase())));
  }

  private getTierListByCategory(category: string, filteredTierList: TierListWithScore[]): ChartScore[] {
    return filteredTierList
      .filter(item => item.category === category)
      .map(item => {
        return {
          chart: item.chart,
          score: item.score
        };
      });
  }
}
