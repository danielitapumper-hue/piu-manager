import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from "@piuscores/components/title/title";
import { UploadImages } from "@piuscores/components/images/upload-images/upload-images";
import { ProcessImages } from "@piuscores/components/images/process-images/process-images";
import { GeminiApiKeyConfig } from '@gemini/components/gemini-api-key-config/gemini-api-key-config';
import { LocalStorageService } from '@shared/services/local-storage-service';
import { ProcessImagesService } from '@gemini/services/process-images-service';
import { ScannerProviderId } from '@gemini/providers/image-scanner-provider.interface';

@Component({
  selector: 'app-scan-scores-page',
  imports: [Title, GeminiApiKeyConfig, UploadImages, ProcessImages],
  templateUrl: './scan-scores-page.html',
})
export class ScanScoresPage {
  private localStorageService = inject(LocalStorageService);
  private processImagesService = inject(ProcessImagesService);

  filesList = signal<File[]>([]);

  /** True when the currently selected provider has an API Key configured. */
  hasActiveApiKey = computed<boolean>(() => {
    const providerId = this.localStorageService.scannerProvider() as ScannerProviderId;
    return !!this.processImagesService.getApiKeyForProvider(providerId);
  });

  activeApiKeyEffect = effect(() => {
    if (!this.hasActiveApiKey())
      this.filesList.set([]);
  });

  processFiles(files: FileList) {
    this.filesList.set(Array.from(files));
  }
}
