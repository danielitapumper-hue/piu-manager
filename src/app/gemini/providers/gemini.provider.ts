import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PROMPTS } from '@gemini/constants/prompts.constant';
import { GeminiGenerateContentResponse } from '@gemini/interfaces/gemini-response';
import { ImageScannerProvider, SCANNER_PROVIDER_IDS } from './image-scanner-provider.interface';
import { BYPASS_AUTH } from '@auth/interceptors/auth-interceptor';

@Injectable({ providedIn: 'root' })
export class GeminiScannerProvider implements ImageScannerProvider {
  private http = inject(HttpClient);

  readonly id = SCANNER_PROVIDER_IDS.GEMINI;
  readonly name = 'Google Gemini';
  readonly modelDescription = 'gemini-2.5-flash';

  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  postImage(mimeType: string, base64Data: string, apiKey: string): Observable<GeminiGenerateContentResponse> {
    const url = `${this.GEMINI_URL}/${this.modelDescription}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: PROMPTS },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.0
      }
    };
    return this.http.post<GeminiGenerateContentResponse>(url, payload, {
      context: new HttpContext().set(BYPASS_AUTH, true)
    });
  }

  parseResponse(response: unknown): string {
    const r = response as GeminiGenerateContentResponse;
    const text = r?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text response received from Gemini API');
    return text;
  }
}
