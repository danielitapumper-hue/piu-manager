import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SongType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageUtils } from '@piuscores/utils/local-storage-utils';

@Component({
  selector: 'search-filters-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-filters-form.html',
})
export class SearchFiltersForm {
  private lastFilter = LocalStorageUtils.getLastFilter();

  searchFilters = output<SearchFilters>();
  songTypesFilter = output<SongType[]>();

  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  tierListForm = this.fb.group({
    chartType: [this.lastFilter.chartType, [Validators.required, Validators.pattern(/Single|Double/)]],
    level: [this.lastFilter.level, [Validators.required, Validators.min(1), Validators.max(29)]],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, i) => i === 0),
      [Validators.required, Validators.minLength(1)]
    ),
    saveFilter: [false]
  });

  songTypesChanged = this.tierListForm.get('songTypes')!.valueChanges
    .subscribe((songTypes) => {
      this.songTypesFilter.emit(this.piuScoresService.songTypes.filter((_, i) => songTypes[i]));
    });

  ngOnInit() {
    if (this.lastFilter.filter.length > 0) {
      const songTypes = this.tierListForm.get('songTypes')!.value;
      this.songTypesFilter.emit(this.piuScoresService.songTypes.filter((_, i) => songTypes[i]));
    }
  }

  formSubmit() {
    const { songTypes } = this.tierListForm.value;
    this.emitSearchFilters(this.piuScoresService.songTypes.filter((_, i) => songTypes?.at(i) ?? false));
  }

  private emitSearchFilters(songTypes: SongType[]) {
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
