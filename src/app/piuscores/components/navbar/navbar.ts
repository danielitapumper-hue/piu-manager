import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@auth/services/auth-service';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { UpperCasePipe } from '@angular/common';
import { MIX_OPTIONS, MixOption } from '@piuscores/interfaces/piuscores-services/score-request';
import { LocalStorageService } from '@shared/services/local-storage-service';

@Component({
  selector: 'navbar',
  imports: [RouterLink, RouterLinkActive, UpperCasePipe],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);
  localStorageService = inject(LocalStorageService);
  readonly mixOptions = MIX_OPTIONS;

  setGlobalMix(mix: MixOption): void {
    this.localStorageService.setLocalStorageMix(mix);
  }
}
