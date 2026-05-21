import { Routes } from '@angular/router';
import { LoginPage } from './auth/pages/login-page/login-page';
import { authenticatedGuard } from './auth/guards/authenticated-guard';
import { notAuthenticatedGuard } from './auth/guards/not-authenticated-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    canMatch: [notAuthenticatedGuard]
  },
  {
    path: '',
    loadChildren: () => import('./piuscores/piuscores.routes'),
    canMatch: [authenticatedGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
