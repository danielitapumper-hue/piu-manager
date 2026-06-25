import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth/services/auth-service';

// Context Token que permite a peticiones específicas evadir este interceptor
export const BYPASS_AUTH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Verificamos si la petición tiene el token de evasión en su contexto
  if (req.context.get(BYPASS_AUTH)) {
    return next(req);
  }

  // Inject the current `AuthService` and use it to get an authentication token:
  const basicAuthorization = inject(AuthService).basicAuthorization() ?? '';
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.set('Authorization', `Basic ${basicAuthorization}`)
  });
  return next(newReq);
};
