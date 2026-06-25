import { Component, computed, inject } from '@angular/core';
import { LocalStorageService } from '@shared/services/local-storage-service';
import { ProcessImagesService } from '@gemini/services/process-images-service';
import { ImageScannerProvider, ScannerProviderId } from '@gemini/providers/image-scanner-provider.interface';

@Component({
  selector: 'gemini-api-key-config',
  imports: [],
  templateUrl: './gemini-api-key-config.html',
})
export class GeminiApiKeyConfig {
  private localStorageService = inject(LocalStorageService);
  private processImagesService = inject(ProcessImagesService);

  readonly availableProviders: ImageScannerProvider[] = this.processImagesService.availableProviders;

  selectedProviderId = computed<ScannerProviderId>(
    () => this.localStorageService.scannerProvider() as ScannerProviderId
  );

  selectedProvider = computed<ImageScannerProvider | undefined>(
    () => this.availableProviders.find(p => p.id === this.selectedProviderId())
  );

  geminiApiKey = computed<string>(() => this.localStorageService.geminiApiKey());
  openrouterApiKey = computed<string>(() => this.localStorageService.openrouterApiKey());
  githubApiKey = computed<string>(() => this.localStorageService.githubApiKey());

  activeApiKey = computed<string>(() => {
    switch (this.selectedProviderId()) {
      case 'openrouter': return this.openrouterApiKey();
      case 'github': return this.githubApiKey();
      default: return this.geminiApiKey();
    }
  });

  selectProvider(providerId: string): void {
    this.localStorageService.setLocalStorageScannerProvider(providerId as ScannerProviderId);
  }

  saveApiKey(key: string): void {
    const trimmed = key.trim();
    switch (this.selectedProviderId()) {
      case 'openrouter':
        this.localStorageService.setLocalStorageOpenRouterApiKey(trimmed);
        break;
      case 'github':
        this.localStorageService.setLocalStorageGithubApiKey(trimmed);
        break;
      default:
        this.localStorageService.setLocalStorageGeminiApiKey(trimmed);
    }
  }
}
