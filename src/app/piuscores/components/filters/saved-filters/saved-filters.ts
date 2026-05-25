import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { TierListResponse } from '@piuscores/interfaces/piuscores-services/tier-list-response';
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
      .map(filter => this.localStorageService.filterStringToSearchFilter(filter)));

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }
}
