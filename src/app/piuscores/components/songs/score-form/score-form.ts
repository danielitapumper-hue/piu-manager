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

  submitted = false;
  plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));
  scoreForm!: ReturnType<FormBuilder['group']>;

  ngOnInit(): void {
    this.scoreForm = this.buildForm();
    this.scoreForm.get('isBroken')!.valueChanges
      .subscribe((isBroken) => {
        if (isBroken)
          this.scoreForm.patchValue({ plate: '' });
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

  private buildForm() {
    return this.fb.group({
      score: [this.chartScore().score?.score ?? null, [Validators.required, Validators.min(0), Validators.max(1000000)]],
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
    if (score >= 995000)
      return 'SSS+';
    if (score >= 990000)
      return 'SSS';
    if (score >= 985000)
      return 'SS+';
    if (score >= 980000)
      return 'SS';
    if (score >= 975000)
      return 'S+';
    if (score >= 970000)
      return 'S';
    if (score >= 960000)
      return 'AAA+';
    if (score >= 950000)
      return 'AAA';
    if (score >= 925000)
      return 'AA+';
    if (score >= 900000)
      return 'AA';
    if (score >= 825000)
      return 'A+';
    if (score >= 750000)
      return 'A';
    if (score >= 700000)
      return 'B';
    if (score >= 600000)
      return 'C';
    if (score >= 450000)
      return 'D';
    return 'F';
  }
}
