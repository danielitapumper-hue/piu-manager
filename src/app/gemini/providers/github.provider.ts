import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PROMPTS } from '@gemini/constants/prompts.constant';
import { ImageScannerProvider, SCANNER_PROVIDER_IDS } from './image-scanner-provider.interface';
import { BYPASS_AUTH } from '@auth/interceptors/auth-interceptor';

interface GithubModelsResponse {
  choices?: { message?: { content?: string } }[];
}

@Injectable({ providedIn: 'root' })
export class GithubScannerProvider implements ImageScannerProvider {
  private http = inject(HttpClient);

  readonly id = SCANNER_PROVIDER_IDS.GITHUB;
  readonly name = 'GitHub Models';
  readonly modelDescription = 'gpt-4o-mini';

  private readonly GITHUB_URL = 'https://models.inference.ai.azure.com/chat/completions';

  postImage(mimeType: string, base64Data: string, apiKey: string): Observable<GithubModelsResponse> {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const payload = {
      model: this.modelDescription,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPTS },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0
    };
    return this.http.post<GithubModelsResponse>(this.GITHUB_URL, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      context: new HttpContext().set(BYPASS_AUTH, true)
    });
  }

  parseResponse(response: unknown): string {
    const r = response as GithubModelsResponse;
    const text = r?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No text response received from GitHub Models API');
    return text;
  }
}
