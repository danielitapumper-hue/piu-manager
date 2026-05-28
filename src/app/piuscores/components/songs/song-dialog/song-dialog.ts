import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { DecimalPipe } from '@angular/common';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-song-dialog',
  imports: [DecimalPipe, ImageSrcPipe, ReactiveFormsModule],
  templateUrl: './song-dialog.html',
})
export class SongDialog {
  dialogRef = inject<DialogRef<string>>(DialogRef<string>);
  chartScore = inject<ChartScore>(DIALOG_DATA);
  fb = inject(FormBuilder);

  plateOptions = Object.values(Plate);

  scoreForm = this.fb.group({
    score: [this.chartScore.score?.score, Validators.required],
    plate: [this.chartScore.score?.plate],
    isBroken: [this.chartScore.score?.isBroken]
  });

  formSubmit() {

  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
