import { Component, input, output, signal } from '@angular/core';
import { ChartScore } from '@piuscores/interfaces/chart-score';

@Component({
  selector: 'song-randomizer',
  imports: [],
  templateUrl: './song-randomizer.html',
})
export class SongRandomizer {
  chartScoreList = input.required<ChartScore[]>();
  category = input<string>();
  dropDownExtraClasses = input<string>();
  randomChart = signal<ChartScore | null>(null);

  randomizeChart() {
    const lenght = this.chartScoreList().length;
    if (lenght === 0) {
      this.randomChart.set(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * lenght);
    this.randomChart.set(this.chartScoreList()[randomIndex] ?? null);
  }
}
