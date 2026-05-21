import { Component, inject } from '@angular/core';
import { AuthService } from '@auth/services/auth-service';

@Component({
  selector: 'navbar',
  imports: [],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);
}
