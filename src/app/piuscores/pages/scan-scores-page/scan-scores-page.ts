import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from "@piuscores/components/title/title";
import { GeminiApiKeyConfig } from "@piuscores/components/gemini-api-key/gemini-api-key-config/gemini-api-key-config";
import { UploadImages } from "@piuscores/components/images/upload-images/upload-images";
import { ProcessImages } from "@piuscores/components/images/process-images/process-images";
import { LocalStorageService } from '@piuscores/services/local-storage-service';

@Component({
  selector: 'app-scan-scores-page',
  imports: [Title, GeminiApiKeyConfig, UploadImages, ProcessImages],
  templateUrl: './scan-scores-page.html',
})
export class ScanScoresPage {
  private localStorageService = inject(LocalStorageService);

  filesList = signal<File[]>([]);
  geminiApiKey = computed<string>(() => this.localStorageService.geminiApiKey());

  geminiApiKeyEffect = effect(() => {
    if (!this.geminiApiKey())
      this.filesList.set([]);
  });

  processFiles(files: FileList) {
    this.filesList.set(Array.from(files));
  }
}
