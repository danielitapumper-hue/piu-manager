import { Component, input } from '@angular/core';
import { Chart } from '@piuscores/interfaces/piuscores-services/piuscores-interfaces';

@Component({
  selector: 'song-card',
  imports: [],
  templateUrl: './song-card.html',
})
export class SongCard {
  chart = input.required<Chart>()
}
