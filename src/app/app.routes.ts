import { Routes } from '@angular/router';
import { LoginPage } from './auth/pages/login-page/login-page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    loadChildren: () => import('./piuscores/piuscores.routes'),
    canMatch: [

    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
