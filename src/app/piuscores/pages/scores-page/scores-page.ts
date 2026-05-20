import { Component, inject } from '@angular/core';
import { PiuscoresService } from '../../services/piuscores-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-scores-page',
  imports: [DecimalPipe],
  templateUrl: './scores-page.html',
})
export class ScoresPage {
  piuScoresService = inject(PiuscoresService);

  scoresResource = rxResource({
    params: () => ({}),
    stream: ({ }) => {
      // return of(null);
      return this.piuScoresService.getPhoenixScores(1);
    }
  });
}
