import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';

export type ScoreDataSize = 'sm' | 'lg';

@Component({
  selector: 'score-data',
  imports: [DecimalPipe, ImageSrcPipe],
  templateUrl: './score-data.html',
})
export class ScoreData {
  chartScore = input.required<ChartScore>();
  scoreDataSize = input.required<ScoreDataSize>();
}
