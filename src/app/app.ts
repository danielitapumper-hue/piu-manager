import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './shared/services/toast-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('piu-manager');
  toastService = inject(ToastService);
}
