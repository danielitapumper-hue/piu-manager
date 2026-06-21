import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { GEMINI_PROMPTS } from '@gemini/constants/gemini-prompts.constant';
import { LocalStorageService } from '@shared/services/local-storage-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProcessImagesService {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);

  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly GEMINI_VERSION = 'gemini-2.5-flash';

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

      // Cleanup
      return () => {
        if (reader.readyState === 1) {
          reader.abort();
        }
      };
    });
  }

  postImage(mimeType: string, base64Data: string) {
    const key = this.localStorageService.geminiApiKey();
    if (!key) {
      return;
    }
    const url = `${this.GEMINI_URL}/${this.GEMINI_VERSION}:generateContent?key=${key}`;
    const payload = {
      contents: [{
        parts: [
          { text: GEMINI_PROMPTS },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.0
      }
    };
    return this.http.post<any>(url, payload);
  }
}
