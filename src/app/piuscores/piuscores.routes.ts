import { Routes } from '@angular/router';
import { PiuscoresLayout } from './layouts/piuscores-layout/piuscores-layout';
import { ScoresPage } from './pages/scores-page/scores-page';
import { TierListsPage } from './pages/tier-lists-page/tier-lists-page';

export const piuscoresRoutes: Routes = [
  {
    path: '',
    component: PiuscoresLayout,
    children: [
      {
        path: 'tier-lists',
        component: TierListsPage
      },
      {
        path: 'scores',
        component: ScoresPage
      },
      {
        path: '**',
        redirectTo: 'tier-lists'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'tier-lists'
  }
];

export default piuscoresRoutes;
