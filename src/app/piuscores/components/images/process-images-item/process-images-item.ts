import { Component, computed, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScanItem, ScanStatus } from '@gemini/interfaces/files/scan-item';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

interface UI {
  cardClasses: string,
  disableDiscard: boolean,
  disableSave: boolean
}

interface ProcessImagesItemFormGroup {
  songName: FormControl<string>;
  chartType: FormControl<ChartType>;
  chartLevel: FormControl<number>;
  score: FormControl<number | null>;
  plate: FormControl<string | null>;
  isBroken: FormControl<boolean | null>;
}

@Component({
  selector: 'process-images-item',
  imports: [ReactiveFormsModule],
  templateUrl: './process-images-item.html',
})
export class ProcessImagesItem implements OnInit {
  fb = inject(FormBuilder);
  destroyRef = inject(DestroyRef);

  item = input.required<ScanItem>();
  updatedItem = output<ScanItem>();
  removedItem = output<ScanItem>();
  rescanItem = output<ScanItem>();
  formValidItem = output<ScanItem>();

  itemForm!: FormGroup<ProcessImagesItemFormGroup>;
  previousScoreValue = '';

  readonly chartTypes = PiuSongsUtils.chartTypes;
  readonly plateOptions = PiuSongsUtils.plateOptions;
  readonly ScanStatus = ScanStatus;

  ui = computed<UI>(() => {
    const status = this.item().status;
    const isInvalid = this.itemForm.invalid;
    switch (status) {
      case ScanStatus.Saved:
        return {
          cardClasses: 'border-success opacity-75',
          disableDiscard: true,
          disableSave: true
        };
      case ScanStatus.Saving:
        return {
          cardClasses: 'border-base-300',
          disableDiscard: true,
          disableSave: true
        };
      case ScanStatus.Error:
        return {
          cardClasses: 'border-error',
          disableDiscard: false,
          disableSave: isInvalid
        };
      default:
        return {
          cardClasses: 'border-base-300',
          disableDiscard: false,
          disableSave: isInvalid
        };
    }
  });

  ngOnInit(): void {
    this.itemForm = this.buildForm();
    this.previousScoreValue = this.item().scoreRequest?.score?.toString() ?? '';

    PiuSongsUtils.setupScoreFormBehavior(
      this.itemForm.controls.isBroken,
      this.itemForm.controls.plate,
      this.itemForm.controls.score,
      this.destroyRef,
      (val) => this.previousScoreValue = val
    );

    this.itemForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        let formValidItem = { ...this.item() };
        formValidItem.formValid = status === 'VALID';
        this.formValidItem.emit(formValidItem);
      });

  }

  private lastPatchedScoreRequest: ScoreRequest | undefined = undefined;

  itemEffect = effect(() => {
    const currentItem = this.item();

    if (currentItem.status === ScanStatus.Saved) {
      this.itemForm.disable({ emitEvent: false });
    }

    if (currentItem.scoreRequest && currentItem.scoreRequest !== this.lastPatchedScoreRequest) {
      this.lastPatchedScoreRequest = currentItem.scoreRequest;
      this.itemForm.patchValue({
        songName: currentItem.scoreRequest.songName,
        chartType: currentItem.scoreRequest.chartType,
        chartLevel: currentItem.scoreRequest.chartLevel,
        score: currentItem.scoreRequest.score,
        plate: currentItem.scoreRequest.plate,
        isBroken: currentItem.scoreRequest.isBroken
      }, { emitEvent: false });

      let formValidItem = { ...this.item() };
      formValidItem.formValid = this.itemForm.valid;
      this.formValidItem.emit(formValidItem);
    }
  });

  saveItem(): void {
    if (this.itemForm.invalid || this.item().status === ScanStatus.Saving || this.item().status === ScanStatus.Saved) {
      return;
    }

    const { songName, chartType, chartLevel, score, plate, isBroken } = this.itemForm.value;
    const scoreRequest: ScoreRequest = {
      songName: songName!,
      chartType: chartType!,
      chartLevel: chartLevel!,
      score: score ?? null,
      plate: plate && plate !== '' ? plate : null,
      isBroken: isBroken === true
    };

    let updatedItem = this.item();
    updatedItem.scoreRequest = scoreRequest;
    this.updatedItem.emit(updatedItem);
  }

  removeItem(): void {
    this.removedItem.emit(this.item());
  }

  retryItem(): void {
    this.rescanItem.emit(this.item());
  }

  private buildForm(): FormGroup<ProcessImagesItemFormGroup> {
    return this.fb.group({
      songName: [this.item().scoreRequest?.songName ?? '', Validators.required],
      chartType: [this.item().scoreRequest?.chartType ?? ChartType.Single, Validators.required],
      chartLevel: [this.item().scoreRequest?.chartLevel ?? PiuSongsUtils.minLevel, [
        Validators.required,
        Validators.min(PiuSongsUtils.minLevel),
        Validators.max(PiuSongsUtils.maxLevel)
      ]],
      score: [
        this.item().scoreRequest?.score ?? null,
        [Validators.required, Validators.min(0), Validators.max(PiuSongsUtils.maxScore)]
      ],
      plate: [this.item().scoreRequest?.plate ?? ''],
      isBroken: [this.item().scoreRequest?.isBroken === true]
    }, {
      validators: [PiuSongsUtils.plateRequiredWhenBrokenValidator]
    }) as FormGroup<ProcessImagesItemFormGroup>;
  }
}
