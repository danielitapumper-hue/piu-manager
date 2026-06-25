import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GEMINI_PROMPTS } from '@gemini/constants/gemini-prompts.constant';
import { ImageScannerProvider, SCANNER_PROVIDER_IDS } from './image-scanner-provider.interface';
import { BYPASS_AUTH } from '@auth/interceptors/auth-interceptor';

interface SambaNovaResponse {
  choices?: { message?: { content?: string } }[];
}

@Injectable({ providedIn: 'root' })
export class SambaNovaScannerProvider implements ImageScannerProvider {
  private http = inject(HttpClient);

  readonly id = SCANNER_PROVIDER_IDS.SAMBANOVA;
  readonly name = 'SambaNova Cloud';
  readonly modelDescription = 'Llama-3.2-11B-Vision-Instruct';

  private readonly SAMBANOVA_URL = 'https://api.sambanova.ai/v1/chat/completions';

  postImage(mimeType: string, base64Data: string, apiKey: string): Observable<SambaNovaResponse> {
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
    return this.http.post<SambaNovaResponse>(this.SAMBANOVA_URL, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      context: new HttpContext().set(BYPASS_AUTH, true)
    });
  }

  parseResponse(response: unknown): string {
    const r = response as SambaNovaResponse;
    const text = r?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No text response received from SambaNova API');
    return text;
  }
}
