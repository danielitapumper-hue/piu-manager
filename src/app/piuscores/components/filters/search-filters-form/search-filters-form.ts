import { Component, effect, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'search-filters-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-filters-form.html',
})
export class SearchFiltersForm {
  localStorageService = inject(LocalStorageService);

  searchFilters = output<SearchFilters>();
  songTypesFilter = output<boolean[]>();

  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  tierListForm = this.fb.group({
    chartType: [
      this.localStorageService.lastFilter().chartType,
      [Validators.required, Validators.pattern(/Single|Double/)]
    ],
    level: [
      this.localStorageService.lastFilter().level,
      [Validators.required, Validators.min(1), Validators.max(29)]
    ],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, i) => this.localStorageService.lastFilter().songTypes[i]),
      [Validators.required, Validators.minLength(1)]
    ),
    saveFilter: [false]
  });

  songTypesChanged = this.tierListForm.get('songTypes')!.valueChanges
    .subscribe((songTypes) => {
      const songTypesBooleanArray = songTypes.map((item) => item === true);
      this.songTypesFilter.emit(songTypesBooleanArray);
    });

  changeFilterEffect = effect((onCleanUp) => {
    const lastFilter = this.localStorageService.lastFilter();
    this.tierListForm.patchValue({
      chartType: lastFilter.chartType,
      level: lastFilter.level,
      songTypes: lastFilter.songTypes
    }, { emitEvent: false });
  });

  ngOnInit() {
    const lastFilter = this.localStorageService.lastFilter();
    if (lastFilter.filter) {
      this.songTypesFilter.emit(lastFilter.songTypes);
    }
  }

  formSubmit() {
    const { songTypes } = this.tierListForm.value;
    const songTypesBooleanArray = songTypes!.map((item) => item === true);
    this.emitSearchFilters(songTypesBooleanArray);
  }

  private emitSearchFilters(songTypes: boolean[]) {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level, saveFilter } = this.tierListForm.value;
    const searchFilters: SearchFilters = {
      chartType: chartType!,
      level: level!,
      saveFilter: saveFilter!,
      songTypes: songTypes
    };

    this.searchFilters.emit(searchFilters);
  }
}
