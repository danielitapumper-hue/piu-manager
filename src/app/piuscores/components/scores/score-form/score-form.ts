import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ChartScore } from '@piuscores/interfaces/chart-score';
import { ScoreRequest } from '@piuscores/interfaces/piuscores-services/score-request';
import { Score } from '@piuscores/interfaces/score';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';

@Component({
  selector: 'score-form',
  imports: [ReactiveFormsModule],
  templateUrl: './score-form.html',
})
export class ScoreForm implements OnInit {
  fb = inject(FormBuilder);
  piuscoresService = inject(PiuscoresService);

  chartScore = input.required<ChartScore>();
  scoreSaved = output<Score | undefined>();

  isLoading = signal<boolean>(false);

  submitted = false;
  scoreForm!: ReturnType<FormBuilder['group']>;
  previousScoreValue = '';

  readonly plateOptions = PiuSongsUtils.plateOptions;

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
          if (plateKey === PiuSongsUtils.perfectGameKey) {
            this.scoreForm.get('score')?.setValue(PiuSongsUtils.maxScore);
            this.previousScoreValue = PiuSongsUtils.maxScore.toString();
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

    const { score, plate, isBroken } = this.scoreForm.value;
    const scoreRequest: ScoreRequest = {
      chartLevel: this.chartScore().chart.level,
      chartType: this.chartScore().chart.type,
      isBroken: isBroken == true,
      plate: plate != '' ? plate : null,
      score: score ?? null,
      songName: this.chartScore().chart.song.name
    };

    this.piuscoresService.postScore(scoreRequest).subscribe(() => {
      const updatedScore: Score | undefined = scoreRequest.score
        ? {
          ...this.chartScore().score,
          letterGrade: PiuSongsUtils.getLetterGradeByScore(scoreRequest.score),
          score: scoreRequest.score,
          plate: PiuSongsUtils.getPlateValue(scoreRequest.plate) ?? null,
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
    if (numVal > PiuSongsUtils.maxScore) {
      this.scoreForm.get('score')?.setValue(this.previousScoreValue);
      return;
    }

    const sanitizedVal = numVal.toString();
    this.scoreForm.get('score')?.setValue(sanitizedVal);
    this.previousScoreValue = sanitizedVal;
  }

  private buildForm() {
    return this.fb.group({
      score: [
        this.chartScore().score?.score ?? null,
        [Validators.required, Validators.min(0), Validators.max(PiuSongsUtils.maxScore)]
      ],
      plate: [PiuSongsUtils.getPlateKey(this.chartScore().score?.plate) ?? ''],
      isBroken: [this.chartScore().score ? this.chartScore().score!.isBroken : true]
    }, {
      validators: [PiuSongsUtils.plateRequiredWhenBrokenValidator]
    });
  }
}
