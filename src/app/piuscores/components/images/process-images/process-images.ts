import { Component, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap } from 'rxjs/operators';
import { ChartType } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { ScanItem, ScanStatus } from '@gemini/interfaces/files/scan-item';
import { ProcessImagesService } from '@gemini/services/process-images-service';
import { ProcessImagesItem } from '../process-images-item/process-images-item';

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

  private scanQueue = new Subject<ScanItem>();
  private saveQueue = new Subject<ScanItem>();

  constructor() {
    this.scanQueue.pipe(
      takeUntilDestroyed(),
      concatMap(item => this.triggerScan(item))
    ).subscribe();

    this.saveQueue.pipe(
      takeUntilDestroyed(),
      concatMap(item => this.processSave(item))
    ).subscribe();
  }

  ngOnDestroy() {
    // Clean up all object URLs to prevent leaks
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
  }

  //Efecto para tomar los cambios en this.files()
  filesEffect = effect(() => this.processFiles());

  saveItem(itemToSave: ScanItem) {
    if (!itemToSave.scoreRequest)
      return;

    this.updateItemState(itemToSave.id, {
      scoreRequest: itemToSave.scoreRequest,
      status: ScanStatus.Saving
    });

    this.saveQueue.next(itemToSave);
  }

  private processSave(itemToSave: ScanItem): Observable<void> {
    return of(null).pipe(
      switchMap(() => {
        const item = this.scanItems().find(i => i.id === itemToSave.id);
        if (!item || !item.scoreRequest) {
          throw new Error('Item no encontrado o sin request');
        }
        return this.piuscoresService.postScore(item.scoreRequest, true);
      }),
      tap({
        next: () => this.updateItemState(itemToSave.id, { status: ScanStatus.Saved }),
        error: (err) => this.updateItemState(itemToSave.id, {
          status: ScanStatus.Error,
          errorMessage: err?.message || 'Error al guardar el score'
        })
      }),
      map(() => void 0),
      catchError(err => {
        this.updateItemState(itemToSave.id, {
          status: ScanStatus.Error,
          errorMessage: err.message || 'Error al guardar el score'
        });
        return of(void 0);
      })
    );
  }

  updateFormValidItem(item: ScanItem) {
    this.updateItemState(item.id, { formValid: item.formValid });
  }

  saveAllReady() {
    const readyItems = this.getReadyItems();

    if (readyItems.length === 0) {
      return;
    }

    readyItems.forEach(item => this.saveItem(item));
  }

  getReadyItems(): ScanItem[] {
    return this.scanItems().filter(item =>
      (item.status === ScanStatus.Success || item.status === ScanStatus.Error) && item.formValid
    );
  }

  removeItem(item: ScanItem) {
    URL.revokeObjectURL(item.previewUrl);
    this.scanItems.update(items => items.filter(i => i.id !== item.id));
  }

  rescanItem(item: ScanItem) {
    this.updateItemState(item.id, {
      status: ScanStatus.Pending,
      errorMessage: undefined,
      scoreRequest: undefined
    });
    this.scanQueue.next(item);
  }

  clearAll() {
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
    this.scanItems.set([]);
  }

  private processFiles() {
    const files = this.files();
    const newItems: ScanItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = PiuSongsUtils.generateId();

      const newItem: ScanItem = {
        id,
        file,
        previewUrl,
        status: ScanStatus.Pending
      };

      newItems.push(newItem);
    }

    if (newItems.length > 0) {
      this.scanItems.update(items => [...newItems, ...items]);
      newItems.forEach(item => this.scanQueue.next(item));
    }
  }

  private triggerScan(item: ScanItem): Observable<void> {
    return new Observable<void>(observer => {
      this.updateItemState(item.id, { status: ScanStatus.Scanning });
      observer.next();
      observer.complete();
    }).pipe(
      switchMap(() => this.processImagesService.fileToBase64(item.file)),
      switchMap(base64Data => {
        const req = this.processImagesService.postImage(item.file.type, base64Data);
        if (!req) {
          throw new Error('No se pudo generar la petición');
        }
        return req;
      }),
      tap({
        next: (response) => {
          try {
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) {
              throw new Error('No text response received from API');
            }
            const data = JSON.parse(textResponse);

            let plateKey = '';
            if (data.plate) {
              const matchedOption = PiuSongsUtils.getPlateKey(data.plate);
              if (matchedOption) {
                plateKey = matchedOption;
              }
            }

            this.updateItemState(item.id, {
              status: ScanStatus.Success,
              scoreRequest: {
                songName: data.songName || 'Unknown Song',
                chartType: data.chartType === 'Double' ? ChartType.Double : ChartType.Single,
                chartLevel: data.chartLevel || PiuSongsUtils.minLevel,
                score: data.score ?? null,
                plate: plateKey,
                isBroken: data.isBroken === true
              }
            });
          } catch (err) {
            this.updateItemState(item.id, {
              status: ScanStatus.Error,
              errorMessage: 'Error al parsear el resultado de la imagen: ' + (err as Error).message
            });
          }
        },
        error: (err) => {
          this.updateItemState(item.id, {
            status: ScanStatus.Error,
            errorMessage: err.error?.error?.message || err.message || 'Error en la llamada de red a la API de Gemini'
          });
        }
      }),
      map(() => void 0),
      catchError(err => {
        this.updateItemState(item.id, {
          status: ScanStatus.Error,
          errorMessage: err.message || 'Error general en el escaneo'
        });
        return of(void 0);
      })
    );
  }

  private updateItemState(id: string, updates: Partial<ScanItem>) {
    this.scanItems.update(items =>
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  }
}

