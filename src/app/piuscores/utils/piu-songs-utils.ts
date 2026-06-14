import { AbstractControl, ValidationErrors } from "@angular/forms";
import { Plate } from "@piuscores/interfaces/piuscores-services/phoenix-scores-response";
import { ChartType, SongType, Category } from "@piuscores/interfaces/piuscores-services/piuscores-interfaces";

export class PiuSongsUtils {
  static maxScore: number = 1_000_000;
  static minLevel: number = 1;
  static maxLevel: number = 29;

  static chartTypes = Object.values(ChartType);
  static songTypes = Object.values(SongType);
  static categories = Object.entries(Category).map(([key, value]) => ({ key, value }));
  static plateOptions = Object.entries(Plate).map(([key, value]) => ({ key, value }));

  static plateRequiredWhenBrokenValidator(group: AbstractControl): ValidationErrors | null {
    const isBroken = group.get('isBroken')?.value;
    const plate = group.get('plate')?.value;

    if (isBroken === false && !plate) {
      return { plateRequired: true };
    }

    return null;
  }
}
