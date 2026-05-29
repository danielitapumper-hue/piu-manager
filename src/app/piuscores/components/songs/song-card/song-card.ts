import { Component, input, inject, output } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Dialog } from '@angular/cdk/dialog';
import { SongDialog } from '../song-dialog/song-dialog';
import { ScoreData } from "../score-data/score-data";

@Component({
  selector: 'song-card',
  imports: [ScoreData],
  templateUrl: './song-card.html',
})
export class SongCard {
  dialog = inject(Dialog);
  chartScore = input.required<ChartScore>();
  chartScoreUpdated = output<ChartScore>();

  openYoutubeSearch(event: Event) {
    event.stopPropagation();
    const song = this.chartScore().chart.song.name;
    const shorthand = this.chartScore().chart.shorthand;
    const query = `PUMP IT UP ${song} ${shorthand}`;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    window.open(youtubeSearchUrl, '_blank', 'noopener,noreferrer');
  }

  openDialog() {
    const dialogRef = this.dialog.open<ChartScore | undefined>(SongDialog, {
      data: this.chartScore(),
      backdropClass: 'bg-base-100/90'
    });

    dialogRef.closed.subscribe((updatedChartScore) => {
      if (updatedChartScore) {
        this.chartScoreUpdated.emit(updatedChartScore);
      }
    });
  }
}
