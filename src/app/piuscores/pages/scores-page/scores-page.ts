import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { PiuscoresService } from '@piuscores/services/piuscores-service';

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
      return this.piuScoresService.getPhoenixScores(1);
    }
  });
}
