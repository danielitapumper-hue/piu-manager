import { Component, effect, inject, output, signal } from '@angular/core';
import { LocalStorageService } from '@shared/services/local-storage-service';

@Component({
  selector: 'stage-pass-filter',
  templateUrl: './stage-pass-filter.html',
})
export class StagePassFilter {
  localStorageService = inject(LocalStorageService);

  stagePassFilter = output<boolean | null>();
  stagePassValue = signal<boolean | null>(this.localStorageService.lastFilter().stagePass);

  changeFilterEffect = effect(() => {
    const lastFilter = this.localStorageService.lastFilter();
    this.stagePassValue.set(lastFilter.stagePass);
  });

  toggleStagePass(input: HTMLInputElement) {
    const current = this.stagePassValue();
    const next = current === null
      ? true
      : current === true
        ? false
        : null;

    this.stagePassValue.set(next);
    input.indeterminate = next === null;
    input.checked = next === true;
    this.stagePassFilter.emit(next);
  }
}
