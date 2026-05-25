import { Component, inject, signal } from '@angular/core';
import { SearchFiltersForm } from "@piuscores/components/filters/search-filters-form/search-filters-form";
import { SongCard } from '@piuscores/components/songs/song-card/song-card';
import { CategoryChart } from '@piuscores/interfaces/category-chart';
import { Category, Chart, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'app-tier-lists-page',
  imports: [SongCard, SearchFiltersForm, SavedFilters],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  piuScoresService = inject(PiuscoresService);
  localStorageService = inject(LocalStorageService);

  private tierList: TierListResponse[] = [];
  private songTypesFilter: boolean[] = [];

  tierListByCategories = signal<CategoryChart[]>([]);

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
    this.piuScoresService.getTierListByScores(searchFilters)
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

  private getTierListByCategories(): CategoryChart[] {
    if (this.tierList.length === 0)
      return [];

    const tierListByCategories: CategoryChart[] = [];
    const tierListBySongTypes = this.getTierListBySongTypes();

    for (const category of this.piuScoresService.categories) {
      tierListByCategories.push({
        category: category,
        charts: this.getTierListByCategory(category, tierListBySongTypes)
      });
    }

    return tierListByCategories;
  }

  private getTierListBySongTypes(): TierListResponse[] {
    const songTypesFilter = this.piuScoresService.songTypes.filter((_, i) => this.songTypesFilter[i])
    return this.tierList.filter(item => songTypesFilter.includes(item.chart.song.type));
  };

  private getTierListByCategory(category: Category, tierListBySongTypes: TierListResponse[]): Chart[] {
    return tierListBySongTypes
      .filter(item => item.category === category)
      .map(item => item.chart);
  }
}
