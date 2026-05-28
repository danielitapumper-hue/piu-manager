import { DecimalPipe } from '@angular/common';
import { Component, input, inject } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { ImageSrcPipe } from '@piuscores/pipes/image-src-pipe';
import { Dialog } from '@angular/cdk/dialog';
import { SongDialog } from '../song-dialog/song-dialog';

@Component({
  selector: 'song-card',
  imports: [DecimalPipe, ImageSrcPipe],
  templateUrl: './song-card.html',
})
export class SongCard {
  dialog = inject(Dialog);
  chartScore = input.required<ChartScore>();

  openYoutubeSearch() {
    const song = this.chartScore().chart.song.name;
    const shorthand = this.chartScore().chart.shorthand;
    const query = `PUMP IT UP ${song} ${shorthand}`;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    window.open(youtubeSearchUrl, '_blank', 'noopener,noreferrer');
  }

  openDialog() {
    const dialogRef = this.dialog.open<string>(SongDialog, {
      data: this.chartScore(),
      backdropClass: 'bg-base-100/90'
    });

    // dialogRef.closed.subscribe(result => {
    //   console.log('The dialog was closed');
    // });
  }
}
