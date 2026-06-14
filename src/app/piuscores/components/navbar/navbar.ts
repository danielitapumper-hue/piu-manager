import { Component, inject } from '@angular/core';
import { AuthService } from '@auth/services/auth-service';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'navbar',
  imports: [RouterLink, RouterLinkActive, UpperCasePipe],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);
}
