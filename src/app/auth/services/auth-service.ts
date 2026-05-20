import { computed, inject, Injectable, signal } from '@angular/core';
import { PiuscoresService } from '../../piuscores/services/piuscores-service';
import { catchError, map, Observable, of } from 'rxjs';

const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _basicAuthorization = signal<string | null>(localStorage.getItem(LOCAL_STORAGE_CREDENTIALS_KEY));
  piuscoresService = inject(PiuscoresService);
  basicAuthorization = computed<string | null>(() => this._basicAuthorization());

  login(username: string, token: string): Observable<boolean> {
    const encoded = btoa(`${username}:${token}`);
    this._basicAuthorization.set(encoded);

    console.log({ basicAuth: this._basicAuthorization() });

    return this.piuscoresService.getPhoenixScores(1).pipe(
      map(resp => {
        localStorage.setItem(LOCAL_STORAGE_CREDENTIALS_KEY, encoded);
        return true;
      }),
      catchError(error => {
        this.logout();
        return of(false);
      })
    );
  }

  logout(): void {
    this._basicAuthorization.set(null);
    localStorage.removeItem(LOCAL_STORAGE_CREDENTIALS_KEY);
  }
}
