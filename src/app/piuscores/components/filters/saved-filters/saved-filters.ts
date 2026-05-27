import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { ShortHandPipe } from '@piuscores/pipes/short-hand-pipe';
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'saved-filters',
  imports: [ShortHandPipe],
  templateUrl: './saved-filters.html',
})
export class SavedFilters {
  localStorageService = inject(LocalStorageService);

  filter = output<string>();
  savedFiltersArray = computed<SearchFilters[]>(() =>
    Array.from(this.localStorageService.savedFilters().keys())
      .map(filter => this.localStorageService.charTypeLevelKeyToSearchFilter(filter))
      .sort((a, b) => a.level - b.level)
      .sort((a, b) => b.chartType.localeCompare(a.chartType)));

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }
}
