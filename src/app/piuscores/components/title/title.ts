import { Component, input } from '@angular/core';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.html',
})
export class Title {
  title = input.required<string>();
  subTitle = input<string>('');
}
