import { inject, Injectable } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocalStorageService } from '@shared/services/local-storage-service';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { ImageScannerProvider, ScannerProviderId } from '@gemini/providers/image-scanner-provider.interface';
import { GeminiScannerProvider } from '@gemini/providers/gemini.provider';
import { OpenRouterScannerProvider } from '@gemini/providers/openrouter.provider';
import { GithubScannerProvider } from '@gemini/providers/github.provider';

@Injectable({
  providedIn: 'root',
})
export class ProcessImagesService {
  private localStorageService = inject(LocalStorageService);
  private geminiProvider = inject(GeminiScannerProvider);
  private openRouterProvider = inject(OpenRouterScannerProvider);
  private githubProvider = inject(GithubScannerProvider);

  private readonly providers = new Map<ScannerProviderId, ImageScannerProvider>([
    ['gemini', this.geminiProvider],
    ['github', this.githubProvider],
    ['openrouter', this.openRouterProvider],
  ] as [ScannerProviderId, ImageScannerProvider][]);

  get availableProviders(): ImageScannerProvider[] {
    return Array.from(this.providers.values());
  }

  fileToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        observer.next(base64Data);
        observer.complete();
      };
      reader.onerror = error => observer.error(error);

      return () => {
        if (reader.readyState === 1) {
          reader.abort();
        }
      };
    });
  }

  scanImage(mimeType: string, base64Data: string): Observable<ScoreRequest> {
    const providerId = this.localStorageService.scannerProvider() as ScannerProviderId;
    const provider = this.providers.get(providerId);
    if (!provider) {
      return throwError(() => new Error(`Proveedor desconocido: ${providerId}`));
    }

    const apiKey = this.getApiKeyForProvider(providerId);
    if (!apiKey) {
      return throwError(() => new Error(`No hay API Key configurada para ${provider.name}`));
    }

    return provider.postImage(mimeType, base64Data, apiKey).pipe(
      map(response => {
        const rawText = provider.parseResponse(response);
        return this.mapToScoreRequest(JSON.parse(rawText));
      })
    );
  }

  getApiKeyForProvider(providerId: ScannerProviderId): string {
    switch (providerId) {
      case 'gemini': return this.localStorageService.geminiApiKey();
      case 'openrouter': return this.localStorageService.openrouterApiKey();
      case 'github': return this.localStorageService.githubApiKey();
      default: return '';
    }
  }

  get activeProvider(): ImageScannerProvider | undefined {
    const providerId = this.localStorageService.scannerProvider() as ScannerProviderId;
    return this.providers.get(providerId);
  }

  private mapToScoreRequest(data: Record<string, unknown>): ScoreRequest {
    let plateKey = '';
    if (data['plate']) {
      const matchedOption = PiuSongsUtils.getPlateKey(data['plate'] as Plate);
      if (matchedOption) {
        plateKey = matchedOption;
      }
    }

    return {
      songName: (data['songName'] as string) || 'Unknown Song',
      chartType: data['chartType'] === 'Double' ? ChartType.Double : ChartType.Single,
      chartLevel: (data['chartLevel'] as number) || PiuSongsUtils.minLevel,
      score: (data['score'] as number) ?? null,
      plate: plateKey,
      isBroken: data['isBroken'] === true
    };
  }
}
