import { Component, inject, signal, OnDestroy, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { Title } from "@piuscores/components/title/title";
import { LocalStorageService } from '@piuscores/services/local-storage-service';
import { GeminiApiKeyConfig } from "@piuscores/components/gemini-api-key/gemini-api-key-config/gemini-api-key-config";
import { UploadImages } from "@piuscores/components/images/upload-images/upload-images";
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

interface ScanItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'scanning' | 'success' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
  form: FormGroup;
}

@Component({
  selector: 'app-scan-scores-page',
  imports: [ReactiveFormsModule, Title, GeminiApiKeyConfig, UploadImages],
  templateUrl: './scan-scores-page.html',
})
export class ScanScoresPage implements OnDestroy {
  private fb = inject(FormBuilder);
  private piuscoresService = inject(PiuscoresService);
  private localStorageService = inject(LocalStorageService);
  private http = inject(HttpClient);

  scanItems = signal<ScanItem[]>([]);
  geminiApiKey = computed<string>(() => this.localStorageService.geminiApiKey());

  chartTypes = PiuSongsUtils.chartTypes;
  plateOptions = PiuSongsUtils.plateOptions;

  ngOnDestroy(): void {
    // Clean up all object URLs to prevent leaks
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
  }

  saveItem(item: ScanItem): void {
    if (item.form.invalid || item.status === 'saving' || item.status === 'saved') {
      return;
    }

    item.status = 'saving';
    this.scanItems.update(items => [...items]);

    const { songName, chartType, chartLevel, score, plate, isBroken } = item.form.value;

    const scoreRequest: ScoreRequest = {
      songName,
      chartType,
      chartLevel,
      score: score ? Number(score) : null,
      plate: plate ? plate : null,
      isBroken: isBroken === true
    };

    this.piuscoresService.postScore(scoreRequest).subscribe({
      next: () => {
        item.status = 'saved';
        item.form.disable();
        this.scanItems.update(items => [...items]);
      },
      error: (err) => {
        item.status = 'error';
        item.errorMessage = err?.message || 'Error al guardar el score';
        this.scanItems.update(items => [...items]);
      }
    });
  }

  saveAllReady(): void {
    const readyItems = this.scanItems().filter(item =>
      (item.status === 'success' || item.status === 'error') && item.form.valid
    );

    if (readyItems.length === 0) {
      return;
    }

    readyItems.forEach(item => this.saveItem(item));
  }

  removeItem(item: ScanItem): void {
    URL.revokeObjectURL(item.previewUrl);
    this.scanItems.update(items => items.filter(i => i.id !== item.id));
  }

  clearAll(): void {
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
    this.scanItems.set([]);
  }

  processFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

      const form = this.fb.group({
        songName: ['', Validators.required],
        chartType: [ChartType.Single, Validators.required],
        chartLevel: [PiuSongsUtils.minLevel, [
          Validators.required,
          Validators.min(PiuSongsUtils.minLevel),
          Validators.max(PiuSongsUtils.maxLevel)
        ]],
        score: [null as number | null, [Validators.required, Validators.min(0), Validators.max(PiuSongsUtils.maxScore)]],
        plate: [''],
        isBroken: [false]
      }, {
        validators: [PiuSongsUtils.plateRequiredWhenBrokenValidator]
      });

      // Listen for isBroken and plate changes, just like in score-form
      form.get('isBroken')!.valueChanges.subscribe((isBroken) => {
        if (isBroken) {
          form.get('plate')?.setValue('');
        }
      });

      form.get('plate')!.valueChanges.subscribe((plateKey) => {
        if (plateKey) {
          const perfectGameKey = this.plateOptions.find(item => item.value === Plate.PerfectGame)?.key;
          if (plateKey === perfectGameKey) {
            form.get('score')?.setValue(PiuSongsUtils.maxScore);
          }
          form.get('isBroken')?.setValue(false);
        }
      });

      const newItem: ScanItem = {
        id,
        file,
        previewUrl,
        status: 'pending',
        form
      };

