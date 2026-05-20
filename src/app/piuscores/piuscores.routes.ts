import { Routes } from '@angular/router';
import { PiuscoresLayout } from './layouts/piuscores-layout/piuscores-layout';
import { ScoresPage } from './pages/scores-page/scores-page';

export const piuscoresRoutes: Routes = [
  {
    path: '',
    component: PiuscoresLayout,
    children: [
      {
        path: 'scores',
        component: ScoresPage
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'scores'
  }
];

export default piuscoresRoutes;
