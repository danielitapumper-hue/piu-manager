import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';

export const notAuthenticatedGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.checkStatus()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
