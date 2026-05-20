import { Routes } from '@angular/router';
import { ScoresPage } from './piuscores/pages/scores-page/scores-page';

export const routes: Routes = [
  {
    path: 'scores',
    component: ScoresPage,
  },
  {
    path: '**',
    redirectTo: 'scores'
  }
];
