import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Score } from '@piuscores/interfaces/score';
import { ScoreData } from "../score-data/score-data";
import { ScoreForm } from "../score-form/score-form";

@Component({
  selector: 'app-song-dialog',
  imports: [ScoreData, ScoreForm],
  templateUrl: './song-dialog.html',
})
export class SongDialog {
  dialogRef = inject<DialogRef<ChartScore | undefined>>(DialogRef<ChartScore | undefined>);
  chartScore = inject<ChartScore>(DIALOG_DATA);

  closeDialog(): void {
    this.dialogRef.close(this.chartScore);
  }

  handleScoreSaved(updatedScore: Score | undefined): void {
    this.chartScore = {
      ...this.chartScore,
      score: updatedScore,
    };
  }
}
