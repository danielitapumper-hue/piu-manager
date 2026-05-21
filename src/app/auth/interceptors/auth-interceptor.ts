import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject the current `AuthService` and use it to get an authentication token:
  const basicAuthorization = inject(AuthService).basicAuthorization() ?? '';
  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Basic ${basicAuthorization}`)
  });
  return next(newReq);
};
