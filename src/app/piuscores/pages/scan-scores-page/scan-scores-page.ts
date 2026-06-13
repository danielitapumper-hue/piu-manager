import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PiuscoresService } from '../../services/piuscores-service';
import { ChartType } from '../../interfaces/piuscores-services/piuscores-interfaces';
import { Plate } from '../../interfaces/piuscores-services/phoenix-scores-response';
import { ScoreRequest } from '../../interfaces/piuscores-services/score-request';
import { Title } from "@piuscores/components/title/title";

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
  imports: [ReactiveFormsModule, Title],
  templateUrl: './scan-scores-page.html',
})
export class ScanScoresPage implements OnDestroy {
  private fb = inject(FormBuilder);
  private piuscoresService = inject(PiuscoresService);

  scanItems = signal<ScanItem[]>([]);
  isDragOver = signal<boolean>(false);

  chartTypeOptions = Object.values(ChartType);
  plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));

  ngOnDestroy(): void {
    // Clean up all object URLs to prevent leaks
    this.scanItems().forEach(item => URL.revokeObjectURL(item.previewUrl));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
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

  private processFiles(files: FileList): void {
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
        chartLevel: [10, [Validators.required, Validators.min(1), Validators.max(29)]],
        score: [null as number | null, [Validators.required, Validators.min(0), Validators.max(1000000)]],
        plate: [''],
        isBroken: [false]
      }, {
        validators: [this.plateRequiredWhenBrokenValidator]
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
            form.get('score')?.setValue(1000000);
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

    // Simulate API delay
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

  private plateRequiredWhenBrokenValidator(group: AbstractControl): ValidationErrors | null {
    const isBroken = group.get('isBroken')?.value;
    const plate = group.get('plate')?.value;

    if (isBroken === false && !plate) {
      return { plateRequired: true };
    }

    return null;
  }
}
