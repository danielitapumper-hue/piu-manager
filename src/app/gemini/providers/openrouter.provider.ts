import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GEMINI_PROMPTS } from '@gemini/constants/gemini-prompts.constant';
import { ImageScannerProvider, SCANNER_PROVIDER_IDS } from './image-scanner-provider.interface';
import { BYPASS_AUTH } from '@auth/interceptors/auth-interceptor';

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
}

@Injectable({ providedIn: 'root' })
export class OpenRouterScannerProvider implements ImageScannerProvider {
  private http = inject(HttpClient);

  readonly id = SCANNER_PROVIDER_IDS.OPENROUTER;
  readonly name = 'OpenRouter';
  readonly modelDescription = 'nvidia/nemotron-nano-12b-v2-vl:free';

  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

  postImage(mimeType: string, base64Data: string, apiKey: string): Observable<OpenRouterResponse> {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const payload = {
      model: this.modelDescription,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: GEMINI_PROMPTS },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0
    };
    return this.http.post<OpenRouterResponse>(this.OPENROUTER_URL, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PIU Manager'
      },
      context: new HttpContext().set(BYPASS_AUTH, true)
    });
  }

  parseResponse(response: unknown): string {
    const r = response as OpenRouterResponse;
    const text = r?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No text response received from OpenRouter API');
    return text;
  }
}
