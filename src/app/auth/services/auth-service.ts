import { computed, inject, Injectable, signal } from '@angular/core';
import { PiuscoresService } from '../../piuscores/services/piuscores-service';

const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  piuscoresService = inject(PiuscoresService);
  private _basicAuthorization = signal<string | null>(localStorage.getItem(LOCAL_STORAGE_CREDENTIALS_KEY));
  basicAuthorization = computed<string | null>(() => this._basicAuthorization());

  login(token: string): boolean {
    const encoded = btoa(`username:${token}`);
    this.piuscoresService.getPhoenixScores(1);

    this._basicAuthorization.set(encoded);
    localStorage.setItem(LOCAL_STORAGE_CREDENTIALS_KEY, encoded);
    return true;
  }

  logout(): void {
    this._basicAuthorization.set(null);
    localStorage.removeItem(LOCAL_STORAGE_CREDENTIALS_KEY);
  }

  getBasicAuthorization(): string | null {
    return this._basicAuthorization();
  }
}
