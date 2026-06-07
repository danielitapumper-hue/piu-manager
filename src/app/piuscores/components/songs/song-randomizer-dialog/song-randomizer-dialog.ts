import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { SearchFilters } from '@piuscores/interfaces/search-filters';

export interface SongRandomizerDialogData {
  chartScoreList: ChartScore[],
  category: string | undefined,
  lastFilter: SearchFilters
}

@Component({
  selector: 'app-song-randomizer-dialog',
  imports: [],
  templateUrl: './song-randomizer-dialog.html',
})
export class SongRandomizerDialog {
  dialogRef = inject<DialogRef<SongRandomizerDialogData>>(DialogRef<SongRandomizerDialogData>);
  data = inject<SongRandomizerDialogData>(DIALOG_DATA);
  randomChart = signal<ChartScore | null>(null);

  ngOnInit() {
    this.randomizeChart();
  }

  randomizeChart() {
    const lenght = this.data.chartScoreList.length;
    if (lenght === 0) {
      this.randomChart.set(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * lenght);
    this.randomChart.set(this.data.chartScoreList[randomIndex] ?? null);
  }

  close() {
    this.dialogRef.close();
  }
}
