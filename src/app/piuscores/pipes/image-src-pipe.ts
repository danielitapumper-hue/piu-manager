import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageSrc',
})
export class ImageSrcPipe implements PipeTransform {
  transform(value: string): string {
    return `./assets/images/${value}.png`;
  }
}
