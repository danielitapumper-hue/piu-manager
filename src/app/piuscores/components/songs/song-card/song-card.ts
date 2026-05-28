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
  chartScore = input.required<ChartScore>();

  openYoutubeSearch() {
    const song = this.chartScore().chart.song.name;
    const shorthand = this.chartScore().chart.shorthand;
    const query = `PUMP IT UP ${song} ${shorthand}`;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    window.open(youtubeSearchUrl, '_blank', 'noopener,noreferrer');
  }
}
