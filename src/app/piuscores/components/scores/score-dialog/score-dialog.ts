import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Score } from '@piuscores/interfaces/score';
import { ScoreData } from "../score-data/score-data";
import { ScoreForm } from "../score-form/score-form";
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-score-dialog',
  imports: [ScoreData, ScoreForm, DecimalPipe],
  templateUrl: './score-dialog.html',
})
export class ScoreDialog {
  dialogRef = inject<DialogRef<ChartScore | undefined>>(DialogRef<ChartScore | undefined>);
  chartScore = inject<ChartScore>(DIALOG_DATA);

  newScore = signal<number>(0);

  closeDialog(): void {
    this.dialogRef.close(this.chartScore);
  }

  handleScoreSaved(updatedScore: Score | undefined): void {
    if (updatedScore) {
      const currentScore = this.chartScore.score?.score ?? 0;
      if (updatedScore.score > currentScore) {
        this.newScore.set(updatedScore.score - currentScore);
      }
      else {
        this.newScore.set(0);
      }
    }

    this.chartScore = {
      ...this.chartScore,
      score: updatedScore,
    };
  }
}
