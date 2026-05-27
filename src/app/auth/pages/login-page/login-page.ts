import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
})
export class LoginPage {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  hasError = signal(false);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    token: ['', Validators.required],
  });

  onSubmit() {
    if (!this.loginForm.valid) {
      this.showErrorMessage();
      return;
    }
    const { username, token } = this.loginForm.value;
    this.authService.login(username!, token!)
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/']);
          return;
        }

        this.showErrorMessage();
      });
  }

  private showErrorMessage() {
    this.hasError.set(true);
    setTimeout(() => {
      this.hasError.set(false);
    }, 2000);
  }
}
