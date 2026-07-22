import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortHandImage',
})
export class ShortHandImagePipe implements PipeTransform {
  transform(value: string, mix: string | null): string {
    const mixFolder = mix ? `${mix}` : 'Phoenix';
    return `https://piuimages.arroweclip.se/difficulty/${mixFolder}/${value.toLowerCase()}.png`;
  }
}
