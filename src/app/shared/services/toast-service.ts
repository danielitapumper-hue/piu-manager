import { Injectable, signal } from '@angular/core';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', durationMs = 4000) {
    const id = PiuSongsUtils.generateId();
    const newToast: ToastMessage = { id, message, type };

    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(message: string, durationMs?: number) {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number) {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs?: number) {
    this.show(message, 'info', durationMs);
  }

  warning(message: string, durationMs?: number) {
    this.show(message, 'warning', durationMs);
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
