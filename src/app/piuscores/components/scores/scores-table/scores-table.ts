import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Result } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';

@Component({
  selector: 'scores-table',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './scores-table.html',
})
export class ScoresTable {
  scores = input<Result[]>([]);
  now = Date.now();

  daysAgo(date: Date): number {
    const now = new Date();
    const pastDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - pastDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
