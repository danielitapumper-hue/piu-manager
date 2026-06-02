import { Component, inject, output } from '@angular/core';
import { SearchFiltersForm } from './search-filters-form/search-filters-form';
import { SavedFilters } from './saved-filters/saved-filters';
import { SearchByNameFilter } from './search-by-name-filter/search-by-name-filter';
import { StagePassFilter } from './stage-pass-filter/stage-pass-filter';
import { SongTypesFilter } from './song-types-filter/song-types-filter';
import { SearchFilters } from '@piuscores/interfaces/search-filters';

@Component({
  selector: 'app-filters',
  imports: [SearchFiltersForm, SavedFilters, SearchByNameFilter, StagePassFilter, SongTypesFilter],
  templateUrl: './filters.html',
})
export class Filters {
  searchFilters = output<SearchFilters>();
  songTypesFilter = output<boolean[]>();
  stagePassFilter = output<boolean | null>();
  savedFilter = output<string>();
  songNameFilter = output<string>();

  search(searchFilters: SearchFilters) {
    this.searchFilters.emit(searchFilters);
  }

  searchBySongTypes(songTypes: boolean[]) {
    this.songTypesFilter.emit(songTypes);
  }

  searchByStagePass(stagePass: boolean | null) {
    this.stagePassFilter.emit(stagePass);
  }

  searchSavedFilter(savedFilter: string) {
    this.savedFilter.emit(savedFilter);
  }

  searchBySongName(songName: string) {
    this.songNameFilter.emit(songName);
  }
}
