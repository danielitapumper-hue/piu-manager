import { Component, computed, inject, output, signal } from '@angular/core';
import { SavedFilter } from '@piuscores/interfaces/saved-filter';
import { ShortHandPipe } from '@piuscores/pipes/short-hand-pipe';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageUtils } from '@piuscores/utils/local-storage-utils';

@Component({
  selector: 'saved-filters',
  imports: [ShortHandPipe],
  templateUrl: './saved-filters.html',
})
export class SavedFilters {
  filter = output<string>();
  piuscoresService = inject(PiuscoresService);
  savedFiltersArray = computed<SavedFilter[]>(() => Array.from(this.piuscoresService.savedFilters().keys())
    .map(filter => LocalStorageUtils.filterStringToSavedFilter(filter)));

  ngOnInit() {
    const lastFilter = LocalStorageUtils.getLastFilter();
    if (lastFilter.filter.length > 0) {
      this.search(lastFilter.filter);
    }
  }

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }
}
