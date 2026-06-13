import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { Plate } from '@piuscores/interfaces/piuscores-services/phoenix-scores-response';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { Score } from '@piuscores/interfaces/score';
import { PiuscoresService } from '@piuscores/services/piuscores-service';

@Component({
  selector: 'score-form',
  imports: [ReactiveFormsModule],
  templateUrl: './score-form.html',
})
export class ScoreForm implements OnInit {
  chartScore = input.required<ChartScore>();
  scoreSaved = output<Score | undefined>();

  fb = inject(FormBuilder);
  piuscoresService = inject(PiuscoresService);

  isLoading = signal<boolean>(false);

  private readonly maxScore: number = 1_000_000;

  submitted = false;
  plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));
  scoreForm!: ReturnType<FormBuilder['group']>;
  previousScoreValue = '';

  ngOnInit(): void {
    this.scoreForm = this.buildForm();
    this.previousScoreValue = this.chartScore().score?.score?.toString() ?? '';

    this.scoreForm.get('isBroken')!.valueChanges
      .subscribe((isBroken) => {
        if (isBroken)
          this.scoreForm.get('plate')?.setValue('');
      });

    this.scoreForm.get('plate')!.valueChanges
      .subscribe((plateKey) => {
        if (plateKey) {
          const perfectGameKey = this.plateOptions.find(item => item.value === Plate.PerfectGame)?.key;
          if (plateKey === perfectGameKey) {
            this.scoreForm.get('score')?.setValue(this.maxScore);
            this.previousScoreValue = this.maxScore.toString();
          }
          this.scoreForm.get('isBroken')?.setValue(false);
        }
      });
  }

  formSubmit() {
    this.submitted = true;
    this.scoreForm.markAllAsTouched();

    if (this.scoreForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const scoreRequest: ScoreRequest = {
      chartLevel: this.chartScore().chart.level,
      chartType: this.chartScore().chart.type,
      isBroken: this.scoreForm.value.isBroken == true,
      plate: this.scoreForm.value.plate ? this.scoreForm.value.plate : null,
      score: this.scoreForm.value.score ? this.scoreForm.value.score : null,
      songName: this.chartScore().chart.song.name
    };

    this.piuscoresService.postScore(scoreRequest).subscribe(() => {
      const updatedScore: Score | undefined = scoreRequest.score
        ? {
          ...this.chartScore().score,
          letterGrade: this.getLetterGradeByScore(scoreRequest.score),
          score: scoreRequest.score,
          plate: this.plateOptions.find(item => item.key === scoreRequest.plate)?.value ?? null,
          isBroken: scoreRequest.isBroken == true,
        } : undefined;

      this.scoreSaved.emit(updatedScore);
      this.isLoading.set(false);
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
      return;
    }

    const numVal = Number(value);
    if (numVal > this.maxScore) {
      this.scoreForm.get('score')?.setValue(this.previousScoreValue);
      return;
    }

    const sanitizedVal = numVal.toString();
    this.scoreForm.get('score')?.setValue(sanitizedVal);
    this.previousScoreValue = sanitizedVal;
  }

  private buildForm() {
    return this.fb.group({
      score: [this.chartScore().score?.score ?? null, [Validators.required, Validators.min(0), Validators.max(this.maxScore)]],
      plate: [this.chartScore().score?.plate ? this.plateOptions.find(item => item.value === this.chartScore().score?.plate)?.key : ''],
      isBroken: [this.chartScore().score ? this.chartScore().score!.isBroken : true]
    }, {
      validators: [this.plateRequiredWhenBrokenValidator]
    });
  }

  private plateRequiredWhenBrokenValidator(group: AbstractControl): ValidationErrors | null {
    const isBroken = group.get('isBroken')?.value;
    const plate = group.get('plate')?.value;

    if (isBroken === false && !plate) {
      return { plateRequired: true };
    }

    return null;
  }

  private getLetterGradeByScore(score: number): string {
    if (score >= 995_000)
      return 'SSS+';
    if (score >= 990_000)
      return 'SSS';
    if (score >= 985_000)
      return 'SS+';
    if (score >= 980_000)
      return 'SS';
    if (score >= 975_000)
      return 'S+';
    if (score >= 970_000)
      return 'S';
    if (score >= 960_000)
      return 'AAA+';
    if (score >= 950_000)
      return 'AAA';
    if (score >= 925_000)
      return 'AA+';
    if (score >= 900_000)
      return 'AA';
    if (score >= 825_000)
      return 'A+';
    if (score >= 750_000)
      return 'A';
    if (score >= 700_000)
      return 'B';
    if (score >= 600_000)
      return 'C';
    if (score >= 450_000)
      return 'D';
    return 'F';
  }
}
