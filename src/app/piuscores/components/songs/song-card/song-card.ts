import { Component, input, inject, output, DestroyRef } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Dialog } from '@angular/cdk/dialog';
import { ScoreData } from '@piuscores/components/scores/score-data/score-data';
import { ScoreDialog } from '@piuscores/components/scores/score-dialog/score-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShortHandImagePipe } from '@piuscores/pipes/short-hand-image-pipe';
import { LocalStorageService } from '@shared/services/local-storage-service';

@Component({
  selector: 'song-card',
  imports: [ScoreData, ShortHandImagePipe],
  templateUrl: './song-card.html',
})
export class SongCard {
  localStorageService = inject(LocalStorageService);
  dialog = inject(Dialog);
  destroyRef = inject(DestroyRef);
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
    const dialogRef = this.dialog.open<ChartScore | undefined>(ScoreDialog, {
      data: this.chartScore(),
      backdropClass: 'bg-base-100/90'
    });

    dialogRef.closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedChartScore) => {
        if (updatedChartScore) {
          this.chartScoreUpdated.emit(updatedChartScore);
        }
      });
  }
}
