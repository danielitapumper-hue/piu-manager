import { Component, effect, inject, input, signal } from '@angular/core';
import { ScanItem } from '@piuscores/interfaces/files/scan-item';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { ProcessImagesService } from '@piuscores/services/process-images-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { ProcessImagesItem } from "../process-images-item/process-images-item";

@Component({
  selector: 'process-images',
  imports: [ProcessImagesItem],
  templateUrl: './process-images.html',
})
export class ProcessImages {
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

  saveItem(itemToSave: ScanItem): void {
    let updatedItem = this.scanItems().find(item => item.id === itemToSave.id);

    if (!updatedItem || !itemToSave.scoreRequest)
      return;

    updatedItem.scoreRequest = itemToSave.scoreRequest;
    updatedItem.status = 'saving';
    this.scanItems.update(items => [...items]);

    this.piuscoresService.postScore(updatedItem.scoreRequest).subscribe({
      next: () => {
        updatedItem.status = 'saved';
        this.scanItems.update(items => [...items]);
      },
      error: (err) => {
        updatedItem.status = 'error';
        updatedItem.errorMessage = err?.message || 'Error al guardar el score';
        this.scanItems.update(items => [...items]);
      }
    });
  }

  updateFormValidItem(item: ScanItem) {
    let formValidItem = this.scanItems().find(item => item.id === item.id);
    if (!formValidItem)
      return;
    formValidItem.formValid = item.formValid;
    this.scanItems.update(items => [...items]);
  }

  saveAllReady(): void {
    const readyItems = this.getReadyItems();

    if (readyItems.length === 0) {
      return;
    }

    readyItems.forEach(item => this.saveItem(item));
  }

  getReadyItems() {
    return this.scanItems().filter(item =>
      (item.status === 'success' || item.status === 'error') && item.formValid
    );
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

      const newItem: ScanItem = {
        id,
        file,
        previewUrl,
        status: 'pending'
      };

      this.scanItems.update(items => [...items, newItem]);
      this.triggerScan(newItem);
    }
  }

  private triggerScan(item: ScanItem): void {
    item.status = 'scanning';
    this.scanItems.update(items => [...items]);

    this.processImagesService.fileToBase64(item.file).then(base64Data => {
      this.processImagesService.postImage(item.file.type, base64Data)?.subscribe({
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

            item.scoreRequest = {
              songName: data.songName || 'Unknown Song',
              chartType: data.chartType === 'Double' ? ChartType.Double : ChartType.Single,
              chartLevel: data.chartLevel || PiuSongsUtils.minLevel,
              score: data.score ?? null,
              plate: plateKey,
              isBroken: data.isBroken === true
            };
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
