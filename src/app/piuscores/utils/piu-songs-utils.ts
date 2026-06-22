import { AbstractControl, ValidationErrors } from "@angular/forms";
import { Plate } from "@piuscores/interfaces/piuscores-services/phoenix-scores-response";
import { ChartType, SongType, Category } from "@piuscores/interfaces/piuscores-services/piuscores-interfaces";
import { ChartScore } from "@piuscores/interfaces/chart-score";
import { CategoryCharts } from "@piuscores/interfaces/category-charts";
import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export class PiuSongsUtils {
  static maxScore: number = 1_000_000;
  static minLevel: number = 1;
  static maxLevel: number = 29;

  static chartTypes = Object.values(ChartType);
  static songTypes = Object.values(SongType);
  static categories = Object.entries(Category).map(([key, value]) => ({ key, value }));
  static plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));

  static perfectGameKey = PiuSongsUtils.plateOptions.find(item => item.value === Plate.PerfectGame)!.key;

  static getSongTypesFilter(songTypesFilter: boolean[]): SongType[] {
    return PiuSongsUtils.songTypes.filter((_, i) => songTypesFilter[i]);
  }

  static getPlateKey(plate: Plate | null | undefined): string | undefined {
    return PiuSongsUtils.plateOptions.find(item => item.value === plate)?.key;
  }

  static getPlateValue(plateKey: string | null): Plate | undefined {
    return PiuSongsUtils.plateOptions.find(item => item.key === plateKey)?.value;
  }

  static plateRequiredWhenBrokenValidator(group: AbstractControl): ValidationErrors | null {
    const isBroken = group.get('isBroken')?.value;
    const plate = group.get('plate')?.value;

    if (isBroken === false && !plate) {
      return { plateRequired: true };
    }

    return null;
  }

  static getLetterGradeByScore(score: number): string {
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

  static getScoresListByLetterGrade(
    scoresList: ChartScore[],
    songTypesFilterRaw: boolean[],
    songName: string
  ): CategoryCharts[] {
    if (scoresList.length === 0)
      return [];

    const scoresListByLetterGrade: CategoryCharts[] = [];
    const filteredScoresList = PiuSongsUtils.getFilteredScoresList(scoresList, songTypesFilterRaw, songName);
    const letterGrades = [...new Set(
      scoresList
        .filter(item => item.score)
        .map(item => item.score!.letterGrade)
        .sort((a, b) => a.localeCompare(b))
    )];

    for (const letterGrade of letterGrades) {
      const charts = PiuSongsUtils.getScoreListByLetterGrade(letterGrade, filteredScoresList);
      if (charts.length === 0)
        continue;

      scoresListByLetterGrade.push({
        category: letterGrade,
        charts: charts
      });
    }

    return scoresListByLetterGrade;
  }

  static getFilteredScoresList(
    scoresList: ChartScore[],
    songTypesFilterRaw: boolean[],
    songName: string
  ): ChartScore[] {
    const songTypesFilter = PiuSongsUtils.getSongTypesFilter(songTypesFilterRaw);
    return scoresList.filter(item => item.score &&
      songTypesFilter.includes(item.chart.song.type) &&
      (!songName || item.chart.song.name.toLowerCase().includes(songName.toLowerCase())));
  }

  static getScoreListByLetterGrade(letterGrade: string, filteredScoresList: ChartScore[]): ChartScore[] {
    return filteredScoresList
      .filter(item => item.score!.letterGrade === letterGrade)
      .sort((a, b) => a.score!.score - b.score!.score);
  }

  static generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
  }

  static setupScoreFormBehavior(
    isBrokenControl: AbstractControl<boolean | null>,
    plateControl: AbstractControl<string | null>,
    scoreControl: AbstractControl<number | null>,
    destroyRef: DestroyRef,
    updatePreviousScore?: (val: string) => void
  ): void {
    isBrokenControl.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((isBroken) => {
        if (isBroken)
          plateControl.setValue('');
      });

    plateControl.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((plateKey) => {
        if (plateKey) {
          if (plateKey === PiuSongsUtils.perfectGameKey) {
            scoreControl.setValue(PiuSongsUtils.maxScore);
            if (updatePreviousScore) {
              updatePreviousScore(PiuSongsUtils.maxScore.toString());
            }
          }
          isBrokenControl.setValue(false);
        }
      });
  }
}
