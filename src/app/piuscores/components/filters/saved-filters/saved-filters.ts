import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { SearchFilters } from '@piuscores/interfaces/search-filters';
import { ShortHandPipe } from '@piuscores/pipes/short-hand-pipe';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { LocalStorageService } from '@shared/services/local-storage-service';
import { ToastService } from '@shared/services/toast-service';
import { catchError, concatMap, from, map, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'saved-filters',
  imports: [ShortHandPipe],
  templateUrl: './saved-filters.html',
})
export class SavedFilters {
  piuScoresService = inject(PiuscoresService);
  localStorageService = inject(LocalStorageService);
  toastService = inject(ToastService);
  destroyRef = inject(DestroyRef);

  filter = output<string>();

  isEditMode = signal<boolean>(false);
  isLoadingUpdate = signal<boolean>(false);
  savedFiltersArray = computed<SearchFilters[]>(() =>
    Array.from(this.localStorageService.savedFilters().keys())
      .map(charTypeLevelKey => this.localStorageService.charTypeLevelKeyToSearchFilter(charTypeLevelKey))
      .sort((a, b) => a.level - b.level)
      .sort((a, b) => b.chartType.localeCompare(a.chartType)));
  processingItemNumber = signal<number>(0);
  loadingUpdateText = computed<string>(() => `${this.processingItemNumber()}/${this.savedFiltersArray().length}`)

  search(savedFilter: string) {
    this.filter.emit(savedFilter);
  }

  toggleEditMode() {
    this.isEditMode.update(value => !value);
  }

  delete(savedFilter: string) {
    this.localStorageService.deleteLocalStorageSavedFilter(savedFilter);
  }

  updateSavedFilters() {
    let ultimoFiltro: SearchFilters | null = null;
    this.isLoadingUpdate.set(true);
    this.processingItemNumber.set(1);
    from(this.savedFiltersArray()).pipe(
      concatMap(savedFilter => this.piuScoresService.getTierListWithScores(savedFilter).pipe(
        map(resp => {
          this.processingItemNumber.update(n => n + 1);
          return { savedFilter, resp, error: null };
        }),
        catchError(error => of({ savedFilter, resp: null, error }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ savedFilter, resp, error }) => {
        if (savedFilter.isLastFilter)
          ultimoFiltro = savedFilter;

        if (!resp) {
          console.error('Ocurrió un error al actualizar: ', error)
          return;
        }

        this.localStorageService.setLocalStorageSavedFilters(
          this.localStorageService.searchFiltersToChartTypeLevelKey(savedFilter),
          resp
        );
      },
      error: (err) => {
        console.error('Error fatal al actualizar filtros', err);
        this.isLoadingUpdate.set(false);
        this.processingItemNumber.set(0);
      },
      complete: () => {
        this.toastService.success('Se actualizaron los filtros correctamente.');
        this.isLoadingUpdate.set(false);
        this.processingItemNumber.set(0);
        if (ultimoFiltro?.filter)
          this.filter.emit(ultimoFiltro.filter!);
      }
    });
  }
}
