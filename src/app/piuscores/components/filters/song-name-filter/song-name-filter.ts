import { Component, output } from '@angular/core';

@Component({
  selector: 'song-name-filter',
  templateUrl: './song-name-filter.html',
})
export class SongNameFilter {
  songNameFilter = output<string>();

  searchBySongName(songName: string) {
    this.songNameFilter.emit(songName);
  }
}
