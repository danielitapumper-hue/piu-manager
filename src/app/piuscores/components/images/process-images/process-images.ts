import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { ProcessImagesService, ScanItem } from '@piuscores/services/process-images-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

@Component({
  selector: 'process-images',
  imports: [ReactiveFormsModule],
  templateUrl: './process-images.html',
})
export class ProcessImages {
  private fb = inject(FormBuilder);
  private piuscoresService = inject(PiuscoresService);
  private processImagesService = inject(ProcessImagesService);

  files = input.required<File[]>();

  scanItems = signal<ScanItem[]>([]);

  readonly chartTypes = PiuSongsUtils.chartTypes;
  readonly plateOptions = PiuSongsUtils.plateOptions;

  ngOnDestroy(): void {
    // Clean up all object URLs to prevent leaks
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
  }

  //Efecto para tomar los cambios en this.files()
  filesEffect = effect(() => this.processFiles());

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
      plate: plate ?? null,
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

  private processFiles() {
    const files = this.files();
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

  private triggerScan(item: ScanItem): void {
    item.status = 'scanning';
    this.scanItems.update(items => [...items]);

    this.processImagesService.fileToBase64(item.file).then(base64Data => {
      this.processImagesService.postImage(item, base64Data)?.subscribe({
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
              const matchedOption = PiuSongsUtils.getPlateKey(data.plate);
              //this.plateOptions.find(opt => opt.value.toLowerCase() === data.plate.toLowerCase());
              if (matchedOption) {
                plateKey = matchedOption;
              }
            }

            item.form.patchValue({
              songName: data.songName || 'Unknown Song',
              chartType: data.chartType === 'Double' ? ChartType.Double : ChartType.Single,
              chartLevel: data.chartLevel || PiuSongsUtils.minLevel,
              score: data.score ?? null,
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
}
