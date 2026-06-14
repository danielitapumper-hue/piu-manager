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
}
