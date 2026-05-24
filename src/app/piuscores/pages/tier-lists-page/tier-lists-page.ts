import { Component, inject, signal } from '@angular/core';
import { SearchFiltersForm } from "@piuscores/components/filters/search-filters-form/search-filters-form";
import { SongCard } from '@piuscores/components/songs/song-card/song-card';
import { CategoryChart } from '@piuscores/interfaces/category-chart';
import { Category, Chart, SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { SavedFilters } from "@piuscores/components/filters/saved-filters/saved-filters";
import { LocalStorageUtils } from '@piuscores/utils/local-storage-utils';

@Component({
  selector: 'app-tier-lists-page',
  imports: [SongCard, SearchFiltersForm, SavedFilters],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  piuScoresService = inject(PiuscoresService);

  private tierList: TierListResponse[] = [];
  private songTypesFilter: SongType[] = [];

  tierListByCategories = signal<CategoryChart[]>([]);

  search(searchFilters: SearchFilters) {
    this.piuScoresService.getTierListByScores(searchFilters)
      .subscribe(resp => {
        this.tierList = resp;
        this.songTypesFilter = searchFilters.songTypes;
        this.tierListByCategories.set(this.getTierListByCategories());
      });
  }

  searchBySongTypes(songTypes: SongType[]) {
    this.songTypesFilter = songTypes;
    this.tierListByCategories.set(this.getTierListByCategories());
  }

  searchSavedFilter(savedFilter: string) {
    this.tierList = LocalStorageUtils.getTierListByScoresFromLocalStorage(savedFilter);
    this.tierListByCategories.set(this.getTierListByCategories())
  }

  private getTierListByCategories(): CategoryChart[] {
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
    return this.tierList.filter(item => this.songTypesFilter.includes(item.chart.song.type));
  };

  private getTierListByCategory(category: Category, tierListBySongTypes: TierListResponse[]): Chart[] {
    return tierListBySongTypes
      .filter(item => item.category === category)
      .map(item => item.chart);
  }
}
