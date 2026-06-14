import { Component, computed, inject } from '@angular/core';
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'gemini-api-key-config',
  imports: [],
  templateUrl: './gemini-api-key-config.html',
})
export class GeminiApiKeyConfig {
  private localStorageService = inject(LocalStorageService);

  geminiApiKey = computed<string>(() => this.localStorageService.geminiApiKey());

  saveApiKey(key: string): void {
    this.localStorageService.setLocalStorageGeminiApiKey(key.trim());
  }
}