      this.scanItems.update(items => [...items, newItem]);
      this.triggerScan(newItem);
    }
  }

  private fileToBase64(file: File): Promise<string> {
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

  private triggerScan(item: ScanItem): void {
    item.status = 'scanning';
    this.scanItems.update(items => [...items]);

    const key = this.geminiApiKey();
    if (!key) {
      // Fallback to simulation mode using filename parser
      setTimeout(() => {
        const parsed = this.parseFilename(item.file.name);

        item.form.patchValue({
          songName: parsed.songName,
          chartType: parsed.chartType,
          chartLevel: parsed.chartLevel,
          score: parsed.score,
          plate: parsed.plate ? this.plateOptions.find(opt => opt.value === parsed.plate)?.key : '',
          isBroken: parsed.isBroken
        });

        item.status = 'success';
        this.scanItems.update(items => [...items]);
      }, 1500);
      return;
    }

    this.fileToBase64(item.file).then(base64Data => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: this.getGeminiPrompt() },
              {
                inlineData: {
                  mimeType: item.file.type,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };

      this.http.post<any>(url, payload).subscribe({
        next: (response) => {
          try {
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) {
              throw new Error('No text response received from API');
            }
            const data = JSON.parse(textResponse);

            // Map the plate string back to the key (RoughGame, PerfectGame, etc.)
            let plateKey = '';
            if (data.plate) {
              const matchedOption = this.plateOptions.find(opt => opt.value.toLowerCase() === data.plate.toLowerCase());
              if (matchedOption) {
                plateKey = matchedOption.key;
              }
            }

            item.form.patchValue({
              songName: data.songName || 'Unknown Song',
              chartType: data.chartType === 'Double' ? ChartType.Double : ChartType.Single,
              chartLevel: data.chartLevel || 10,
              score: data.score !== undefined ? data.score : null,
              plate: plateKey,
              isBroken: data.isBroken === true
            });
            item.status = 'success';
          } catch (err) {
            item.status = 'error';
            item.errorMessage = 'Error al parsear el resultado de la imagen: ' + (err as Error).message;
          }
          this.scanItems.update(items => [...items]);
        },
        error: (err) => {
          item.status = 'error';
          item.errorMessage = err.error?.error?.message || err.message || 'Error en la llamada de red a la API de Gemini';
          this.scanItems.update(items => [...items]);
        }
      });
    }).catch(err => {
      item.status = 'error';
      item.errorMessage = 'No se pudo leer el archivo: ' + err.message;
      this.scanItems.update(items => [...items]);
    });
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

  private parseFilename(filename: string): {
    songName: string;
    chartType: ChartType;
    chartLevel: number;
    score: number | null;
    plate: string | null;
    isBroken: boolean;
  } {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const cleanName = nameWithoutExt.replace(/[_-]/g, ' ');

    const result = {
      songName: 'Unknown Song',
      chartType: ChartType.Single,
      chartLevel: 10,
      score: null as number | null,
      plate: null as string | null,
      isBroken: false
    };

    // 1. Chart type and level (e.g. S18, D21, d23, s4)
    const chartMatch = cleanName.match(/\b([SDsd])(\d{1,2})\b/);
    if (chartMatch) {
      const typeChar = chartMatch[1].toUpperCase();
      result.chartType = typeChar === 'D' ? ChartType.Double : ChartType.Single;
      result.chartLevel = parseInt(chartMatch[2], 10);
    }

    // 2. Score (6 to 7 digits, e.g. 985000, 1000000)
    const scoreMatch = cleanName.match(/\b(\d{6,7})\b/);
    if (scoreMatch) {
      const scoreVal = parseInt(scoreMatch[1], 10);
      if (scoreVal >= 0 && scoreVal <= 1000000) {
        result.score = scoreVal;
      }
    }

    // 3. Is Broken
    if (/broken|break|broke|fail|roto/i.test(cleanName)) {
      result.isBroken = true;
    }

    // 4. Default Plate based on score if pass
    if (result.score !== null) {
      if (result.score === 1000000) {
        result.plate = Plate.PerfectGame;
      } else if (result.score >= 995000) {
        result.plate = Plate.UltimateGame;
      } else if (result.score >= 990000) {
        result.plate = Plate.ExtremeGame;
      } else if (result.score >= 985000) {
        result.plate = Plate.SuperbGame;
      } else if (result.score >= 975000) {
        result.plate = Plate.MarvelousGame;
      } else if (result.score >= 950000) {
        result.plate = Plate.TalentedGame;
      } else if (result.score >= 900000) {
        result.plate = Plate.FairGame;
      } else {
        result.plate = Plate.RoughGame;
      }
    }

    // 5. Song Name (first segment before any metadata tokens)
    const tokens = nameWithoutExt.split(/[_\-\s]+/);
    if (tokens.length > 0 && tokens[0].trim().length > 0) {
      const possibleName = tokens[0].trim();
      if (!possibleName.match(/^[SDsd]\d+$/) && !possibleName.match(/^\d+$/)) {
        result.songName = possibleName;
      }
    }

    // Improve song name extraction if there are multiple parts before Dxx/Sxx
    const chartIndex = cleanName.search(/\b([SDsd])(\d{1,2})\b/);
    if (chartIndex > 0) {
      const songPart = cleanName.substring(0, chartIndex).trim();
      if (songPart.length > 0) {
        result.songName = songPart;
      }
    } else {
      const words = cleanName.split(/\s+/);
      const nameParts = [];
      for (const w of words) {
        if (w.match(/\b\d{6,7}\b/) || w.match(/\b[SDsd]\d{1,2}\b/) || /broken|break|broke|fail|roto/i.test(w)) {
          break;
        }
        nameParts.push(w);
      }
      if (nameParts.length > 0) {
        result.songName = nameParts.join(' ');
      }
    }

    return result;
  }
}
