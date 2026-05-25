import { Pipe, type PipeTransform } from '@angular/core';
import { SearchFilters } from '@piuscores/interfaces/search-filters';

@Pipe({
  name: 'shortHand',
})
export class ShortHandPipe implements PipeTransform {
  transform(value: SearchFilters): string {
    return value.chartType.at(0)! + value.level;
  }
}
