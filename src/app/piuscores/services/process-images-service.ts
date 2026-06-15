import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage-service';

@Injectable({
  providedIn: 'root',
})
export class ProcessImagesService {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);

  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly GEMINI_VERSION = 'gemini-2.5-flash';

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
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
          { text: this.getGeminiPrompt() },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };
    return this.http.post<any>(url, payload);
  }

  private getGeminiPrompt(): string {
    return `You are an expert OCR and data extraction agent for the arcade game Pump It Up (Phoenix version).
  Analyze the provided image containing a screenshot of the game results screen and extract the data to populate a ScoreRequest JSON object.

  Follow these rules strictly:
  1. **chartLevel**: Locate the tilted oval (inclined to the left, red or green). Extract the number in the center as an integer.
  2. **chartType**: Look at the text inside the tilted oval: "SINGLE" or "DOUBLE". Alternatively, if the oval is green, set to "Double". If the oval is red, set to "Single".
  3. **score**: Find the score number next to the oval (to the right or left). It is a number from 0 to 1000000 located right under the word "SCORE". Do NOT include the smaller number starting with a "+" located below/near it.
  4. **isBroken**: Locate the large letters representing the grade (e.g., SSS+, SS, A+, etc.). Look at their texture/color:
     - If they are grey with a stone-like/cracked texture, set isBroken to true.
     - If they are colored (e.g., yellow, orange, blue, red) or shiny silver without a cracked stone texture, set isBroken to false.
  5. **plate**: If isBroken is true, set plate to null. If isBroken is false, look right below the grade letters for a text that represents the plate. Map it to one of these exact string values: "Rough Game", "Fair Game", "Talented Game", "Marvelous Game", "Superb Game", "Extreme Game", "Ultimate Game", "Perfect Game". If none is found, set to null.
  6. **songName**: Extract the song title located right above the chart oval. It is written in white letters inside a semi-transparent blue box.

  Return ONLY a JSON object with this structure:
  {
    "songName": string,
    "chartType": "Single" | "Double",
    "chartLevel": number,
    "score": number,
    "isBroken": boolean,
    "plate": string | null
  }`;
  }
}
