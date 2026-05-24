import { Component, computed, inject, output, signal } from '@angular/core';
import { ChartTypePipe } from '@piuscores/pipes/chart-type-pipe';
import { PiuscoresService } from '@piuscores/services/piuscores-service';

@Component({
  selector: 'saved-filters',
  imports: [ChartTypePipe],
  templateUrl: './saved-filters.html',
})
export class SavedFilters {
  filter = output<string>();
  piuscoresService = inject(PiuscoresService);
  savedFiltersArray = computed(() => Array.from(this.piuscoresService.savedFilters().keys()));

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }
}
