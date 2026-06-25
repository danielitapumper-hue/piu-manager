import { Observable } from 'rxjs';

export const SCANNER_PROVIDER_IDS = {
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter',
  SAMBANOVA: 'sambanova',
  GITHUB: 'github',
} as const;

export type ScannerProviderId = (typeof SCANNER_PROVIDER_IDS)[keyof typeof SCANNER_PROVIDER_IDS];

export interface ScannerProviderConfig {
  id: ScannerProviderId;
  name: string;
  modelDescription: string;
}

export interface ImageScannerProvider extends ScannerProviderConfig {
  postImage(mimeType: string, base64Data: string, apiKey: string): Observable<unknown>;
  parseResponse(response: unknown): string;
}
