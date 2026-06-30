import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { Score } from '@piuscores/interfaces/score';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { ToastService } from '@shared/services/toast-service';

interface ScoreFormGroup {
  score: FormControl<number | null>;
  plate: FormControl<string | null>;
  isBroken: FormControl<boolean | null>;
}

@Component({
  selector: 'score-form',
  imports: [ReactiveFormsModule],
  templateUrl: './score-form.html',
})
export class ScoreForm implements OnInit {
  fb = inject(FormBuilder);
  piuscoresService = inject(PiuscoresService);
  toastService = inject(ToastService);
  destroyRef = inject(DestroyRef);

  chartScore = input.required<ChartScore>();
  scoreSaved = output<Score | undefined>();

  isLoading = signal<boolean>(false);
  warningScore = signal<string>('');

  submitted = false;
  scoreForm!: FormGroup<ScoreFormGroup>;
  previousScoreValue = '';

  readonly plateOptions = PiuSongsUtils.plateOptions;

  ngOnInit(): void {
    this.scoreForm = this.buildForm();
    this.previousScoreValue = this.chartScore().score?.score?.toString() ?? '';

    PiuSongsUtils.setupScoreFormBehavior(
      this.scoreForm.controls.isBroken,
      this.scoreForm.controls.plate,
      this.scoreForm.controls.score,
      this.destroyRef,
      (val) => this.previousScoreValue = val
    );
  }

  formSubmit() {
    this.submitted = true;
    this.scoreForm.markAllAsTouched();

    if (this.scoreForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    const { score, plate, isBroken } = this.scoreForm.value;
    const scoreRequest: ScoreRequest = {
      chartLevel: this.chartScore().chart.level,
      chartType: this.chartScore().chart.type,
      isBroken: isBroken == true,
      plate: plate && plate !== '' ? plate : null,
      score: score ?? null,
      songName: this.chartScore().chart.song.name
    };

    this.piuscoresService.postScore(scoreRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        const updatedScore: Score | undefined = scoreRequest.score
          ? {
            ...this.chartScore().score,
            letterGrade: PiuSongsUtils.getLetterGradeByScore(scoreRequest.score),
            score: scoreRequest.score,
            plate: PiuSongsUtils.getPlateValue(scoreRequest.plate) ?? null,
            isBroken: scoreRequest.isBroken == true,
          } : undefined;

        this.toastService.success('Se actualizó el score correctamente');
        this.scoreSaved.emit(updatedScore);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (['+', '-', 'e', 'E', '.', ','].includes(event.key)) {
      event.preventDefault();
    }
  }

  onScoreInput(value: string) {
    if (value === '') {
      this.previousScoreValue = '';
      this.warningScore.set('');
      return;
    }

    const numVal = Number(value);
    if (numVal > PiuSongsUtils.maxScore) {
      this.scoreForm.controls.score.setValue(Number(this.previousScoreValue) || null);
      return;
    }

    if (this.chartScore()?.score?.score && numVal < this.chartScore()!.score!.score) {
      this.warningScore.set('El score que estás ingresando es menor al que ya tienes guardado.');
    }
    else {
      this.warningScore.set('');
    }

    const sanitizedVal = numVal.toString();
    this.scoreForm.controls.score.setValue(numVal);
    this.previousScoreValue = sanitizedVal;
  }

  private buildForm(): FormGroup<ScoreFormGroup> {
    return this.fb.group({
      score: [
        this.chartScore().score?.score ?? null,
        [Validators.required, Validators.min(0), Validators.max(PiuSongsUtils.maxScore)]
      ],
      plate: [PiuSongsUtils.getPlateKey(this.chartScore().score?.plate) ?? ''],
      isBroken: [this.chartScore().score ? this.chartScore().score!.isBroken : true]
    }, {
      validators: [PiuSongsUtils.plateRequiredWhenBrokenValidator]
    }) as FormGroup<ScoreFormGroup>;
  }
}
