import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScanItem } from '@piuscores/interfaces/files/scan-item';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

@Component({
  selector: 'process-images-item',
  imports: [ReactiveFormsModule],
  templateUrl: './process-images-item.html',
})
export class ProcessImagesItem {
  fb = inject(FormBuilder);

  item = input.required<ScanItem>();
  updatedItem = output<ScanItem>();
  removedItem = output<ScanItem>();
  formValidItem = output<ScanItem>();

  itemForm!: ReturnType<FormBuilder['group']>;
  previousScoreValue = '';

  readonly chartTypes = PiuSongsUtils.chartTypes;
  readonly plateOptions = PiuSongsUtils.plateOptions;

  ngOnInit(): void {
    this.itemForm = this.buildForm();
    this.previousScoreValue = this.item().scoreRequest?.score?.toString() ?? '';

    this.itemForm.get('isBroken')!.valueChanges
      .subscribe((isBroken) => {
        if (isBroken)
          this.itemForm.get('plate')?.setValue('');
      });

    this.itemForm.get('plate')!.valueChanges
      .subscribe((plateKey) => {
        if (plateKey) {
          if (plateKey === PiuSongsUtils.perfectGameKey) {
            this.itemForm.get('score')?.setValue(PiuSongsUtils.maxScore);
            this.previousScoreValue = PiuSongsUtils.maxScore.toString();
          }
          this.itemForm.get('isBroken')?.setValue(false);
        }
      });

    this.itemForm.statusChanges.subscribe((status) => {
      let formValidItem = { ...this.item() };
      formValidItem.formValid = status === 'VALID';
      this.formValidItem.emit(formValidItem);
    });

  }

  private lastPatchedScoreRequest: ScoreRequest | undefined = undefined;

  itemEffect = effect(() => {
    const currentItem = this.item();

    if (currentItem.status === 'saved') {
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
    if (this.itemForm.invalid || this.item().status === 'saving' || this.item().status === 'saved') {
      return;
    }

    const { songName, chartType, chartLevel, score, plate, isBroken } = this.itemForm.value;
    const scoreRequest: ScoreRequest = {
      songName,
      chartType,
      chartLevel,
      score: score ?? null,
      plate: plate != '' ? plate : null,
      isBroken: isBroken === true
    };

    let updatedItem = this.item();
    updatedItem.scoreRequest = scoreRequest;
    this.updatedItem.emit(updatedItem);
  }

  removeItem(): void {
    this.removedItem.emit(this.item());
  }

  private buildForm() {
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
    });
  }
}
