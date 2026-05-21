import { Component, inject } from '@angular/core';
import { PiuscoresService } from '../../services/piuscores-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../../../auth/services/auth-service';

@Component({
  selector: 'app-scores-page',
  imports: [DecimalPipe],
  templateUrl: './scores-page.html',
})
export class ScoresPage {
  //Injectables
  authService = inject(AuthService);
  piuScoresService = inject(PiuscoresService);

  scoresResource = rxResource({
    params: () => ({}),
    stream: ({ }) => {
      return this.piuScoresService.getPhoenixScores(1);
    }
  });
}
