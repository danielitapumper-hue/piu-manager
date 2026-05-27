import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageSrc',
})
export class ImageSrcPipe implements PipeTransform {
  transform(value: string): unknown {
    return `./assets/images/${value}.png`;
  }
}
