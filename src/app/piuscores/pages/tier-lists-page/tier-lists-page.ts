import { Component, inject, signal } from '@angular/core';
import { SearchFiltersForm } from "@piuscores/components/filters/search-filters-form/search-filters-form";
import { SongCard } from '@piuscores/components/songs/song-card/song-card';
import { CategoryCharts } from '@piuscores/interfaces/category-charts';
import { Category, Chart, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { TierListWithScore } from '@piuscores/interfaces/tier-list-with-score';
import { ChartScore } from '@piuscores/interfaces/chart-score';

@Component({
  selector: 'app-tier-lists-page',
  imports: [SongCard, SearchFiltersForm, SavedFilters],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  piuScoresService = inject(PiuscoresService);
  localStorageService = inject(LocalStorageService);

  private tierList: TierListWithScore[] = [];
  private songTypesFilter: boolean[] = [];

  tierListByCategories = signal<CategoryCharts[]>([]);
  isLoadingTierList = signal<boolean>(false);

  ngOnInit() {
    this.searchLastFilter();
  }

  searchLastFilter() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter = lastFilter.songTypes;
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

  searchSavedFilter(savedFilter: string) {
    this.tierList = this.localStorageService.getTierListByScoresFromLocalStorage(savedFilter);
    this.tierListByCategories.set(this.getTierListByCategories());
  }

  private getTierListByCategories(): CategoryCharts[] {
    if (this.tierList.length === 0)
      return [];

    const tierListByCategories: CategoryCharts[] = [];
    const tierListBySongTypes = this.getTierListBySongTypes();

    for (const category of this.piuScoresService.categories) {
      tierListByCategories.push({
        category: category,
        charts: this.getTierListByCategory(category, tierListBySongTypes)
      });
    }

    return tierListByCategories;
  }

  private getTierListBySongTypes(): TierListWithScore[] {
    const songTypesFilter = this.piuScoresService.songTypes.filter((_, i) => this.songTypesFilter[i])
    return this.tierList.filter(item => songTypesFilter.includes(item.chart.song.type));
  };

  private getTierListByCategory(category: Category, tierListBySongTypes: TierListWithScore[]): ChartScore[] {
    return tierListBySongTypes
      .filter(item => item.category === category)
      .map(item => {
        return {
          chart: item.chart,
          score: item.score
        };
      });
  }
}
