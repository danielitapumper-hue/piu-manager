import { Component, signal } from '@angular/core';
import { Title } from "@piuscores/components/title/title";
import { GeminiApiKeyConfig } from "@piuscores/components/gemini-api-key/gemini-api-key-config/gemini-api-key-config";
import { UploadImages } from "@piuscores/components/images/upload-images/upload-images";
import { ProcessImages } from "@piuscores/components/images/process-images/process-images";

@Component({
  selector: 'app-scan-scores-page',
  imports: [Title, GeminiApiKeyConfig, UploadImages, ProcessImages],
  templateUrl: './scan-scores-page.html',
})
export class ScanScoresPage {
  files = signal<FileList | null>(null);

  processFiles(files: FileList) {
    this.files.set(files);
  }
}
