import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { DecimalPipe } from '@angular/common';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { PiuscoresService } from '@piuscores/services/piuscores-service';

@Component({
  selector: 'app-song-dialog',
  imports: [DecimalPipe, ImageSrcPipe, ReactiveFormsModule],
  templateUrl: './song-dialog.html',
})
export class SongDialog {
  dialogRef = inject<DialogRef<string>>(DialogRef<string>);
  chartScore = inject<ChartScore>(DIALOG_DATA);
  fb = inject(FormBuilder);
  piuscoresService = inject(PiuscoresService);

  plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));

  scoreForm = this.fb.group({
    score: [this.chartScore.score?.score, [Validators.required, Validators.min(0), Validators.max(1000000)]],
    plate: [this.chartScore.score?.plate ? this.plateOptions.find(item => item.value === this.chartScore.score?.plate)?.key : null],
    isBroken: [this.chartScore.score ? this.chartScore.score.isBroken : true]
  });

  formSubmit() {
    if (this.scoreForm.invalid)
      return;

    const scoreRequest: ScoreRequest = {
      chartLevel: this.chartScore.chart.level,
      chartType: this.chartScore.chart.type,
      isBroken: this.scoreForm.value.isBroken == true,
      plate: this.scoreForm.value.plate ? this.scoreForm.value.plate : null,
      score: this.scoreForm.value.score ? this.scoreForm.value.score : null,
      songName: this.chartScore.chart.song.name
    };

    this.piuscoresService.postScore(scoreRequest).subscribe();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
