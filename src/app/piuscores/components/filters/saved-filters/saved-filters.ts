import { Component, computed, inject, output, signal } from '@angular/core';
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

  ngOnInit() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.search(lastFilter.filter);
    }
  }

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }
}
