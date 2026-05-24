import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'chartType',
})
export class ChartTypePipe implements PipeTransform {
  transform(value: string): string {
    const valueArray = value.split('-');
    return valueArray[0].at(0) + valueArray[1];
  }
}
