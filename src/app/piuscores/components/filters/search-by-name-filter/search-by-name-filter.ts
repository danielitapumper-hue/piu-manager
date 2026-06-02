import { Component, output } from '@angular/core';

@Component({
  selector: 'search-by-name-filter',
  templateUrl: './search-by-name-filter.html',
})
export class SearchByNameFilter {
  songNameFilter = output<string>();

  searchBySongName(songName: string) {
    this.songNameFilter.emit(songName);
  }
}
