import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';

@Component({
  selector: 'song-card',
  imports: [DecimalPipe, ImageSrcPipe],
  templateUrl: './song-card.html',
})
export class SongCard {
  chartScore = input.required<ChartScore>()
}
