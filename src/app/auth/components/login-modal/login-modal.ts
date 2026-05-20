import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'login-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './login-modal.html',
})
export class LoginModal {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  hasError = signal(false);

  loginForm = this.fb.group({
    token: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const { token } = this.loginForm.value;
      this.authService.login(token!);
      this.hasError.set(false);
    } else {
      this.hasError.set(true);
    }
  }
}
