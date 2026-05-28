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
  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  searchFilters = output<SearchFilters>();
  songTypesFilter = output<boolean[]>();
  stagePassFilter = output<boolean | null>();

  tierListForm = this.fb.group({
    chartType: [
      this.localStorageService.lastFilter().chartType,
      [Validators.required]
    ],
    level: [
      this.localStorageService.lastFilter().level,
      [Validators.required, Validators.min(1), Validators.max(29)]
    ],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, i) => this.localStorageService.lastFilter().songTypes[i]),
      [Validators.required, Validators.minLength(1)]
    ),
    stagePass: [this.localStorageService.lastFilter().stagePass],
    saveFilter: [false]
  });

  formSubmit() {
    this.emitSearchFilters();
  }

  songTypesChanged = this.tierListForm.get('songTypes')!.valueChanges
    .subscribe((songTypes) => {
      const songTypesBooleanArray = songTypes.map((item) => item === true);
      this.songTypesFilter.emit(songTypesBooleanArray);
    });

  changeFilterEffect = effect(() => {
    const lastFilter = this.localStorageService.lastFilter();
    this.tierListForm.patchValue({
      chartType: lastFilter.chartType,
      level: lastFilter.level,
      songTypes: lastFilter.songTypes,
      stagePass: lastFilter.stagePass
    }, { emitEvent: false });
  });

  toggleStagePass(input: HTMLInputElement) {
    const control = this.tierListForm.get('stagePass');
    const current = control?.value as boolean | null;
    const next = current === null
      ? true
      : current === true
        ? false
        : null;

    control?.setValue(next);

    input.indeterminate = next === null;
    input.checked = next === true;

    this.stagePassFilter.emit(next);
  }

  private emitSearchFilters() {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level, saveFilter, songTypes, stagePass } = this.tierListForm.value;
    const songTypesBooleanArray = songTypes!.map((item) => item === true);
    const searchFilters: SearchFilters = {
      chartType: chartType!,
      level: level!,
      saveFilter: saveFilter!,
      songTypes: songTypesBooleanArray,
      stagePass: stagePass ?? null
    };

    this.searchFilters.emit(searchFilters);
  }
}
