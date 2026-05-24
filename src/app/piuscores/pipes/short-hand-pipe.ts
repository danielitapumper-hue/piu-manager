import { Pipe, type PipeTransform } from '@angular/core';
import { SavedFilter } from '@piuscores/interfaces/saved-filter';

@Pipe({
  name: 'shortHand',
})
export class ShortHandPipe implements PipeTransform {
  transform(value: SavedFilter): string {
    return value.chartType.at(0)! + value.level;
  }
}
