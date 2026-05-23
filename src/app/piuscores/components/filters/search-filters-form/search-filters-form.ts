import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { PiuscoresService } from '@piuscores/services/piuscores-service';

@Component({
  selector: 'search-filters-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-filters-form.html',
})
export class SearchFiltersForm {
  searchFilters = output<SearchFilters>();

  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  tierListForm = this.fb.group({
    chartType: ['Single', [Validators.required, Validators.pattern(/Single|Double/)]],
    level: [1, [Validators.required, Validators.min(1), Validators.max(29)]],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, i) => i === 0),
      [Validators.required, Validators.minLength(1)]
    ),
    saveFilter: [false]
  });

  songTypesChanged = this.tierListForm.get('songTypes')!.valueChanges
    .subscribe((songTypes) => {
      this.emitSearchFilters(songTypes as boolean[]);
    });

  onSearch() {
    const { songTypes } = this.tierListForm.value;
    this.emitSearchFilters(songTypes as boolean[]);
  }

  private emitSearchFilters(songTypes: boolean[]) {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level, saveFilter } = this.tierListForm.value;
    const searchFilters: SearchFilters = {
      chartType: chartType!,
      level: level!,
      saveFilter: saveFilter!,
      songTypes: this.piuScoresService.songTypes.filter((_, i) => songTypes[i])
    };

    this.searchFilters.emit(searchFilters);
  }
}
