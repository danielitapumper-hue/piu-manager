import { Component, effect, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'search-filters-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-filters-form.html',
})
export class SearchFiltersForm {
  localStorageService = inject(LocalStorageService);
  fb = inject(FormBuilder);

  searchFilters = output<SearchFilters>();

  tierListForm = this.fb.group({
    chartType: [
      this.localStorageService.lastFilter().chartType,
      [Validators.required]
    ],
    level: [
      this.localStorageService.lastFilter().level,
      [Validators.required, Validators.min(1), Validators.max(29)]
    ],
    saveFilter: [false]
  });

  formSubmit() {
    this.emitSearchFilters();
  }

  changeFilterEffect = effect(() => {
    const lastFilter = this.localStorageService.lastFilter();
    this.tierListForm.patchValue({
      chartType: lastFilter.chartType,
      level: lastFilter.level
    }, { emitEvent: false });
  });

  private emitSearchFilters() {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level, saveFilter } = this.tierListForm.value;
    const lastFilter = this.localStorageService.lastFilter();
    const searchFilters: SearchFilters = {
      chartType: chartType!,
      level: level!,
      saveFilter: saveFilter!,
      songTypes: lastFilter.songTypes,
      stagePass: lastFilter.stagePass ?? null
    };

    this.searchFilters.emit(searchFilters);
  }
}
