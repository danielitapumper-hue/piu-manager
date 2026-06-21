import { Component, effect, inject, output, signal } from '@angular/core';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { PiuSongsUtils } from '@piuscores/utils/piu-songs-utils';
import { LocalStorageService } from '@shared/services/local-storage-service';

@Component({
  selector: 'song-types-filter',
  templateUrl: './song-types-filter.html',
})
export class SongTypesFilter {
  piuScoresService = inject(PiuscoresService);
  localStorageService = inject(LocalStorageService);

  songTypesFilter = output<boolean[]>();
  songTypesValue = signal<boolean[]>(this.localStorageService.lastFilter().songTypes);

  readonly songTypes = PiuSongsUtils.songTypes;

  changeFilterEffect = effect(() => {
    const lastFilter = this.localStorageService.lastFilter();
    this.songTypesValue.set(lastFilter.songTypes);
  });

  toggleSongType(index: number) {
    const current = [...this.songTypesValue()];
    current[index] = !current[index];
    this.songTypesValue.set(current);
    this.songTypesFilter.emit(current);
    this.localStorageService.setLocalStorageLastSongTypesFilter(current);
  }
}
