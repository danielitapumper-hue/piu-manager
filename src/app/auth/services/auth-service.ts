import { computed, inject, Injectable, signal } from '@angular/core';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials';

interface Credentials {
  username?: string;
  basicAuthorization?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _credentials = signal<Credentials | null>(this.getCredentialsFromLocalStorage());

  piuscoresService = inject(PiuscoresService);
  router = inject(Router);

  basicAuthorization = computed<string>(() => this._credentials()?.basicAuthorization ?? '');
  userName = computed<string>(() => this._credentials()?.username ?? '');

  login(username: string, token: string): Observable<boolean> {
    const encoded = btoa(`:${token}`);
    this._credentials.set({
      username: username,
      basicAuthorization: encoded
    });

    return this.piuscoresService.getPhoenixScores(1, 1).pipe(
      map(() => {
        localStorage.setItem(LOCAL_STORAGE_CREDENTIALS_KEY, JSON.stringify(this._credentials()));
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  logout(): void {
    this._credentials.set(null);
    localStorage.removeItem(LOCAL_STORAGE_CREDENTIALS_KEY);
    this.router.navigate(['/login']);
  }

  checkStatus(): boolean {
    return this._credentials() !== null;
  }

  private getCredentialsFromLocalStorage(): Credentials | null {
    const localStorageCredentials = localStorage.getItem(LOCAL_STORAGE_CREDENTIALS_KEY);
    return localStorageCredentials
      ? JSON.parse(localStorageCredentials)
      : null;
  }
}
